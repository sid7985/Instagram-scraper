"""Root entrypoint for Railway — delegates to backend.main for Railpack auto-detection."""
import subprocess
import sys
from pathlib import Path

backend_dir = str(Path(__file__).resolve().parent / "backend")
sys.path.insert(0, backend_dir)

# Run uvicorn from the venv, pointing at backend/main.py
venv_uvicorn = Path("/app/.venv/bin/python")
if venv_uvicorn.exists():
    sys.exit(subprocess.call([str(venv_uvicorn), "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", sys.argv[1] if len(sys.argv) > 1 else "8000"]))
else:
    sys.exit(subprocess.call([sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]))
