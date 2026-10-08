"""Phase 5b S6 — golden-set manifest, metrics, thresholds/regressions, report and CLI."""
import json
from pathlib import Path

import pytest

from app.evaluation.cli import build_samples, load_predictions, main
from app.evaluation.manifest import ManifestError, load_manifest, parse_manifest
from app.evaluation.metrics import (
    Sample,
    compute_metrics,
    drape_blocks_f1,
    fit_errors,
    garment_detection,
    per_class_f1,
    validation_rejection_rate,
)
from app.evaluation.report import check_regressions, check_thresholds, lookup, render_markdown


def garment(gt="ROBE", cut="EVASEE", **extra):
    return {"isGarment": True, "garmentType": gt, "cutType": cut, "details": {}, **extra}


NOT_GARMENT = {"isGarment": False}


def line(id_, expected, **extra):
    base = {"id": id_, "imagePath": f"{id_}.jpg", "source": "atelier", "license": "fournie", "expected": expected}
    return json.dumps({**base, **extra})


def test_manifest_requires_provenance_and_unique_ids():
    with pytest.raises(ManifestError):
        parse_manifest([json.dumps({"id": "a", "imagePath": "a.jpg", "expected": {}})])
    with pytest.raises(ManifestError):
        parse_manifest([line("a", garment()), line("a", garment())])
    with pytest.raises(ManifestError):
        parse_manifest(["{not json"])


def test_manifest_skips_comments_and_rejects_untaxonomic_labels():
    entries = parse_manifest(["# comment", "", line("a", garment())])
    assert [e.id for e in entries] == ["a"]
    assert entries[0].expected["garmentType"] == "ROBE"
    with pytest.raises(ManifestError, match="taxonomy"):
        parse_manifest([line("b", garment(gt="LICORNE"))])


def test_shipped_manifest_is_loadable():
    path = Path(__file__).resolve().parents[1] / "ml" / "data" / "eval" / "manifest.jsonl"
    assert isinstance(load_manifest(path), list)


def test_garment_detection_counts_failed_analysis_as_not_a_garment():
    samples = [
        Sample("1", garment(), garment()),
        Sample("2", garment(), None),  # FN (analysis failed)
        Sample("3", NOT_GARMENT, garment()),  # FP
        Sample("4", NOT_GARMENT, NOT_GARMENT),  # TN
    ]
    d = garment_detection(samples)
    assert (d["tp"], d["fp"], d["fn"], d["tn"]) == (1, 1, 1, 1)
    assert d["precision"] == 0.5 and d["recall"] == 0.5
    assert d["falsePositiveRate"] == 0.5 and d["falseNegativeRate"] == 0.5


def test_field_accuracy_skips_unlabelled_and_penalises_missing():
    samples = [
        Sample("1", garment(occasion="MARIAGE", details={"manches": "LONGUES"}), garment(occasion="MARIAGE", details={"manches": "COURTES"})),
        Sample("2", garment(), None),
    ]
    acc = compute_metrics(samples)["fieldAccuracy"]
    assert acc["garmentType"] == {"n": 2, "accuracy": 0.5}
    assert acc["occasion"] == {"n": 1, "accuracy": 1.0}  # sample 2 has no label → skipped
    assert acc["details.manches"] == {"n": 1, "accuracy": 0.0}


def test_per_class_f1():
    samples = [
        Sample("1", garment("ROBE"), garment("ROBE")),
        Sample("2", garment("ROBE"), garment("JUPE")),
        Sample("3", garment("JUPE"), garment("JUPE")),
    ]
    f1 = per_class_f1(samples, "garmentType")
    assert f1["classes"]["ROBE"]["precision"] == 1.0
    assert f1["classes"]["ROBE"]["recall"] == 0.5
    assert f1["classes"]["JUPE"]["precision"] == 0.5
    assert f1["macroF1"] == pytest.approx((2 / 3 + 2 / 3) / 2)


def test_fit_errors_mae_coverage_and_ease():
    expected = garment(fit={"ease": "AMPLE", "fullness": {"skirt": 2.0}, "lengths": {"skirtPct": 100}})
    samples = [
        Sample("1", expected, garment(fit={"ease": "AMPLE", "fullness": {"skirt": 2.5}})),
        Sample("2", expected, garment(fit={"ease": "AJUSTE"})),
    ]
    fit = fit_errors(samples)
    assert fit["fullness.skirt"] == {"n": 2, "coverage": 0.5, "mae": 0.5}
    assert fit["lengths.skirtPct"]["mae"] is None
    assert fit["ease"] == {"n": 2, "accuracy": 0.5}


def test_drape_blocks_f1_reads_absent_as_none():
    with_train = garment(drapeBlocks=[{"kind": "TRAIN", "lengthMm": 500}])
    samples = [
        Sample("1", with_train, with_train),
        Sample("2", garment(), with_train),  # extra block → FP
        Sample("3", with_train, garment()),  # missed block → FN
    ]
    d = drape_blocks_f1(samples)
    assert (d["tp"], d["fp"], d["fn"]) == (1, 1, 1)
    assert d["f1"] == pytest.approx(0.5)
    assert drape_blocks_f1([Sample("x", garment(), garment())])["f1"] is None


def test_validation_rejection_rate_counts_values_the_normaliser_drops():
    raw = {"isGarment": True, "garmentType": "ROBE", "cutType": "INVENTE", "occasion": "MARIAGE"}
    rate = validation_rejection_rate([Sample("1", garment(), garment(), raw=raw), Sample("2", garment(), garment())])
    assert rate["rejected"] == 1 and rate["asserted"] == 3
    assert rate["rate"] == pytest.approx(1 / 3)
    assert validation_rejection_rate([Sample("1", garment(), garment())])["rate"] is None


def test_latency_and_categories():
    samples = [
        Sample(str(i), garment(), garment(), category="robe" if i % 2 else None, latency_ms=100.0 * i)
        for i in range(1, 11)
    ]
    m = compute_metrics(samples)
    assert m["latency"]["meanMs"] == 550 and m["latency"]["p95Ms"] == 1000
    assert set(m["byCategory"]) == {"robe", "untagged"}
    assert compute_metrics([Sample("1", garment(), garment())])["latency"]["n"] == 0


def test_thresholds_and_unavailable_metric_are_reported():
    metrics = compute_metrics([Sample("1", garment(), garment()), Sample("2", NOT_GARMENT, garment())])
    findings = check_thresholds(
        metrics,
        {"min": {"garmentDetection/recall": 0.9, "drapeBlocks/f1": 0.1}, "max": {"garmentDetection/falsePositiveRate": 0.5}},
    )
    messages = " ".join(f.message for f in findings)
    assert "falsePositiveRate" in messages  # 1.0 > 0.5
    assert "drapeBlocks/f1: non calculable" in messages
    assert "recall" not in messages  # 1.0 ≥ 0.9
    assert lookup(metrics, "no/such/path") is None


def test_regression_check_uses_direction_and_tolerance():
    base = {"fieldAccuracy": {"garmentType": {"accuracy": 0.9}}, "analysisFailureRate": 0.05}
    worse = {"fieldAccuracy": {"garmentType": {"accuracy": 0.8}}, "analysisFailureRate": 0.2}
    paths = {f.path for f in check_regressions(worse, base)}
    assert paths == {"fieldAccuracy/garmentType/accuracy", "analysisFailureRate"}
    assert check_regressions(base, base) == []
    assert check_regressions(worse, base, tolerance=0.5) == []
    # An improvement is never a regression.
    assert check_regressions(base, worse) == []


def test_markdown_report_contains_findings_or_all_clear():
    metrics = compute_metrics([Sample("1", garment(fit={"ease": "AMPLE"}), garment(fit={"ease": "AMPLE"}), latency_ms=10)])
    ok = render_markdown(metrics, [], {"model": "m", "manifest": "x"})
    assert "Aucun seuil franchi" in ok and "`m`" in ok and "ease" in ok
    bad = render_markdown(metrics, check_thresholds(metrics, {"min": {"f1/cutType/macroF1": 2}}), {})
    assert "❌" in bad


def _write_case(tmp_path, predicted_type="ROBE"):
    manifest = tmp_path / "manifest.jsonl"
    manifest.write_text(line("a", garment("ROBE")) + "\n" + line("b", NOT_GARMENT) + "\n")
    preds = tmp_path / "preds.jsonl"
    preds.write_text(
        json.dumps({"id": "a", "profile": garment(predicted_type), "latencyMs": 5, "model": "gemini"})
        + "\n"
        + json.dumps({"id": "b", "profile": NOT_GARMENT})
        + "\n"
    )
    return manifest, preds


def test_cli_writes_reports_and_exits_zero_when_clean(tmp_path, capsys):
    manifest, preds = _write_case(tmp_path)
    code = main(["--manifest", str(manifest), "--predictions", str(preds), "--out", str(tmp_path / "out"), "--thresholds", ""])
    assert code == 0
    report = json.loads((tmp_path / "out" / "report.json").read_text())
    assert report["metrics"]["fieldAccuracy"]["garmentType"]["accuracy"] == 1.0
    assert report["meta"]["model"] == "gemini"
    assert (tmp_path / "out" / "report.md").exists()
    assert "Rapport d'évaluation" in capsys.readouterr().out


def test_cli_blocking_mode_fails_on_regression_only_when_asked(tmp_path):
    manifest, preds = _write_case(tmp_path, predicted_type="JUPE")
    baseline = tmp_path / "baseline.json"
    baseline.write_text(json.dumps({"metrics": {"fieldAccuracy": {"garmentType": {"accuracy": 1.0}}}}))
    common = ["--manifest", str(manifest), "--predictions", str(preds), "--out", str(tmp_path / "o"), "--baseline", str(baseline), "--thresholds", ""]
    assert main(common) == 0  # non-blocking by default
    assert main([*common, "--fail-on-findings"]) == 1


def test_cli_argument_and_data_errors(tmp_path):
    manifest, preds = _write_case(tmp_path)
    with pytest.raises(SystemExit):
        main(["--manifest", str(manifest)])  # neither predictions nor images
    empty = tmp_path / "empty.jsonl"
    empty.write_text("# nothing\n")
    assert main(["--manifest", str(empty), "--predictions", str(preds), "--out", str(tmp_path / "o")]) == 2
    partial = tmp_path / "partial.jsonl"
    partial.write_text(json.dumps({"id": "a", "profile": None}) + "\n")
    with pytest.raises(SystemExit, match="predictions missing"):
        build_samples(load_manifest(manifest), load_predictions(partial))


def test_predict_live_calls_the_analysis_per_image(tmp_path, monkeypatch):
    from app import inference
    from app.evaluation.cli import predict_live
    from app.schemas import GarmentProfile, InspirationAnalysisResponse

    seen = []

    def fake(request):
        seen.append(request.mime_type)
        return InspirationAnalysisResponse(
            features={}, profile=GarmentProfile(isGarment=True, garmentType="ROBE"), confidence=0.9, modelVersion="fake-1"
        )

    monkeypatch.setattr(inference, "analyze_inspiration", fake)
    (tmp_path / "a.png").write_bytes(b"x")
    entries = parse_manifest([line("a", garment(), imagePath="a.png")])
    out = predict_live(entries, tmp_path)
    assert seen == ["image/png"]
    assert out["a"]["profile"]["garmentType"] == "ROBE" and out["a"]["model"] == "fake-1"
    assert out["a"]["latencyMs"] >= 0
