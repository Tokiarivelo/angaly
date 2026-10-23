from __future__ import annotations

from dataclasses import replace

import numpy as np

from cloth_sim.job import Body, Job
from cloth_sim.layers import LAYER_GAP, layer_crossings
from cloth_sim.prepare import prepare

from .conftest import grid, panel


def _job() -> Job:
    """A front skin at z = 0 (box body), a plastron 1 cm off it, a front half over it 1 mm higher, 4 cm cells."""
    front_skin, idx = grid(21, 21, origin=(-0.1, -0.1, 0.0))
    back_skin, _ = grid(21, 21, origin=(-0.1, -0.1, -0.2))
    body = Body(
        positions=np.concatenate([front_skin, back_skin]),
        indices=np.concatenate([idx, idx[:, ::-1] + len(front_skin)]),
    )
    plastron = panel("plastron", "plastron", 5, 9, origin=(-0.08, -0.04, 0.010), step=0.02)
    front = panel("front", "bodice", 7, 5, origin=(-0.13, -0.06, 0.011), step=0.02)
    return Job(pose="PRESENTATION", fabric_behavior="STRUCTURE", body=body, panels=[plastron, front], source={})


def test_prepares_even_separated_layers_sewn_together() -> None:
    job = _job()
    prep = prepare(job, max_edge=0.015)
    assert [p.id for p in prep.panels] == ["plastron", "front"]
    plastron, front = prep.panels
    # Refined: no edge over 1.5 cm (the job's cells are 2 cm).
    f = plastron.indices
    e = np.unique(np.sort(np.concatenate([f[:, [0, 1]], f[:, [1, 2]], f[:, [2, 0]]]), axis=1), axis=0)
    assert np.linalg.norm(plastron.positions[e[:, 0]] - plastron.positions[e[:, 1]], axis=1).max() <= 0.015 + 1e-9
    # The plastron under the front is cut away; what is left is tacked under the front's edge.
    assert prep.trimmed > 0
    assert plastron.positions[:, 0].min() > job.panels[0].positions[:, 0].min()
    assert len(prep.seams.pairs) > 0
    # The front stands off what is left of the plastron, and nothing crosses.
    assert front.positions[:, 2].max() >= 0.010 + LAYER_GAP - 1e-9
    assert layer_crossings(prep.panels, job.body) == 0
    # The merged cloth is the panels, in order; the drape's start positions have the same vertices.
    assert prep.cloth.offsets.tolist() == [0, len(plastron.positions), len(plastron.positions) + len(front.positions)]
    assert prep.start.shape == prep.cloth.positions.shape
    assert prep.layer_mask.shape == (len(prep.cloth.positions),)


def test_raw_layers_are_left_overlapping() -> None:
    job = _job()
    prep = prepare(job, max_edge=0.015, layers=False)
    assert prep.trimmed == 0 and prep.separated == 0 and not prep.layer_mask.any()
    assert prep.panels[0].positions[:, 0].min() == job.panels[0].positions[:, 0].min()


def test_a_detail_keeps_its_motif_through_cleaning_refining_and_trimming() -> None:
    job = _job()
    job = replace(
        job,
        panels=[replace(job.panels[0], motif="SMOCKS"), replace(job.panels[1], motif="BRODERIE", trim_color="#c0392b")],
    )
    prep = prepare(job, max_edge=0.015)
    assert prep.trimmed > 0
    assert [(p.motif, p.trim_color) for p in prep.panels] == [("SMOCKS", None), ("BRODERIE", "#c0392b")]
