"""Root entrypoint for Railway — imports and runs the backend FastAPI app."""
import subprocess
import sys
from pathlib import Path

backend_dir = str(Path(__file__).resolve().parent / "backend")
sys.path.insert(0, backend_dir)

# Import the app from backend/main.py
exec(open(Path(backend_dir) / "main.py").read())
