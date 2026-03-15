from datetime import datetime, timezone
from typing import Any

from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.errors import PyMongoError

from .config import MONGO_DB_NAME, MONGO_URI

_client: MongoClient | None = None


def get_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
    return _client


def get_collection(name: str) -> Collection:
    db = get_client()[MONGO_DB_NAME]
    return db[name]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def ping() -> bool:
    try:
        get_client().admin.command("ping")
        return True
    except PyMongoError:
        return False


def insert_student_records(records: list[dict[str, Any]]) -> int:
    payload = []
    for record in records:
        item = {**record, "createdAt": now_iso()}
        payload.append(item)
    result = get_collection("students").insert_many(payload)
    return len(result.inserted_ids)


def fetch_student_records(limit: int = 5000) -> list[dict[str, Any]]:
    docs = list(get_collection("students").find({}, {"_id": 0}).limit(limit))
    return docs


def store_metrics(metrics: dict[str, Any]) -> str:
    doc = {**metrics, "createdAt": now_iso()}
    result = get_collection("metrics").insert_one(doc)
    return str(result.inserted_id)


def latest_metrics() -> dict[str, Any] | None:
    doc = get_collection("metrics").find_one(sort=[("createdAt", -1)], projection={"_id": 0})
    return doc


def store_prediction(payload: dict[str, Any]) -> str:
    doc = {**payload, "createdAt": now_iso()}
    result = get_collection("predictions").insert_one(doc)
    return str(result.inserted_id)
