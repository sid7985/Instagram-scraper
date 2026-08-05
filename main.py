import subprocess, sys, os
venv = os.path.join(os.path.dirname(__file__), ".venv", "bin", "python")
if not os.path.exists(venv):
    venv = sys.executable
sys.exit(subprocess.call([venv, "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", os.environ.get("PORT", "8000")]))
