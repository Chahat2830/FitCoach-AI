
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.analysis import router as analysis_router
from app.api.upload import router as upload_router
from app.api.fitness import router as fitness_router

app = FastAPI(
    title="AI Fitness Coach API",
    description="Body scan analysis with Groq-powered fitness recommendations.",
    version="1.1.0",
)

default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

frontend_origins = [
    origin.strip().rstrip("/")
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        ",".join(default_origins),
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],
    allow_headers=["*"],
)

app.include_router(
    upload_router,
    prefix="/api",
    tags=["Body Scan Upload"],
)

app.include_router(
    analysis_router,
    prefix="/api",
    tags=["Body Analysis and Groq"],
)

app.include_router(
    fitness_router,
    prefix="/api",
    tags=["Fitness Plans and Progress"],
)


@app.get("/")
def home():
    return {
        "status": "ok",
        "message": "AI Fitness Coach Backend Running",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
