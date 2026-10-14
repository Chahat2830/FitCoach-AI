
from pathlib import Path

import cv2
import mediapipe as mp


class LandmarkExtractor:
    """Extract named body landmarks from an image using MediaPipe Pose."""

    def __init__(
        self,
        static_image_mode: bool = True,
        model_complexity: int = 2,
        min_detection_confidence: float = 0.5,
        min_visibility: float = 0.5,
    ):
        self.mp_pose = mp.solutions.pose
        self.min_visibility = min_visibility

        self.pose = self.mp_pose.Pose(
            static_image_mode=static_image_mode,
            model_complexity=model_complexity,
            enable_segmentation=False,
            min_detection_confidence=min_detection_confidence,
        )

    def extract_from_image(self, image_path: str) -> dict | None:
        """
        Return a dictionary keyed by MediaPipe landmark names.
        Returns None when a pose cannot be detected.
        """

        path = Path(image_path)

        if not path.is_file():
            raise FileNotFoundError(f"Image not found: {image_path}")

        image = cv2.imread(str(path))

        if image is None:
            raise ValueError(f"Unable to read image: {image_path}")

        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.pose.process(rgb_image)

        if not results.pose_landmarks:
            return None

        landmarks = {}

        for index, landmark in enumerate(
            results.pose_landmarks.landmark
        ):
            name = self.mp_pose.PoseLandmark(index).name

            landmarks[name] = {
                "x": round(float(landmark.x), 6),
                "y": round(float(landmark.y), 6),
                "z": round(float(landmark.z), 6),
                "visibility": round(float(landmark.visibility), 6),
            }

        return landmarks

    def extract_required_landmarks(
        self,
        image_path: str,
        required_names: list[str] | None = None,
    ) -> dict | None:
        """Extract landmarks and validate required landmark visibility."""

        landmarks = self.extract_from_image(image_path)

        if landmarks is None:
            return None

        if required_names is None:
            required_names = [
                "LEFT_SHOULDER",
                "RIGHT_SHOULDER",
                "LEFT_HIP",
                "RIGHT_HIP",
                "LEFT_ELBOW",
                "RIGHT_ELBOW",
                "LEFT_WRIST",
                "RIGHT_WRIST",
                "LEFT_KNEE",
                "RIGHT_KNEE",
                "LEFT_ANKLE",
                "RIGHT_ANKLE",
            ]

        missing = [
            name for name in required_names
            if name not in landmarks
            or landmarks[name]["visibility"] < self.min_visibility
        ]

        if missing:
            raise ValueError(
                "Required landmarks are missing or have low visibility: "
                + ", ".join(missing)
            )

        return landmarks

    def close(self):
        """Release MediaPipe resources."""
        self.pose.close()
