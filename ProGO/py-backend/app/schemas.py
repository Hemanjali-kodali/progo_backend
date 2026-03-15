from typing import Literal

from pydantic import BaseModel, Field


class StudentFeatures(BaseModel):
    student_id: str | None = None
    attendance: float | None = Field(default=None, ge=0, le=100)
    internal_marks: float | None = Field(default=None, ge=0, le=100)
    assignment_score: float | None = Field(default=None, ge=0, le=100)
    lab_performance: float | None = Field(default=None, ge=0, le=100)


class StudentRecord(StudentFeatures):
    pass_fail: int | None = Field(default=None, ge=0, le=1)


class DatasetUploadRequest(BaseModel):
    records: list[StudentRecord]


class TrainRequest(BaseModel):
    model_name: Literal[
        "logistic_regression",
        "decision_tree",
        "random_forest",
        "naive_bayes",
        "svm",
    ] = "random_forest"
    test_size: float = Field(default=0.2, gt=0, lt=0.5)
    random_state: int = 42


class PredictRequest(BaseModel):
    student: StudentFeatures


class ChatbotRequest(BaseModel):
    message: str
    sessionId: str | None = None
    studentData: StudentFeatures | None = None


class LoginRequest(BaseModel):
    registrationNumber: str
    password: str
    role: str = "student"
