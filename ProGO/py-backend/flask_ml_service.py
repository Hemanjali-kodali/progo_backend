from flask import Flask, jsonify, request

app = Flask(__name__)

INTENT_RULES = [
    ("attendance", "overall_attendance"),
    ("performance", "academic_performance"),
    ("cgpa", "academic_performance"),
    ("exam", "upcoming_exams"),
    ("fee", "fee_status"),
    ("notification", "notifications"),
    ("faculty", "faculty_contact"),
    ("help", "help"),
]


def detect_intent(text: str) -> dict:
    normalized = (text or "").strip().lower()
    for keyword, intent in INTENT_RULES:
        if keyword in normalized:
            return {"intent": intent, "confidence": 0.92}
    if any(greet in normalized for greet in ["hi", "hello", "hey"]):
        return {"intent": "greeting", "confidence": 0.9}
    return {"intent": "unknown", "confidence": 0.45}


@app.post("/predict")
def predict():
    payload = request.get_json(silent=True) or {}
    message = payload.get("message", "")
    result = detect_intent(message)
    return jsonify({"success": True, "data": result})


@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "flask-ml"})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=False)
