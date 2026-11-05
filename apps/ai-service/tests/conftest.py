"""Local models stay enabled in the suite (their own tests cover them).

The off-by-default switch has its own test: tests/test_local_models_switch.py.
"""

import pytest


@pytest.fixture(autouse=True)
def _local_models_enabled(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AI_LOCAL_MODELS_ENABLED", "true")
