from typing import Any

from .ml_service import ml_service

INTENT_RULES = [
    ("attendance", "overall_attendance"),
    ("performance", "academic_performance"),
    ("cgpa", "academic_performance"),
    ("exam", "upcoming_exams"),
    ("fee", "fee_status"),
    ("notification", "notifications"),
    ("faculty", "faculty_contact"),
    ("predict", "risk_prediction"),
    ("risk", "risk_prediction"),
    ("help", "help"),
]


def detect_intent(message: str) -> tuple[str, float]:
    text = (message or "").strip().lower()
    for keyword, intent in INTENT_RULES:
        if keyword in text:
            return intent, 0.92
    if any(greet in text for greet in ["hi", "hello", "hey"]):
        return "greeting", 0.9
    return "unknown", 0.45


def build_response(message: str, student_data: dict[str, Any] | None = None) -> dict[str, Any]:
    intent, confidence = detect_intent(message)

    if intent == "risk_prediction":
        if not student_data:
            return {
                "message": "Please provide studentData with attendance, internal_marks, assignment_score, and lab_performance.",
                "intent": intent,
                "confidence": confidence,
                "additionalData": {},
            }

        try:
            prediction = ml_service.predict(student_data)
        except RuntimeError:
            return {
                "message": "Model is not trained yet. Please call /api/ml/train first.",
                "intent": intent,
                "confidence": confidence,
                "additionalData": {},
            }

        return {
            "message": (
                f"Prediction complete. Pass probability: {prediction['pass_probability']:.2f}, "
                f"Fail probability: {prediction['fail_probability']:.2f}, "
                f"Risk level: {prediction['risk_level']}."
            ),
            "intent": intent,
            "confidence": confidence,
            "additionalData": prediction,
        }

    quick_replies = {
        "overall_attendance": "You can upload data and train the model to analyze attendance impact on pass/fail outcomes.",
        "academic_performance": "Use /api/ml/predict after training to evaluate academic performance risk.",
        "upcoming_exams": "Exam planning can be improved by combining internal marks and assignment scores.",
        "fee_status": "Fee status is outside ML scope here, but can be added as a feature in the next iteration.",
        "notifications": "Notifications module can alert high-risk students after predictions.",
        "faculty_contact": "Faculty advisory can be triggered for medium/high-risk students.",
        "help": "Ask about risk prediction or send studentData to get pass/fail probabilities.",
        "greeting": "Hello! I can evaluate student risk using the trained ML model.",
        "unknown": "I can help with ML risk prediction. Try: 'predict risk' with studentData.",
    }

    return {
        "message": quick_replies.get(intent, quick_replies["unknown"]),
        "intent": intent,
        "confidence": confidence,
        "additionalData": {},
    }
