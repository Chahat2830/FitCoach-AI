import sqlite3
from pathlib import Path
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter()
APP_DIR = Path(__file__).resolve().parents[1]
DB_PATH = APP_DIR / "fitness.db"


def connect_db():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_db():
    with connect_db() as db:
        db.executescript("""
            CREATE TABLE IF NOT EXISTS profiles (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                age INTEGER NOT NULL,
                height_cm REAL NOT NULL,
                weight_kg REAL NOT NULL,
                goal TEXT NOT NULL,
                activity_level TEXT NOT NULL,
                equipment TEXT NOT NULL,
                diet_preference TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                weight_kg REAL NOT NULL,
                note TEXT DEFAULT '',
                created_at TEXT NOT NULL
            );
        """)


initialize_db()


class FitnessProfile(BaseModel):
    age: int = Field(ge=18, le=100)
    height_cm: float = Field(gt=100, le=250)
    weight_kg: float = Field(gt=25, le=350)
    goal: str = Field(pattern="^(muscle_gain|fat_loss|maintenance|fitness)$")
    activity_level: str = Field(pattern="^(beginner|light|moderate|active)$")
    equipment: str = Field(default="gym", pattern="^(gym|home|bodyweight)$")
    diet_preference: str = Field(
        default="vegetarian",
        pattern="^(vegetarian|vegan|eggetarian|non_vegetarian)$",
    )


class ProgressEntry(BaseModel):
    weight_kg: float = Field(gt=25, le=350)
    note: str = Field(default="", max_length=500)


def get_profile():
    with connect_db() as db:
        row = db.execute("SELECT * FROM profiles WHERE id = 1").fetchone()
    if not row:
        raise HTTPException(
            status_code=404,
            detail="Fitness profile not found. Save your profile first.",
        )
    return dict(row)


@router.post("/fitness-profile")
def save_profile(profile: FitnessProfile):
    now = datetime.now(timezone.utc).isoformat()
    with connect_db() as db:
        db.execute("""
            INSERT INTO profiles (
                id, age, height_cm, weight_kg, goal, activity_level,
                equipment, diet_preference, created_at
            ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                age=excluded.age,
                height_cm=excluded.height_cm,
                weight_kg=excluded.weight_kg,
                goal=excluded.goal,
                activity_level=excluded.activity_level,
                equipment=excluded.equipment,
                diet_preference=excluded.diet_preference,
                created_at=excluded.created_at
        """, (
            profile.age, profile.height_cm, profile.weight_kg, profile.goal,
            profile.activity_level, profile.equipment, profile.diet_preference,
            now,
        ))
    return {"status": "success", "message": "Fitness profile saved.", "profile": profile.model_dump()}


@router.get("/fitness-profile")
def read_profile():
    return get_profile()


@router.post("/workout-plan")
def workout_plan():
    """
    Prefer the latest saved Groq plan. If none exists, return a clear message
    directing the frontend to run the scan + Groq recommendation workflow.
    """
    if DB_PATH.exists():
        with connect_db() as db:
            db.row_factory = sqlite3.Row
            try:
                row = db.execute(
                    "SELECT recommendations_json FROM ai_recommendations ORDER BY id DESC LIMIT 1"
                ).fetchone()
            except sqlite3.OperationalError:
                row = None
        if row:
            import json
            saved = json.loads(row["recommendations_json"])
            return {"status": "success", **saved.get("workout_plan", {})}

    profile = get_profile()
    goal = profile["goal"]
    if profile["equipment"] == "bodyweight":
        exercises = [
            {"name": "Bodyweight squat", "target_muscles": ["legs"], "sets": 2 if profile["activity_level"] == "beginner" else 3, "reps": "8-12"},
            {"name": "Incline push-up", "target_muscles": ["chest", "arms"], "sets": 2 if profile["activity_level"] == "beginner" else 3, "reps": "8-12"},
            {"name": "Glute bridge", "target_muscles": ["glutes"], "sets": 2 if profile["activity_level"] == "beginner" else 3, "reps": "10-15"},
        ]
    elif profile["equipment"] == "home":
        exercises = [
            {"name": "Dumbbell squat", "target_muscles": ["legs"], "sets": 3, "reps": "8-12"},
            {"name": "Dumbbell row", "target_muscles": ["back"], "sets": 3, "reps": "8-12"},
            {"name": "Dumbbell floor press", "target_muscles": ["chest"], "sets": 3, "reps": "8-12"},
        ]
    else:
        exercises = [
            {"name": "Leg press or squat", "target_muscles": ["legs"], "sets": 3, "reps": "8-12"},
            {"name": "Lat pulldown", "target_muscles": ["back"], "sets": 3, "reps": "8-12"},
            {"name": "Chest press", "target_muscles": ["chest"], "sets": 3, "reps": "8-12"},
        ]
    return {
        "status": "success",
        "goal": goal,
        "focus": "Starter plan; run Body Scan to generate Groq recommendations",
        "days_per_week": 3,
        "schedule": [
            {"day": "Monday", "activity": "Strength training"},
            {"day": "Wednesday", "activity": "Strength training"},
            {"day": "Friday", "activity": "Strength training"},
        ],
        "exercises": exercises,
        "guidance": "For personalized recommendations, upload all three views and call POST /api/ai-recommendations.",
    }


@router.post("/diet-plan")
def diet_plan():
    if DB_PATH.exists():
        with connect_db() as db:
            db.row_factory = sqlite3.Row
            try:
                row = db.execute(
                    "SELECT recommendations_json FROM ai_recommendations ORDER BY id DESC LIMIT 1"
                ).fetchone()
            except sqlite3.OperationalError:
                row = None
        if row:
            import json
            saved = json.loads(row["recommendations_json"])
            return {"status": "success", **saved.get("diet_plan", {})}

    profile = get_profile()
    preference = profile["diet_preference"]
    meal_suggestions = {
        "vegan": [
            {"meal": "Breakfast", "suggestion": "Oats, soy milk, nuts and fruit"},
            {"meal": "Lunch", "suggestion": "Lentils, rice, tofu and vegetables"},
            {"meal": "Snack", "suggestion": "Roasted chickpeas or soy yogurt"},
            {"meal": "Dinner", "suggestion": "Beans, quinoa or roti, and vegetables"},
        ],
        "eggetarian": [
            {"meal": "Breakfast", "suggestion": "Oats, milk and eggs"},
            {"meal": "Lunch", "suggestion": "Dal, rice or roti, vegetables and curd"},
            {"meal": "Snack", "suggestion": "Fruit, yogurt or roasted chana"},
            {"meal": "Dinner", "suggestion": "Egg bhurji, roti and vegetables"},
        ],
        "non_vegetarian": [
            {"meal": "Breakfast", "suggestion": "Eggs, whole-grain toast and fruit"},
            {"meal": "Lunch", "suggestion": "Chicken or fish, rice and vegetables"},
            {"meal": "Snack", "suggestion": "Yogurt, fruit or roasted chickpeas"},
            {"meal": "Dinner", "suggestion": "Lean protein, roti and vegetables"},
        ],
        "vegetarian": [
            {"meal": "Breakfast", "suggestion": "Oats, milk, nuts and fruit"},
            {"meal": "Lunch", "suggestion": "Dal, rice or roti, paneer and vegetables"},
            {"meal": "Snack", "suggestion": "Curd, fruit or roasted chana"},
            {"meal": "Dinner", "suggestion": "Paneer or tofu, roti and vegetables"},
        ],
    }
    return {
        "status": "success",
        "goal": profile["goal"],
        "diet_preference": preference,
        "estimated_calorie_guidance": "Personal calorie needs require more information; avoid treating this as a precise target.",
        "suggested_protein_grams_per_day": round(profile["weight_kg"] * 1.4),
        "meals": meal_suggestions[preference],
        "hydration": "Drink regularly through the day; needs vary by activity and climate.",
        "notes": ["Starter suggestions only. Run Body Scan to generate a Groq recommendation bundle."],
    }


@router.post("/progress")
def add_progress(entry: ProgressEntry):
    now = datetime.now(timezone.utc).isoformat()
    with connect_db() as db:
        db.execute(
            "INSERT INTO progress (weight_kg, note, created_at) VALUES (?, ?, ?)",
            (entry.weight_kg, entry.note, now),
        )
    return {"status": "success", "message": "Progress entry saved."}


@router.get("/progress")
def get_progress():
    profile = get_profile()
    with connect_db() as db:
        rows = db.execute(
            "SELECT id, weight_kg, note, created_at FROM progress ORDER BY id ASC"
        ).fetchall()
    entries = [dict(row) for row in rows]
    return {
        "status": "success",
        "starting_weight_kg": profile["weight_kg"],
        "entries": entries,
        "entry_count": len(entries),
        "latest_weight_kg": entries[-1]["weight_kg"] if entries else profile["weight_kg"],
    }
