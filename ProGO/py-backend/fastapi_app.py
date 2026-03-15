from __future__ import annotations

from datetime import datetime, timezone
import uuid

from fastapi import Cookie, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError

from app.chatbot_service import build_response
from app.db import (
    fetch_student_records,
    insert_student_records,
    latest_metrics,
    ping,
    store_metrics,
    store_prediction,
)
from app.ml_service import ml_service
from app.preprocessing import records_to_dataframe, split_xy
from app.schemas import (
    ChatbotRequest,
    DatasetUploadRequest,
    LoginRequest,
    PredictRequest,
    TrainRequest,
)

app = FastAPI(title="ProGO Hackathon ML Backend", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SESSIONS: dict[str, dict] = {}

MOCK_USERS = {
    "REG001": {
        "id": "1",
        "firstName": "Alice",
        "lastName": "Johnson",
        "registrationNumber": "REG001",
        "email": "alice@example.com",
        "role": "student",
    }
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@app.get("/api/health")
def health():
    return {
        "status": "Server is running",
        "timestamp": now_iso(),
        "mongodb_connected": ping(),
        "model_trained": ml_service.state.model is not None,
        "active_model": ml_service.state.model_name,
    }


@app.post("/api/auth/login")
def login(body: LoginRequest):
    reg = body.registrationNumber.strip().upper()
    user = MOCK_USERS.get(reg)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    session_id = str(uuid.uuid4())
    SESSIONS[session_id] = {"authenticated": True, "user": user, "createdAt": now_iso()}

    response = JSONResponse({"success": True, "message": "Login successful", "user": user})
    response.set_cookie("progo_session", session_id, httponly=True, samesite="lax")
    return response


@app.get("/api/auth/session")
def session(progo_session: str | None = Cookie(default=None)):
    if not progo_session or progo_session not in SESSIONS:
        return JSONResponse(status_code=401, content={"success": False, "authenticated": False})
    return {"success": True, "authenticated": True, "user": SESSIONS[progo_session]["user"]}


@app.post("/api/auth/logout")
def logout(progo_session: str | None = Cookie(default=None)):
    if progo_session and progo_session in SESSIONS:
        SESSIONS.pop(progo_session, None)
    response = JSONResponse({"success": True, "message": "Logged out"})
    response.delete_cookie("progo_session")
    return response


@app.post("/api/dataset/upload")
def upload_dataset(payload: DatasetUploadRequest):
    records = [record.model_dump() for record in payload.records]
    if not records:
        raise HTTPException(status_code=400, detail="records cannot be empty")

    try:
        inserted = insert_student_records(records)
    except PyMongoError as exc:
        raise HTTPException(status_code=503, detail=f"MongoDB error: {exc}") from exc

    return {
        "success": True,
        "message": "Dataset uploaded",
        "inserted_count": inserted,
    }


@app.get("/api/dataset")
def get_dataset(limit: int = 200):
    try:
        records = fetch_student_records(limit=limit)
    except PyMongoError as exc:
        raise HTTPException(status_code=503, detail=f"MongoDB error: {exc}") from exc

    return {
        "success": True,
        "count": len(records),
        "records": records,
    }


@app.post("/api/ml/train")
def train_model(request: TrainRequest):
    try:
        records = fetch_student_records(limit=100000)
    except PyMongoError as exc:
        raise HTTPException(status_code=503, detail=f"MongoDB error: {exc}") from exc

    if not records:
        raise HTTPException(status_code=400, detail="No student data found. Upload dataset first.")

    dataframe = records_to_dataframe(records)
    x, y = split_xy(dataframe)

    if y.nunique() < 2:
        raise HTTPException(status_code=400, detail="Training needs at least two target classes in pass_fail")

    metrics = ml_service.train(
        x=x,
        y=y,
        model_name=request.model_name,
        test_size=request.test_size,
        random_state=request.random_state,
    )

    try:
        metric_id = store_metrics(metrics)
    except PyMongoError as exc:
        raise HTTPException(status_code=503, detail=f"MongoDB error: {exc}") from exc

    return {
        "success": True,
        "message": "Model trained successfully",
        "metric_id": metric_id,
        "metrics": {
            "accuracy": metrics["accuracy"],
            "precision": metrics["precision"],
            "recall": metrics["recall"],
            "f1_score": metrics["f1_score"],
            "confusion_matrix": metrics["confusion_matrix"],
            "model_name": metrics["model_name"],
        },
        "confusion_matrix": {
            "image_path": metrics["confusion_matrix_image_path"],
            "image_base64": metrics["confusion_matrix_image_base64"],
        },
    }


@app.get("/api/ml/metrics/latest")
def get_latest_metrics():
    try:
        metrics = latest_metrics()
    except PyMongoError as exc:
        raise HTTPException(status_code=503, detail=f"MongoDB error: {exc}") from exc

    if not metrics:
        raise HTTPException(status_code=404, detail="No metrics found")

    return {"success": True, "metrics": metrics}


@app.post("/api/ml/predict")
def predict(request: PredictRequest):
    student = request.student.model_dump()
    try:
        result = ml_service.predict(student)
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    try:
        prediction_id = store_prediction({"student": student, "result": result})
    except PyMongoError as exc:
        raise HTTPException(status_code=503, detail=f"MongoDB error: {exc}") from exc

    return {
        "success": True,
        "prediction_id": prediction_id,
        "prediction": result,
    }


@app.post("/api/chatbot/message")
def chatbot_message(payload: ChatbotRequest, progo_session: str | None = Cookie(default=None)):
    if not progo_session or progo_session not in SESSIONS:
        return JSONResponse(
            status_code=401,
            content={"success": False, "message": "Session expired. Please authenticate again."},
        )

    student_data = payload.studentData.model_dump() if payload.studentData else None
    response = build_response(payload.message, student_data=student_data)

    if response.get("additionalData", {}).get("predicted_class"):
        try:
            store_prediction({
                "source": "chatbot",
                "message": payload.message,
                "student": student_data,
                "result": response["additionalData"],
            })
        except PyMongoError:
            # Do not fail chatbot response due to logging issue.
            pass

    return {
        "success": True,
        "data": response,
    }
