from app.services.cv.back_analyzer import BackAnalyzer
from app.services.cv.body_metrics import BodyMetrics
from app.services.cv.body_profile import BodyProfile
from app.services.cv.side_analyzer import SideAnalyzer


class CompleteBodyAnalyzer:
    def __init__(self, front_landmarks, back_landmarks, side_landmarks):
        self.front_landmarks = front_landmarks
        self.back_landmarks = back_landmarks
        self.side_landmarks = side_landmarks

    def analyze(self) -> dict:
        front_metrics = BodyMetrics(self.front_landmarks).generate_metrics()
        back_metrics = BackAnalyzer(self.back_landmarks).generate_metrics()
        side_metrics = SideAnalyzer(self.side_landmarks).generate_metrics()
        profile = BodyProfile(front_metrics, back_metrics, side_metrics).generate_profile()
        return {
            "front_metrics": front_metrics,
            "back_metrics": back_metrics,
            "side_metrics": side_metrics,
            "body_profile": profile,
        }
