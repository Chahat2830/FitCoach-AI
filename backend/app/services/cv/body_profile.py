class BodyProfile:
    def __init__(self, front_metrics=None, back_metrics=None, side_metrics=None):
        self.front = front_metrics or {}
        self.back = back_metrics or {}
        self.side = side_metrics or {}

    def determine_body_type(self) -> str:
        ratio = float(self.front.get("shoulder_hip_ratio", 0) or 0)
        if ratio <= 0:
            return "Unavailable"
        if ratio >= 1.6:
            return "V-Taper"
        if ratio >= 1.4:
            return "Athletic"
        if ratio >= 1.2:
            return "Average"
        return "Straight"

    def calculate_symmetry_score(self) -> float:
        arm_diff = float(self.front.get("arm_symmetry_relative_difference", 0) or 0)
        leg_diff = float(self.front.get("leg_symmetry_relative_difference", 0) or 0)
        return round(max(0.0, min(100.0, 100.0 * (1.0 - (arm_diff + leg_diff) / 2))), 2)

    def generate_strengths(self) -> list[str]:
        strengths = []
        ratio = float(self.front.get("shoulder_hip_ratio", 0) or 0)
        if ratio >= 1.5:
            strengths.append("Shoulder width is relatively greater than hip width")
        if self.calculate_symmetry_score() >= 95:
            strengths.append("Low estimated left-right limb-length difference")
        if self.back.get("back_symmetry_score", 0) >= 90:
            strengths.append("Good estimated shoulder/hip alignment in back view")
        return strengths

    def generate_weaknesses(self) -> list[str]:
        weaknesses = []
        ratio = float(self.front.get("shoulder_hip_ratio", 0) or 0)
        if 0 < ratio < 1.2:
            weaknesses.append("Shoulder-to-hip width ratio is relatively low")
        if self.calculate_symmetry_score() < 90:
            weaknesses.append("Review limb landmark alignment; image estimates show asymmetry")
        if self.side.get("posture_score", 100) < 80:
            weaknesses.append("Review side-view posture estimate and scan positioning")
        if not weaknesses:
            weaknesses.append("No major issues identified by these heuristic checks")
        return weaknesses

    def generate_profile(self) -> dict:
        return {
            "body_type": self.determine_body_type(),
            "symmetry_score": self.calculate_symmetry_score(),
            "strengths": self.generate_strengths(),
            "weaknesses": self.generate_weaknesses(),
            "front_metrics": self.front,
            "back_metrics": self.back,
            "side_metrics": self.side,
            "disclaimer": "Heuristic image-based estimates; not medical or clinical findings.",
        }
