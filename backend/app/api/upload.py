
from pathlib import Path
from uuid import uuid4

import cv2
import numpy as np
from fastapi import APIRouter, File, HTTPException, UploadFile

router = APIRouter()

# Resolve the path independently of the terminal's working directory.
APP_DIR = Path(__file__).resolve().parents[1]
UPLOAD_DIR = APP_DIR / "uploads"

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB per image
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
VIEWS = ("front", "back", "side")


async def save_image(file: UploadFile, view: str) -> Path:
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail=f"{view}: filename is required.",
        )

    extension = Path(file.filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"{view}: only JPG, JPEG, PNG, and WEBP are supported.",
        )

    # Read at most one byte beyond the limit to detect oversized files.
    content = await file.read(MAX_FILE_SIZE + 1)

    if not content:
        raise HTTPException(
            status_code=400,
            detail=f"{view}: uploaded image is empty.",
        )

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"{view}: image must be 10 MB or smaller.",
        )

    image_array = np.frombuffer(content, dtype=np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    if image is None:
        raise HTTPException(
            status_code=400,
            detail=f"{view}: uploaded file is not a valid image.",
        )

    folder = UPLOAD_DIR / view
    folder.mkdir(parents=True, exist_ok=True)

    # Store decoded images as JPEG to avoid extension/content mismatches.
    filename = f"{uuid4().hex}.jpg"
    destination = folder / filename

    if not cv2.imwrite(str(destination), image):
        raise HTTPException(
            status_code=500,
            detail=f"{view}: failed to save image.",
        )

    return destination


@router.post("/upload-body-scan")
async def upload_body_scan(
    front: UploadFile = File(...),
    back: UploadFile = File(...),
    side: UploadFile = File(...),
):
    saved_paths = []

    try:
        for view, file in (
            ("front", front),
            ("back", back),
            ("side", side),
        ):
            saved_path = await save_image(file, view)
            saved_paths.append(saved_path)

        return {
            "status": "success",
            "message": "All three body scan images uploaded successfully.",
            "images": {
                view: path.name
                for view, path in zip(VIEWS, saved_paths)
            },
        }

    except Exception:
        # Avoid leaving an incomplete scan after a failed upload.
        for path in saved_paths:
            path.unlink(missing_ok=True)
        raise

    finally:
        await front.close()
        await back.close()
        await side.close()
