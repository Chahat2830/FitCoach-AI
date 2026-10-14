from pathlib import Path
import cv2
import mediapipe as mp


class PoseDetector:
    def __init__(self, min_detection_confidence: float = 0.5, min_visibility: float = 0.35):
        self.mp_pose = mp.solutions.pose
        self.min_visibility = min_visibility
        self.pose = self.mp_pose.Pose(
            static_image_mode=True,
            model_complexity=1,
            enable_segmentation=False,
            min_detection_confidence=min_detection_confidence,
        )

    def detect_pose(self, image_path: str | Path) -> dict | None:
        image = cv2.imread(str(image_path))
        if image is None:
            raise ValueError(f"Cannot read image: {image_path}")
        rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.pose.process(rgb)
        if not results.pose_landmarks:
            return None
        landmarks = {}
        for idx, landmark in enumerate(results.pose_landmarks.landmark):
            name = self.mp_pose.PoseLandmark(idx).name
            landmarks[name] = {
                "x": float(landmark.x),
                "y": float(landmark.y),
                "z": float(landmark.z),
                "visibility": float(landmark.visibility),
            }
        required = ("LEFT_SHOULDER", "RIGHT_SHOULDER", "LEFT_HIP", "RIGHT_HIP")
        if any(name not in landmarks or landmarks[name]["visibility"] < self.min_visibility for name in required):
            return None
        return landmarks

    def close(self) -> None:
        self.pose.close()
