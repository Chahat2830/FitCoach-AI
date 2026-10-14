class BackAnalyzer:
    REQUIRED = ("LEFT_SHOULDER", "RIGHT_SHOULDER", "LEFT_HIP", "RIGHT_HIP")

    def __init__(self, landmarks: dict):
        if not landmarks:
            raise ValueError("Back-view landmarks are empty.")
        missing = [key for key in self.REQUIRED if key not in landmarks]
        if missing:
            raise ValueError(f"Missing required back landmarks: {', '.join(missing)}")
        self.landmarks = landmarks

    def shoulder_alignment(self) -> float:
        return abs(self.landmarks["LEFT_SHOULDER"]["y"] - self.landmarks["RIGHT_SHOULDER"]["y"])

    def hip_alignment(self) -> float:
        return abs(self.landmarks["LEFT_HIP"]["y"] - self.landmarks["RIGHT_HIP"]["y"])

    def back_width(self) -> float:
        return abs(self.landmarks["LEFT_SHOULDER"]["x"] - self.landmarks["RIGHT_SHOULDER"]["x"])

    def symmetry_score(self) -> float:
        shoulder_width = max(self.back_width(), 1e-8)
        hip_width = abs(self.landmarks["LEFT_HIP"]["x"] - self.landmarks["RIGHT_HIP"]["x"])
        shoulder_tilt = self.shoulder_alignment() / shoulder_width
        hip_tilt = self.hip_alignment() / max(hip_width, 1e-8)
        return round(max(0.0, min(100.0, 100.0 * (1.0 - min(1.0, (shoulder_tilt + hip_tilt) / 2)))), 2)

    def generate_metrics(self) -> dict:
        return {
            "back_width": round(self.back_width(), 4),
            "shoulder_alignment": round(self.shoulder_alignment(), 4),
            "hip_alignment": round(self.hip_alignment(), 4),
            "back_symmetry_score": self.symmetry_score(),
        }
