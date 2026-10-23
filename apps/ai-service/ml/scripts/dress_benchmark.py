"""Photo → analysis → project → pattern, for a folder of garment photos (fit-vs-inspiration benchmark).

Dresses by default; `--garments all` (or a list: PANTALON JUPE …) benchmarks the other garments too.

For each image: upload to MinIO (presigned, like the wizard), read it with the vision model, create a
Pattern Studio project owned by the seed client, store the analysis, generate the pattern with standard
measurements. Writes `results.json` (project ids, profile, pieces) used by the 3D comparison and the
review sheet. Needs the API (3003), MinIO and a configured vision provider.

    python ml/scripts/dress_benchmark.py --images ~/angaly-dress-images/robe-portee --out ~/angaly-dress-bench
"""
from __future__ import annotations

import argparse
import json
import mimetypes
import os
from pathlib import Path

import httpx

API = os.environ.get("ANGALY_API", "http://127.0.0.1:3003/api")
MEASUREMENTS = {"TOUR_COU": 36, "CARRURE_DOS": 37, "TOUR_BASSIN": 98, "TOUR_TAILLE": 74, "LONGUEUR_DOS": 42, "TOUR_POITRINE": 92}
# Detail groups the wizard offers per garment (`garment-details.const.ts`, GROUPS_BY_GARMENT): the profile's other
# groups are dropped, as the wizard would drop them on save.
GROUPS: dict[str, set[str]] = {
    "ROBE": {"manches", "col", "decollete", "dos", "longueur", "fermeture", "corsage", "taille", "devant", "jupe"},
    "ROBE_MARIEE": {"manches", "col", "decollete", "dos", "longueur", "corsage", "taille"},
    "JUPE": {"longueur"},
    "PANTALON": {"longueur"},
    "VESTE": {"manches", "col", "decollete", "longueur"},
    "CHEMISE": {"manches", "col", "decollete", "longueur"},
    "COSTUME": {"manches", "col", "decollete", "longueur"},
}
DRESSES = {"ROBE", "ROBE_MARIEE"}


def login(client: httpx.Client, email: str, password: str) -> dict[str, str]:
    r = client.post(f"{API}/auth/login", json={"email": email, "password": password})
    r.raise_for_status()
    return {"authorization": f"Bearer {r.json()['data']['accessToken']}"}


def upload(client: httpx.Client, headers: dict[str, str], path: Path) -> tuple[str, str]:
    mime = mimetypes.guess_type(path.name)[0] or "image/jpeg"
    pre = client.post(f"{API}/media/presigned-upload", headers=headers, json={
        "entityType": "PATTERN_INSPIRATION", "originalFilename": path.name, "mimeType": mime}).json()["data"]
    body = path.read_bytes()
    put = client.put(pre["uploadUrl"], content=body, headers={"Content-Type": mime})
    put.raise_for_status()
    media = client.post(f"{API}/media/confirm", headers=headers, json={
        "bucket": pre["bucket"], "objectKey": pre["objectKey"], "entityType": "PATTERN_INSPIRATION",
        "altText": path.name, "mimeType": mime, "sizeBytes": len(body)}).json()["data"]
    return media["id"], media["url"]


def profile_from_reading(reading: dict) -> dict:
    """GarmentProfile from a hand reading ({garmentType, cutType, details, fit, blocks, occasion, style, presentation})."""
    return {"isGarment": True, "garmentType": reading["garmentType"], "occasion": reading.get("occasion"),
            "style": reading.get("style"), "cutType": reading.get("cutType"), "details": reading.get("details", {}),
            "constructionMethod": reading.get("constructionMethod", "FLAT_PATTERN"), "presentation": reading.get("presentation"),
            "fit": reading.get("fit"), "drapeBlocks": reading.get("blocks") or None, "readBy": reading.get("readBy", "manual")}


def run_one(client: httpx.Client, headers: dict[str, str], path: Path, provider: str, garments: set[str] = DRESSES,
            reading: dict | None = None) -> dict:
    media_id, url = upload(client, headers, path)
    if reading is not None:
        # A reading written by hand (or by another model) when the vision provider is unavailable.
        analysis = {"profile": profile_from_reading(reading), "confidence": None, "modelUsed": reading.get("readBy", "manual"),
                    "detectedInspirationFeatures": {}}
    else:
        analysis = client.post(f"{API}/ai-inference/inspiration-analysis", headers=headers, timeout=180,
                               json={"inspirationImageUrl": url, "aiProvider": provider, "refresh": True}).json()["data"]
    profile = analysis.get("profile")
    row: dict = {"image": path.name, "mediaId": media_id, "url": url, "confidence": analysis.get("confidence"),
                 "model": analysis.get("modelUsed"), "profile": profile}
    if not profile or not profile.get("isGarment") or profile.get("garmentType") not in garments:
        row["skipped"] = f"not one of {sorted(garments)} or unreadable"
        return row
    listed = GROUPS.get(profile["garmentType"], set())
    details = {k: v for k, v in (profile.get("details") or {}).items() if k in listed}
    created = client.post(f"{API}/pattern-projects", headers=headers, json={
        "garmentType": profile["garmentType"], "occasion": profile.get("occasion"), "style": profile.get("style"),
        "cutType": profile.get("cutType"), "detailsJson": details}).json()["data"]
    pid = created["id"]
    ext = {k: profile["fit"][k] for k in ("ease", "fullness", "lengths") if profile.get("fit") and profile["fit"].get(k)}
    if profile.get("drapeBlocks"):
        ext["drape"] = {"blocks": [{k: v for k, v in b.items() if k != "certainty"} for b in profile["drapeBlocks"]]}
    patch = {"inspirationMediaId": media_id, "inspirationAnalysisJson": {
        "profile": profile, "features": analysis.get("detectedInspirationFeatures") or {}}}
    if ext:
        patch["parametersExtJson"] = ext
    client.patch(f"{API}/pattern-projects/{pid}", headers=headers, json=patch).raise_for_status()
    gen = client.post(f"{API}/pattern-projects/{pid}/generate", headers=headers, timeout=120,
                      json={"measurements": MEASUREMENTS})
    row["projectId"] = pid
    if gen.status_code >= 300:
        row["error"] = gen.json().get("error", gen.text)
        return row
    version = gen.json()["data"]
    row["version"] = version["versionNumber"]
    row["pieces"] = [{"name": p["name"], "quantity": p["quantity"]} for p in version["pieces"]]
    row["warnings"] = version["parametersJson"].get("warnings", [])
    return row


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--images", nargs="+", required=True, help="image files or folders")
    ap.add_argument("--out", required=True)
    ap.add_argument("--provider", default="ANTHROPIC")
    ap.add_argument("--email", default="client@angaly.mg")
    ap.add_argument("--password", default="Client@Angaly2026!")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--garments", nargs="+", default=sorted(DRESSES), help="garment types to keep, or: all")
    ap.add_argument("--analysis", help="JSON of hand readings keyed by image name: no vision call, only these images")
    args = ap.parse_args()
    files: list[Path] = []
    for item in args.images:
        p = Path(item).expanduser()
        files += sorted(p.rglob("*.jp*g")) + sorted(p.rglob("*.png")) if p.is_dir() else [p]
    if args.limit:
        files = files[: args.limit]
    readings = json.loads(Path(args.analysis).read_text()) if args.analysis else None
    if readings is not None:
        files = [f for f in files if f.name in readings]
    out = Path(args.out).expanduser()
    out.mkdir(parents=True, exist_ok=True)
    results_path = out / "results.json"
    results = json.loads(results_path.read_text()) if results_path.exists() else {}
    with httpx.Client(timeout=60) as client:
        headers = login(client, args.email, args.password)
        for path in files:
            if path.name in results and "projectId" in results[path.name]:
                continue
            try:
                garments = set(GROUPS) if args.garments == ["all"] else set(args.garments)
                results[path.name] = run_one(client, headers, path, args.provider, garments,
                                             readings.get(path.name) if readings is not None else None)
            except Exception as exc:  # keep going: one bad photo must not stop the batch
                results[path.name] = {"image": path.name, "error": f"{type(exc).__name__}: {exc}"}
            results_path.write_text(json.dumps(results, ensure_ascii=False, indent=1))
            print(path.name, results[path.name].get("projectId") or results[path.name].get("skipped") or results[path.name].get("error"))


if __name__ == "__main__":
    main()
