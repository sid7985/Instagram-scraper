"""Read Instagram URLs from an uploaded Excel file."""

from dataclasses import dataclass
from pathlib import Path

import pandas as pd

from scraper import is_instagram_url


@dataclass
class UrlRow:
    excel_row: int  # 1-based row number in the original sheet (matches Excel)
    url: str


def load_dataframe(path: Path) -> pd.DataFrame:
    """Load the first sheet of an Excel file as a DataFrame."""
    return pd.read_excel(path, engine="openpyxl" if path.suffix == ".xlsx" else "xlrd")


def read_urls_from_excel(path: Path, url_column: str | None = None) -> list[UrlRow]:
    """Extract Instagram URLs from the first sheet of an .xlsx/.xls file.

    If url_column is not given, the column that contains the most
    Instagram URLs is auto-detected; falls back to the first column.
    """
    df = load_dataframe(path)

    if url_column and url_column in df.columns:
        col = url_column
    else:
        col = _detect_url_column(df)

    rows: list[UrlRow] = []
    for excel_idx, value in enumerate(df[col].tolist(), start=2):  # row 1 = header
        if value is None:
            continue
        url = str(value).strip()
        if url and url.lower() != "nan":
            rows.append(UrlRow(excel_row=excel_idx, url=url))
    return rows


def _detect_url_column(df: pd.DataFrame) -> str:
    best_col, best_score = None, 0
    for col in df.columns:
        values = df[col].dropna().astype(str).str.strip()
        if values.empty:
            continue
        matches = sum(1 for v in values if is_instagram_url(v))
        score = matches / len(values)
        if score > best_score:
            best_col, best_score = col, score
    if best_col is None:
        return df.columns[0]
    return best_col
