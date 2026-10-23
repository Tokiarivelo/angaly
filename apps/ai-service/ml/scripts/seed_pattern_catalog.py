"""Seeds the pattern catalogue's inspiration photos, and optionally builds one real project per dress.

1. Upload: each photo chosen in `<dir>/chosen.json` ({dress id: "relative/path.jpg"}) goes to MinIO through the API's
   media endpoints (presigned upload + confirm, entity PATTERN_INSPIRATION, altText `catalog:<id> — <credit>`), which
   is how the `pattern-catalog` module finds it. The credits (title, date, source, page, licence) are written to
   `apps/api/src/pattern-catalog/infrastructure/data/catalog-inspirations.json`.
2. `--projects`: for each dress, POST /pattern-catalog/<id>/projects then generate it at the reference measurements;
   writes `<out>/results.json` ({id: {projectId, version, pieces}}) for `dress_3d_capture.mjs`.

    python ml/scripts/seed_pattern_catalog.py --dir ~/angaly-catalog-inspirations [--projects --out ~/angaly-catalog-run]

ANGALY_API (default http://127.0.0.1:3003/api) picks the API; the seed admin uploads, the seed client owns the projects.
"""
from __future__ import annotations

import argparse
import json
import mimetypes
import os
import re
from pathlib import Path

import httpx

API = os.environ.get("ANGALY_API", "http://127.0.0.1:3003/api")
REPO = Path(__file__).resolve().parents[4]
CREDITS = REPO / "apps" / "api" / "src" / "pattern-catalog" / "infrastructure" / "data" / "catalog-inspirations.json"
# Same reference body as the catalogue (packages/pattern-engine/src/catalog/dress-catalog.ts CATALOG_MEASUREMENTS).
MEASUREMENTS = {"TOUR_COU": 36, "TOUR_POITRINE": 92, "TOUR_TAILLE": 74, "TOUR_BASSIN": 98, "LONGUEUR_DOS": 42,
                "LONGUEUR_BRAS": 59, "CARRURE_DOS": 36, "TOUR_POIGNET": 16}


def login(client: httpx.Client, email: str, password: str) -> dict[str, str]:
    r = client.post(f"{API}/auth/login", json={"email": email, "password": password})
    r.raise_for_status()
    return {"authorization": f"Bearer {r.json()['data']['accessToken']}"}


def data(response: httpx.Response) -> dict:
    response.raise_for_status()
    body = response.json()
    return body.get("data", body)


def credit_of(row: dict) -> dict:
    if row.get("source", "").startswith(("Europeana", "Smithsonian")):
        # Open museum APIs: the row already names the institution; the title is the object's own.
        return {"title": row.get("title", ""), "date": str(row.get("date", "")).split(";")[0].strip()[:40],
                "source": row["source"], "page": row.get("page", ""), "license": row.get("license", "")}
    museum = "The Met" if "metmuseum" in row.get("page", "") else "Wikimedia Commons"
    author = row.get("author") or museum
    source = museum if author in ("", museum, "The Metropolitan Museum of Art") else f"{museum} — {author}"
    title = row.get("title", "").replace("File:", "").rsplit(".", 1)[0] if museum != "The Met" else row.get("title", "")
    # Commons gives the upload date when the work's own is unknown: shown only when it reads as a period.
    date = row.get("date", "")
    if museum != "The Met" and (re.match(r"^(19[89]|20)\d\d-", date) or date.lower() == "unknown"):
        date = ""
    return {"title": title, "date": date.split(";")[0].strip()[:40], "source": source, "page": row.get("page", ""), "license": row.get("license", "")}


def upload(client: httpx.Client, headers: dict[str, str], dress: str, path: Path, credit: dict) -> str:
    mime = mimetypes.guess_type(path.name)[0] or "image/jpeg"
    pre = data(client.post(f"{API}/media/presigned-upload", headers=headers, json={
        "entityType": "PATTERN_INSPIRATION", "originalFilename": f"catalog-{dress}{path.suffix}", "mimeType": mime}))
    body = path.read_bytes()
    client.put(pre["uploadUrl"], content=body, headers={"Content-Type": mime}).raise_for_status()
    alt = f"catalog:{dress} — {credit['title']}, {credit['date']} ({credit['source']}, {credit['license']})"[:250]
    media = data(client.post(f"{API}/media/confirm", headers=headers, json={
        "bucket": pre["bucket"], "objectKey": pre["objectKey"], "entityType": "PATTERN_INSPIRATION",
        "altText": alt, "mimeType": mime, "sizeBytes": len(body)}))
    return media["url"]


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--dir", required=True, help="folder of fetch_catalog_inspirations.py (with chosen.json)")
    ap.add_argument("--admin-email", default="admin@angaly.mg")
    ap.add_argument("--admin-password", default="Admin@Angaly2026!")
    ap.add_argument("--email", default="client@angaly.mg")
    ap.add_argument("--password", default="Client@Angaly2026!")
    ap.add_argument("--skip-upload", action="store_true")
    ap.add_argument("--only", nargs="*", default=None, help="upload only these dress ids (others keep their photo)")
    ap.add_argument("--projects", action="store_true")
    ap.add_argument("--out", default="~/angaly-catalog-run")
    args = ap.parse_args()
    folder = Path(args.dir).expanduser()
    chosen: dict[str, str] = json.loads((folder / "chosen.json").read_text())
    rows = {}
    # Met first, then every other source log (candidates-commons, -commons-cat, -europeana, -smithsonian…).
    for f in [folder / "candidates.jsonl", *sorted(folder.glob("candidates-*.jsonl"))]:
        if f.exists():
            for line in f.read_text().splitlines():
                if line.strip():
                    r = json.loads(line)
                    rows[r["imagePath"]] = r
    with httpx.Client(timeout=120) as client:
        if not args.skip_upload:
            admin = login(client, args.admin_email, args.admin_password)
            credits = json.loads(CREDITS.read_text()) if CREDITS.exists() else {}
            for dress, rel in chosen.items():
                if args.only and dress not in args.only:
                    continue
                row = rows.get(rel)
                if row is None:
                    print(f"{dress}: {rel} has no candidate row, skipped")
                    continue
                credit = credit_of(row)
                url = upload(client, admin, dress, folder / rel, credit)
                credits[dress] = credit
                print(f"{dress}: {url}")
            CREDITS.write_text(json.dumps(dict(sorted(credits.items())), ensure_ascii=False, indent=2) + "\n")
        if args.projects:
            out = Path(args.out).expanduser()
            out.mkdir(parents=True, exist_ok=True)
            client_headers = login(client, args.email, args.password)
            catalog = data(client.get(f"{API}/pattern-catalog", headers=client_headers))
            results: dict[str, dict] = {}
            for entry in catalog:
                created = data(client.post(f"{API}/pattern-catalog/{entry['id']}/projects", headers=client_headers))
                pid = created["projectId"]
                gen = client.post(f"{API}/pattern-projects/{pid}/generate", headers=client_headers, json={"measurements": MEASUREMENTS})
                row = {"image": entry["id"], "projectId": pid}
                if gen.status_code >= 300:
                    row["error"] = gen.text[:300]
                else:
                    version = data(gen)
                    row["version"] = version["versionNumber"]
                    row["pieces"] = len(version["pieces"])
                results[entry["id"]] = row
                print(entry["id"], row.get("version"), row.get("pieces"), row.get("error", ""))
            (out / "results.json").write_text(json.dumps(results, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
