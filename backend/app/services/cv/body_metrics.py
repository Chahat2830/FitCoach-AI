import math


def calculate_distance(point1: dict, point2: dict) -> float:
    """Euclidean distance in normalized image coordinates (not cm/inches)."""
    return math.hypot(float(point1["x"]) - float(point2["x"]), float(point1["y"]) - float(point2["y"]))


class BodyMetrics:
    REQUIRED = ("LEFT_SHOULDER", "RIGHT_SHOULDER", "LEFT_HIP", "RIGHT_HIP", "LEFT_ELBOW", "RIGHT_ELBOW", "LEFT_WRIST", "RIGHT_WRIST", "LEFT_KNEE", "RIGHT_KNEE", "LEFT_ANKLE", "RIGHT_ANKLE")

    def __init__(self, landmarks: dict):
        if not landmarks:
            raise ValueError("Front-view landmarks are empty.")
        missing = [key for key in self.REQUIRED if key not in landmarks]
        if missing:
            raise ValueError(f"Missing required front landmarks: {', '.join(missing)}")
        self.landmarks = landmarks

    def _point(self, name: str) -> dict:
        point = self.landmarks[name]
        if "x" not in point or "y" not in point:
            raise ValueError(f"Landmark {name} has no x/y coordinates.")
        return point

    def shoulder_width(self) -> float:
        return abs(self._point("LEFT_SHOULDER")["x"] - self._point("RIGHT_SHOULDER")["x"])

    def hip_width(self) -> float:
        return abs(self._point("LEFT_HIP")["x"] - self._point("RIGHT_HIP")["x"])

    def _limb_length(self, start: str, middle: str, end: str) -> float:
        return calculate_distance(self._point(start), self._point(middle)) + calculate_distance(self._point(middle), self._point(end))

    def left_arm_length(self) -> float:
        return self._limb_length("LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST")

    def right_arm_length(self) -> float:
        return self._limb_length("RIGHT_SHOULDER", "RIGHT_ELBOW", "RIGHT_WRIST")

    def left_leg_length(self) -> float:
        return self._limb_length("LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE")

    def right_leg_length(self) -> float:
        return self._limb_length("RIGHT_HIP", "RIGHT_KNEE", "RIGHT_ANKLE")

    def torso_length(self) -> float:
        left_s, right_s = self._point("LEFT_SHOULDER"), self._point("RIGHT_SHOULDER")
        left_h, right_h = self._point("LEFT_HIP"), self._point("RIGHT_HIP")
        shoulder_center = {"x": (left_s["x"] + right_s["x"]) / 2, "y": (left_s["y"] + right_s["y"]) / 2}
        hip_center = {"x": (left_h["x"] + right_h["x"]) / 2, "y": (left_h["y"] + right_h["y"]) / 2}
        return calculate_distance(shoulder_center, hip_center)

    def shoulder_hip_ratio(self) -> float:
        hip = self.hip_width()
        return self.shoulder_width() / hip if hip > 1e-8 else 0.0

    @staticmethod
    def _relative_difference(left: float, right: float) -> float:
        average = (left + right) / 2
        return abs(left - right) / average if average > 1e-8 else 0.0

    def arm_symmetry(self) -> float:
        return abs(self.left_arm_length() - self.right_arm_length())

    def leg_symmetry(self) -> float:
        return abs(self.left_leg_length() - self.right_leg_length())

    def generate_metrics(self) -> dict:
        left_arm, right_arm = self.left_arm_length(), self.right_arm_length()
        left_leg, right_leg = self.left_leg_length(), self.right_leg_length()
        return {
            "shoulder_width": round(self.shoulder_width(), 4),
            "hip_width": round(self.hip_width(), 4),
            "shoulder_hip_ratio": round(self.shoulder_hip_ratio(), 4),
            "left_arm_length": round(left_arm, 4),
            "right_arm_length": round(right_arm, 4),
            "left_leg_length": round(left_leg, 4),
            "right_leg_length": round(right_leg, 4),
            "torso_length": round(self.torso_length(), 4),
            "arm_symmetry_difference": round(abs(left_arm - right_arm), 4),
            "leg_symmetry_difference": round(abs(left_leg - right_leg), 4),
            "arm_symmetry_relative_difference": round(self._relative_difference(left_arm, right_arm), 4),
            "leg_symmetry_relative_difference": round(self._relative_difference(left_leg, right_leg), 4),
            "units": "normalized image coordinates; not physical units",
        }
