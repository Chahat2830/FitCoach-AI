import math


class SideAnalyzer:
    REQUIRED = ("NOSE", "LEFT_SHOULDER", "LEFT_HIP")

    def __init__(self, landmarks: dict):
        if not landmarks:
            raise ValueError("Side-view landmarks are empty.")
        missing = [key for key in self.REQUIRED if key not in landmarks]
        if missing:
            raise ValueError(f"Missing required side landmarks: {', '.join(missing)}")
        self.landmarks = landmarks

    def forward_head_distance(self) -> float:
        nose, shoulder = self.landmarks["NOSE"], self.landmarks["LEFT_SHOULDER"]
        return abs(nose["x"] - shoulder["x"])

    def torso_angle(self) -> float:
        shoulder, hip = self.landmarks["LEFT_SHOULDER"], self.landmarks["LEFT_HIP"]
        dx, dy = shoulder["x"] - hip["x"], shoulder["y"] - hip["y"]
        return math.degrees(math.atan2(abs(dx), max(abs(dy), 1e-8)))

    def posture_score(self) -> float:
        # A rough image-based indicator only; this is not a clinical posture measure.
        shoulder, hip = self.landmarks["LEFT_SHOULDER"], self.landmarks["LEFT_HIP"]
        torso_height = abs(shoulder["y"] - hip["y"])
        if torso_height < 1e-8:
            return 0.0
        relative_head_offset = self.forward_head_distance() / torso_height
        return round(max(0.0, min(100.0, 100.0 * (1.0 - min(relative_head_offset, 1.0)))), 2)

    def generate_metrics(self) -> dict:
        return {
            "forward_head_distance": round(self.forward_head_distance(), 4),
            "torso_angle": round(self.torso_angle(), 2),
            "posture_score": self.posture_score(),
            "disclaimer": "Approximate image-based indicator; not a clinical posture assessment.",
        }
