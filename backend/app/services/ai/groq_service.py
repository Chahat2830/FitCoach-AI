import json
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from groq import Groq

# Load backend/.env even when the app is launched from a different directory.
APP_DIR = Path(__file__).resolve().parents[2]
ENV_PATH = APP_DIR.parent / ".env"

# Prefer the backend/.env settings over stale inherited environment variables.
load_dotenv(ENV_PATH, override=True)

DEFAULT_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
print(f"Groq model configured: {DEFAULT_MODEL}")


class GroqConfigurationError(RuntimeError):
    pass


def generate_fitness_recommendations(
    body_report: dict[str, Any],
    profile: dict[str, Any],
) -> dict[str, Any]:
    """Generate JSON workout/diet recommendations from a computed body report."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or api_key == "your_groq_api_key_here":
        raise GroqConfigurationError(
            "GROQ_API_KEY is missing. Add it to backend/.env and restart FastAPI."
        )

    client = Groq(api_key=api_key)

    system_prompt = """
You are a cautious fitness-planning assistant. Return one valid JSON object only.
Use the supplied body report and user profile. Do not diagnose disease, infer
body-fat percentage, or claim that a photo proves a medical condition. Treat
body scores as approximate visual/pose estimates. Make recommendations practical
and beginner-safe. Respect the user's goal, available equipment, activity level,
and dietary preference. Do not invent measured weight or body dimensions. Use
general nutrition guidance; do not prescribe extreme calorie deficits or
supplements. Include safety caveats for pain, injuries, and medical conditions.

The JSON schema must contain:
{
  "summary": "string",
  "workout_plan": {
    "goal": "string",
    "days_per_week": 3,
    "weekly_schedule": [{"day":"Monday","activity":"string"}],
    "exercises": [
      {"name":"string","target_muscles":["string"],"sets":3,
       "reps":"8-12","rest_seconds":60,"reason":"string"}
    ],
    "safety_notes": ["string"]
  },
  "diet_plan": {
    "diet_preference":"string",
    "calorie_guidance":"string",
    "protein_guidance":"string",
    "meals":[{"meal":"Breakfast","suggestion":"string","reason":"string"}],
    "hydration":"string",
    "caveats":["string"]
  },
  "progress_baseline": {
    "overall_score": null,
    "body_type": null,
    "scores": {},
    "strengths": [],
    "areas_to_improve": []
  },
  "limitations": ["string"]
}
For progress_baseline, copy only values actually present in body_report. Use null
or empty collections when values are unavailable. No markdown fences.
""".strip()

    user_payload = {
        "body_report": body_report,
        "user_profile": profile,
    }

    completion = client.chat.completions.create(
        model=DEFAULT_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": json.dumps(user_payload, ensure_ascii=False),
            },
        ],
        temperature=0.2,
        response_format={"type": "json_object"},
    )

    content = completion.choices[0].message.content
    if not content:
        raise RuntimeError("Groq returned an empty recommendation response.")

    try:
        result = json.loads(content)
    except json.JSONDecodeError as exc:
        raise RuntimeError("Groq returned invalid JSON.") from exc

    required = {"summary", "workout_plan", "diet_plan", "progress_baseline", "limitations"}
    if not required.issubset(result):
        raise RuntimeError("Groq response is missing required recommendation fields.")

    if not isinstance(result["workout_plan"], dict) or not isinstance(result["diet_plan"], dict):
        raise RuntimeError("Groq returned an invalid workout or diet plan.")

    return result
