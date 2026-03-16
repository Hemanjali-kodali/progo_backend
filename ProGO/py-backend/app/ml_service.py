from __future__ import annotations

import base64
from dataclasses import dataclass
from io import BytesIO
from typing import Any

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import GaussianNB
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier

from .config import ARTIFACT_DIR


@dataclass
class ModelState:
    model: Any | None = None
    model_name: str | None = None
    feature_columns: list[str] | None = None


class MLService:
    def __init__(self) -> None:
        self.state = ModelState(model=None, model_name=None, feature_columns=[])

    def _build_model(self, model_name: str):
        if model_name == "logistic_regression":
            return Pipeline([
                ("scaler", StandardScaler()),
                ("clf", LogisticRegression(max_iter=1000)),
            ])
        if model_name == "decision_tree":
            return DecisionTreeClassifier(max_depth=6, random_state=42)
        if model_name == "random_forest":
            return RandomForestClassifier(n_estimators=120, random_state=42)
        if model_name == "naive_bayes":
            return GaussianNB()
        if model_name == "svm":
            return Pipeline([
                ("scaler", StandardScaler()),
                ("clf", SVC(probability=True, kernel="rbf", C=1.0, gamma="scale", random_state=42)),
            ])
        raise ValueError(f"Unsupported model_name: {model_name}")

    def _plot_confusion_matrix(self, cm: np.ndarray, labels: list[str]) -> tuple[str, str]:
        fig, ax = plt.subplots(figsize=(5, 4))
        ax.imshow(cm, interpolation="nearest", cmap=plt.cm.Blues)
        ax.set_title("Confusion Matrix")
        ax.set_xlabel("Predicted")
        ax.set_ylabel("Actual")
        ax.set_xticks(range(len(labels)))
        ax.set_xticklabels(labels)
        ax.set_yticks(range(len(labels)))
        ax.set_yticklabels(labels)

        for i in range(cm.shape[0]):
            for j in range(cm.shape[1]):
                ax.text(j, i, str(cm[i, j]), ha="center", va="center", color="black")

        fig.tight_layout()

        artifact_path = ARTIFACT_DIR / "confusion_matrix_latest.png"
        fig.savefig(artifact_path, dpi=150)

        buffer = BytesIO()
        fig.savefig(buffer, format="png", dpi=150)
        plt.close(fig)
        encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return str(artifact_path), encoded

    def train(self, x: pd.DataFrame, y: pd.Series, model_name: str, test_size: float, random_state: int) -> dict[str, Any]:
        model = self._build_model(model_name)

        stratify = y if y.nunique() > 1 else None
        x_train, x_test, y_train, y_test = train_test_split(
            x,
            y,
            test_size=test_size,
            random_state=random_state,
            stratify=stratify,
        )

        model.fit(x_train, y_train)
        y_pred = model.predict(x_test)

        acc = float(accuracy_score(y_test, y_pred))
        precision = float(precision_score(y_test, y_pred, zero_division=0))
        recall = float(recall_score(y_test, y_pred, zero_division=0))
        f1 = float(f1_score(y_test, y_pred, zero_division=0))

        labels = ["Fail", "Pass"]
        cm = confusion_matrix(y_test, y_pred, labels=[0, 1])
        cm_path, cm_base64 = self._plot_confusion_matrix(cm, labels)

        self.state.model = model
        self.state.model_name = model_name
        self.state.feature_columns = list(x.columns)

        return {
            "model_name": model_name,
            "train_size": int(len(x_train)),
            "test_size": int(len(x_test)),
            "accuracy": acc,
            "precision": precision,
            "recall": recall,
            "f1_score": f1,
            "confusion_matrix": cm.tolist(),
            "confusion_matrix_image_base64": cm_base64,
            "confusion_matrix_image_path": cm_path,
            "feature_columns": list(x.columns),
        }

    def predict(self, student_payload: dict[str, Any]) -> dict[str, Any]:
        if self.state.model is None or not self.state.feature_columns:
            raise RuntimeError("Model is not trained yet")

        features = {}
        for col in self.state.feature_columns:
            value = student_payload.get(col, 0)
            features[col] = float(value) if value is not None else 0.0

        sample = pd.DataFrame([features])
        model = self.state.model

        pred_class = int(model.predict(sample)[0])

        pass_probability = 0.5
        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba(sample)[0]
            pass_probability = float(probabilities[1] if len(probabilities) > 1 else probabilities[0])

        fail_probability = float(1 - pass_probability)
        risk_level = "low"
        if fail_probability >= 0.7:
            risk_level = "high"
        elif fail_probability >= 0.4:
            risk_level = "medium"

        return {
            "predicted_class": "pass" if pred_class == 1 else "fail",
            "pass_probability": round(pass_probability, 4),
            "fail_probability": round(fail_probability, 4),
            "risk_level": risk_level,
            "model_name": self.state.model_name,
        }


ml_service = MLService()
