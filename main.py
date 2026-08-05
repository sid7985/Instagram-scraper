"""Root entrypoint — delegates to backend.main for Railway/Railpack auto-detection."""
import importlib
import sys
from pathlib import Path

_backend_dir = str(Path(__file__).resolve().parent / "backend")
sys.path.insert(0, _backend_dir)

# Force a fresh import of 'main' from the backend directory
spec = importlib.util.spec_from_file_location("_backend_main", Path(_backend_dir) / "main.py")
_mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(_mod)
app = _mod.app
