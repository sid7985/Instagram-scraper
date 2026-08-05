import importlib.util, sys, os
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    "backend_main",
    Path(__file__).resolve().parent / "backend" / "main.py"
)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
app = mod.app
