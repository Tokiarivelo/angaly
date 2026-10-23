from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np
import pytest

from cloth_sim.job import JobError, load_job, parse_job


def test_parses_a_valid_job(raw_job: dict[str, Any]) -> None:
    job = parse_job(raw_job)
    assert job.pose == "PRESENTATION"
    assert job.fabric_behavior == "FLUIDE"
    assert job.source == {"versionId": "v1"}
    assert job.body.positions.shape == (9, 3)
    [p] = job.panels
    assert (p.id, p.zone, p.role) == ("bodice-front", "bodice", "front")
    assert p.positions.shape == (9, 3) and p.indices.shape == (8, 3) and p.uvs.shape == (9, 2)


def test_loads_from_a_file(raw_job: dict[str, Any], tmp_path: Path) -> None:
    path = tmp_path / "job.json"
    path.write_text(json.dumps(raw_job))
    assert load_job(path).panels[0].id == "bodice-front"


def test_missing_fabric_and_pose_get_defaults(raw_job: dict[str, Any]) -> None:
    del raw_job["fabric"], raw_job["pose"]
    job = parse_job(raw_job)
    assert job.fabric_behavior is None and job.pose == "NEUTRE"


@pytest.mark.parametrize(
    ("mutate", "message"),
    [
        (lambda j: j.update(version=2), "unsupported job version"),
        (lambda j: j.update(units="mm"), "units"),
        (lambda j: j["panels"][0].update(indices=[0, 1, 99]), "out of range"),
        (lambda j: j["panels"][0].update(indices=[0, 1, -1]), "out of range"),
        (lambda j: j["panels"][0]["positions"].__setitem__(0, float("nan")), "non-finite"),
        (lambda j: j["panels"][0].update(positions=[0.0, 1.0]), "3-tuples"),
        (lambda j: j["panels"][0].update(uvs=[0.0, 0.0]), "one uv per vertex"),
        (lambda j: j["panels"].append(dict(j["panels"][0])), "duplicate id"),
        (lambda j: j["panels"][0].update(id=""), "missing or duplicate id"),
        (lambda j: j.update(panels=[]), "no panel"),
        (lambda j: j.update(body={}), "body.positions"),
    ],
)
def test_rejects_malformed_jobs(raw_job: dict[str, Any], mutate: Any, message: str) -> None:
    mutate(raw_job)
    with pytest.raises(JobError, match=message):
        parse_job(raw_job)


def test_positions_are_float_and_indices_int(raw_job: dict[str, Any]) -> None:
    p = parse_job(raw_job).panels[0]
    assert p.positions.dtype == np.float64 and p.indices.dtype == np.int64


def test_reads_the_target_pose_and_the_arm_weights(raw_job: dict[str, Any]) -> None:
    body = raw_job["body"]["positions"]
    raw_job["targetBody"] = {"positions": [v + 0.01 for v in body]}
    raw_job["body"]["armWeights"] = [0.0] * 8 + [1.0]
    job = parse_job(raw_job)
    assert job.body.target is not None
    np.testing.assert_allclose(job.body.final, job.body.positions + 0.01)
    assert job.body.arm_weights is not None and job.body.arm_weights[-1] == 1.0


def test_without_a_target_the_body_stays_put(raw_job: dict[str, Any]) -> None:
    job = parse_job(raw_job)
    assert job.body.target is None and job.body.arm_weights is None
    assert job.body.final is job.body.positions


@pytest.mark.parametrize(
    ("mutate", "message"),
    [
        (lambda j: j.update(targetBody={"positions": [0.0, 0.0, 0.0]}), "one position per body vertex"),
        (
            lambda j: j.update(targetBody={"positions": [float("inf")] * len(j["body"]["positions"])}),
            "targetBody.positions: non-finite",
        ),
        (lambda j: j["body"].update(armWeights=[1.0]), "one weight per body vertex"),
    ],
)
def test_rejects_a_malformed_pose_change(raw_job: dict[str, Any], mutate: Any, message: str) -> None:
    mutate(raw_job)
    with pytest.raises(JobError, match=message):
        parse_job(raw_job)


def test_reads_the_look_and_the_accent_flags(raw_job: dict[str, Any]) -> None:
    raw_job["look"] = {"fabricColor": "#0E1534"}
    raw_job["panels"][0]["accent"] = [1, 0, 0, 0, 0, 0, 0, 0, 1]
    job = parse_job(raw_job)
    assert job.look == {"fabricColor": "#0E1534"}
    accent = job.panels[0].accent
    assert accent is not None and accent.tolist() == [True] + [False] * 7 + [True]
    raw_job["panels"][0]["accent"] = [1]
    with pytest.raises(JobError, match="one flag per vertex"):
        parse_job(raw_job)


def _head(n_body: int) -> dict[str, Any]:
    return {
        "skinColors": [0.5] * (n_body * 3),
        "hairColor": "#4a3324",
        "hair": {
            "positions": [0, 0, 0, 1, 0, 0, 0, 1, 0],
            "indices": [0, 1, 2],
            "uvs": [0, 0, 1, 0, 0, 1],
            "shade": [1, 0.8, 0.6],
            "alpha": [1, 1, 0],
        },
        "eyes": {"radius": 0.012, "centre": [0.03, 1.57, 0.12]},
    }


def test_without_a_head_there_is_none(raw_job: dict[str, Any]) -> None:
    assert parse_job(raw_job).head is None


def test_reads_the_head(raw_job: dict[str, Any]) -> None:
    raw_job["head"] = _head(9)
    head = parse_job(raw_job).head
    assert head is not None and head.hair is not None
    assert head.skin_colors.shape == (9, 3) and head.hair_color == "#4a3324"
    assert head.hair.indices.shape == (1, 3) and head.hair.alpha.tolist() == [1, 1, 0]
    assert head.eye_radius == 0.012 and head.eye_centre.tolist() == [0.03, 1.57, 0.12]
    del raw_job["head"]["hair"], raw_job["head"]["hairColor"]
    bald = parse_job(raw_job).head
    assert bald is not None and bald.hair is None and bald.hair_color == "#4a3324"


@pytest.mark.parametrize(
    ("mutate", "message"),
    [
        (lambda h: h.update(skinColors=[0.5] * 6), "head.skinColors"),
        (lambda h: h["hair"].update(uvs=[0, 0]), "head.hair.uvs"),
        (lambda h: h["hair"].update(shade=[1, 1]), "head.hair.shade"),
        (lambda h: h["hair"].update(alpha=[1, 1, float("nan")]), "head.hair.alpha"),
        (lambda h: h.update(eyes={"radius": 0.2, "centre": [0, 0, 0]}), "head.eyes"),
        (lambda h: h.update(eyes={"radius": 0.01, "centre": [0, 0]}), "head.eyes"),
    ],
)
def test_rejects_a_malformed_head(raw_job: dict[str, Any], mutate: Any, message: str) -> None:
    raw_job["head"] = _head(9)
    mutate(raw_job["head"])
    with pytest.raises(JobError, match=message):
        parse_job(raw_job)


def test_reads_a_detail_motif_and_its_thread_colour(raw_job: dict[str, Any]) -> None:
    raw_job["panels"][0].update(motif="BRODERIE", trimColor="#C0392B")
    [p] = parse_job(raw_job).panels
    assert (p.motif, p.trim_color) == ("BRODERIE", "#c0392b")


def test_ignores_an_unknown_motif_or_a_malformed_colour(raw_job: dict[str, Any]) -> None:
    raw_job["panels"][0].update(motif="PAILLETTES", trimColor="red")
    [p] = parse_job(raw_job).panels
    assert (p.motif, p.trim_color) == (None, None)
