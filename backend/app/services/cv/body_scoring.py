class BodyScoring:
    """Heuristic 0-100 indicators, not validated health or physique ratings."""
    def __init__(self, front_metrics, back_metrics, side_metrics):
        self.front = front_metrics or {}
        self.back = back_metrics or {}
        self.side = side_metrics or {}

    @staticmethod
    def _clamp(value: float) -> int:
        return int(round(max(0.0, min(100.0, value))))

    def v_taper_score(self) -> int:
        ratio = float(self.front.get("shoulder_hip_ratio", 0) or 0)
        if ratio <= 0:
            return 0
        # A display scale only; not a claim that a larger ratio is universally better.
        return self._clamp((ratio / 1.8) * 100)

    def arm_symmetry_score(self) -> int:
        diff = float(self.front.get("arm_symmetry_relative_difference", 0) or 0)
        return self._clamp(100 * (1 - diff))

    def leg_symmetry_score(self) -> int:
        diff = float(self.front.get("leg_symmetry_relative_difference", 0) or 0)
        return self._clamp(100 * (1 - diff))

    def back_score(self) -> int:
        return self._clamp(float(self.back.get("back_symmetry_score", 0) or 0))

    def posture_score(self) -> int:
        return self._clamp(float(self.side.get("posture_score", 0) or 0))

    def shoulder_score(self) -> int:
        ratio = float(self.front.get("shoulder_hip_ratio", 0) or 0)
        return self._clamp((ratio / 1.8) * 100) if ratio > 0 else 0

    def generate_scores(self) -> dict:
        scores = {
            "v_taper_score": self.v_taper_score(),
            "shoulder_score": self.shoulder_score(),
            "arm_symmetry_score": self.arm_symmetry_score(),
            "leg_symmetry_score": self.leg_symmetry_score(),
            "back_score": self.back_score(),
            "posture_score": self.posture_score(),
        }
        scores["overall_score"] = round(sum(scores.values()) / len(scores))
        scores["disclaimer"] = "Heuristic image-based scores, not validated medical or clinical measurements."
        return scores
