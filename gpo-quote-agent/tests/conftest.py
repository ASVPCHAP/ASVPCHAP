import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from quoteagent.reference import Reference  # noqa: E402

SAMPLES = ROOT / "data" / "samples"


@pytest.fixture(scope="session")
def reference() -> Reference:
    return Reference.load(ROOT / "data")


@pytest.fixture(scope="session")
def samples() -> Path:
    return SAMPLES
