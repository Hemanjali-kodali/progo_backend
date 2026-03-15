from typing import Iterable

import pandas as pd

TARGET_COLUMN = "pass_fail"
BASE_FEATURES = ["attendance", "internal_marks", "assignment_score", "lab_performance"]


def records_to_dataframe(records: Iterable[dict]) -> pd.DataFrame:
    df = pd.DataFrame(records)
    if df.empty:
        return df

    for col in BASE_FEATURES + [TARGET_COLUMN]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Fill feature missing values with medians for robust hackathon flows.
    for col in BASE_FEATURES:
        if col not in df.columns:
            df[col] = 0.0
        median_value = float(df[col].median()) if not df[col].dropna().empty else 0.0
        df[col] = df[col].fillna(median_value)

    if TARGET_COLUMN in df.columns:
        df[TARGET_COLUMN] = df[TARGET_COLUMN].fillna(0).astype(int)

    return df


def split_xy(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    if TARGET_COLUMN not in df.columns:
        raise ValueError("Target column 'pass_fail' is required for training")

    feature_cols = [col for col in BASE_FEATURES if col in df.columns]
    if not feature_cols:
        raise ValueError("No valid feature columns found")

    x = df[feature_cols].copy()
    y = df[TARGET_COLUMN].astype(int)
    return x, y
