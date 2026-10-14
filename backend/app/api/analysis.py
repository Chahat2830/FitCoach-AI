import json
import sqlite3
from pathlib import Path
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.services.cv.pose_detector import PoseDetector
from app.services.cv.complete_body_analyzer import CompleteBodyAnalyzer
from app.services.cv.body_scoring import BodyScoring
from app.services.ai.groq_service import (
    GroqConfigurationError,
    generate_fitness_recommendations,
)

router = APIRouter()
pose_detector = PoseDetector()

APP_DIR = Path(__file__).resolve().parents[1]
UPLOAD_DIR = APP_DIR / "uploads"
DB_PATH = APP_DIR / "fitness.db"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def get_latest_images():
    """Return the latest uploaded front, back, and side images."""
    image_paths = {}

    for view in ("front", "back", "side"):
        folder = UPLOAD_DIR / view
        if not folder.is_dir():
            raise HTTPException(
                status_code=400,
                detail=f"Upload folder for '{view}' view does not exist.",
            )

        images = [
            path for path in folder.iterdir()
            if path.is_file() and path.suffix.lower() in ALLOWED_EXTENSIONS
        ]

        if not images:
            raise HTTPException(
                status_code=400,
                detail=f"No image uploaded for '{view}' view.",
            )

        image_paths[view] = max(images, key=lambda path: path.stat().st_mtime)

    return (
        str(image_paths["front"]),
        str(image_paths["back"]),
        str(image_paths["side"]),
    )


def run_body_analysis():
    """Extract landmarks, analyze the body, and calculate scores."""
    front_path, back_path, side_path = get_latest_images()

    try:
        front_landmarks = pose_detector.detect_pose(front_path)
        back_landmarks = pose_detector.detect_pose(back_path)
        side_landmarks = pose_detector.detect_pose(side_path)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Pose detection failed: {exc}"
        ) from exc

    failed_views = [
        name for name, landmarks in (
            ("front", front_landmarks),
            ("back", back_landmarks),
            ("side", side_landmarks),
        )
        if not landmarks
    ]

    if failed_views:
        raise HTTPException(
            status_code=422,
            detail=(
                "MediaPipe could not extract landmarks from: "
                + ", ".join(failed_views)
                + ". Upload clear, full-body images and try again."
            ),
        )

    try:
        analyzer = CompleteBodyAnalyzer(
            front_landmarks, back_landmarks, side_landmarks
        )
        analysis = analyzer.analyze()
        scoring_engine = BodyScoring(
            analysis["front_metrics"],
            analysis["back_metrics"],
            analysis["side_metrics"],
        )
        scores = scoring_engine.generate_scores()
        profile = analysis["body_profile"]

        return {
            "overall_score": scores["overall_score"],
            "scores": {
                "v_taper_score": scores["v_taper_score"],
                "shoulder_score": scores["shoulder_score"],
                "back_score": scores["back_score"],
                "posture_score": scores["posture_score"],
            },
            "body_type": profile["body_type"],
            "strengths": profile.get("strengths", []),
            "weaknesses": profile.get("weaknesses", []),
        }
    except HTTPException:
        raise
    except KeyError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis result is missing the expected key: {exc}",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Body analysis failed: {exc}"
        ) from exc


def get_saved_fitness_profile():
    if not DB_PATH.exists():
        raise HTTPException(
            status_code=400,
            detail="Save your fitness profile before generating recommendations.",
        )
    with sqlite3.connect(DB_PATH) as db:
        db.row_factory = sqlite3.Row
        try:
            row = db.execute("SELECT * FROM profiles WHERE id = 1").fetchone()
        except sqlite3.OperationalError as exc:
            raise HTTPException(
                status_code=400,
                detail="Fitness profile table is missing. Restart the backend after updating fitness.py.",
            ) from exc

    if row is None:
        raise HTTPException(
            status_code=400,
            detail="Save your fitness profile before generating recommendations.",
        )
    return dict(row)


def initialize_recommendations_table():
    with sqlite3.connect(DB_PATH) as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS ai_recommendations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_json TEXT NOT NULL,
                recommendations_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)


@router.get("/dashboard-data")
def dashboard_data():
    """Return calculated body scores and profile information."""
    return run_body_analysis()


@router.get("/body-report")
def body_report():
    """Return the report using the calculated body profile."""
    data = run_body_analysis()
    return {
        "strong_areas": data["strengths"],
        "weak_areas": data["weaknesses"],
        "overall_score": data["overall_score"],
        "body_type": data["body_type"],
        "scores": data["scores"],
    }


@router.post("/ai-recommendations")
def ai_recommendations():
    """
    Analyze the latest uploaded scan, send the structured report/profile to Groq,
    save the generated result, and return workout/diet/progress guidance.
    """
    report = run_body_analysis()
    profile = get_saved_fitness_profile()

    try:
        recommendations = generate_fitness_recommendations(report, profile)
        initialize_recommendations_table()
        with sqlite3.connect(DB_PATH) as db:
            db.execute(
                """
                INSERT INTO ai_recommendations
                    (report_json, recommendations_json, created_at)
                VALUES (?, ?, ?)
                """,
                (
                    json.dumps(report),
                    json.dumps(recommendations),
                    datetime.now(timezone.utc).isoformat(),
                ),
            )
        return {
            "status": "success",
            "report": report,
            "recommendations": recommendations,
        }
    except GroqConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Could not generate Groq recommendations: {exc}",
        ) from exc


@router.get("/ai-recommendations/latest")
def latest_ai_recommendations():
    """Return the latest saved Groq recommendation bundle."""
    if not DB_PATH.exists():
        raise HTTPException(status_code=404, detail="No recommendations saved yet.")

    with sqlite3.connect(DB_PATH) as db:
        db.row_factory = sqlite3.Row
        try:
            row = db.execute(
                """
                SELECT report_json, recommendations_json, created_at
                FROM ai_recommendations ORDER BY id DESC LIMIT 1
                """
            ).fetchone()
        except sqlite3.OperationalError:
            row = None

    if row is None:
        raise HTTPException(status_code=404, detail="No recommendations saved yet.")

    return {
        "status": "success",
        "report": json.loads(row["report_json"]),
        "recommendations": json.loads(row["recommendations_json"]),
        "created_at": row["created_at"],
    }
