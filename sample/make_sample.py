"""Generate a sample .xlsx file with Instagram URLs for testing."""

from pathlib import Path

import pandas as pd

SAMPLE_URLS = [
    "https://www.instagram.com/reel/CxQ1a2b3c4d/",
    "https://www.instagram.com/p/CyZ5X6y7z8A/",
    "https://www.instagram.com/reel/CzW9V8u7t6S/",
    "https://www.instagram.com/p/CaaBbCcDdEe/",
    "https://www.instagram.com/reel/CbbCcDdEeFf/",
]

if __name__ == "__main__":
    out = Path(__file__).resolve().parent / "sample.xlsx"
    df = pd.DataFrame({"Instagram Video URL": SAMPLE_URLS})
    df.to_excel(out, index=False)
    print(f"Sample file created: {out}")
