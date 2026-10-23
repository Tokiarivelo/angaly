"""CC0 inspiration photos for the dress catalogue (packages/pattern-engine/src/__tests__/fixtures/dress-catalog.ts).

For each catalogue dress, a few Met Open Access candidates (Costume Institute, public domain, matching period) are
saved OUTSIDE the repository, with licence + source page in `candidates.jsonl`; one is then chosen per dress by eye
(`chosen.json`). Labels are not validated: nothing here enters training.

    python ml/scripts/fetch_catalog_inspirations.py --out ~/angaly-catalog-inspirations --per 4
    # other open sources (see --source): Commons categories, Europeana (reusability=open), Smithsonian Open Access
    python ml/scripts/fetch_catalog_inspirations.py --out ~/angaly-catalog-inspirations --source europeana --only peplum

Europeana uses the public demo key unless EUROPEANA_API_KEY is set; Smithsonian uses DEMO_KEY (rate-limited)
unless SMITHSONIAN_API_KEY is set. Each source writes its own log (`candidates-<source>.jsonl`) and files
(`<dress>/<source>-<n>.jpg`).
"""
from __future__ import annotations

import argparse
import json
import os
import re
import time
from pathlib import Path

import httpx

BASE = "https://collectionapi.metmuseum.org/public/collection/v1"
SEARCH = "https://collectionapi.metmuseum.org/public/collection/v1.1/search"
UA = {"User-Agent": "angaly-eval/0.1 (dress catalogue; contact: jack.bun14@gmail.com)"}
DROP = re.compile(r"doll|miniature|sample|fragment|fashion plate|print|drawing|photograph|shoe|hat|fan\b", re.IGNORECASE)

# id → (queries, dateBegin, dateEnd). Modern pieces of the Costume Institute are rarely public domain: the period
# window is widened (and the search falls back to the earliest public-domain equivalent) rather than left empty.
CATALOG: dict[str, tuple[list[str], int, int]] = {
    "fourreau-double": (["sheath dress", "evening dress"], 1940, 1975),
    "robe-chemise": (["shirtwaist dress", "day dress"], 1930, 1975),
    "portefeuille": (["wrap dress", "dress"], 1930, 1980),
    "trapeze-60": (["dress", "cocktail dress"], 1955, 1975),
    "boheme-etagee": (["dress", "tiered dress"], 1960, 1985),
    "godets-30": (["dress", "evening dress"], 1928, 1938),
    "sirene-soiree": (["evening dress", "gown"], 1935, 1960),
    "peplum": (["dress", "cocktail dress"], 1938, 1960),
    "swing-50": (["day dress", "dress"], 1948, 1960),
    "babydoll": (["dress", "party dress"], 1955, 1975),
    "flamenca": (["dress", "flamenco"], 1880, 1970),
    "charleston": (["evening dress", "dress"], 1922, 1929),
    "grecque": (["evening dress", "gown"], 1930, 1975),
    "kimono": (["kimono", "dress"], 1900, 1940),
    "caftan": (["caftan", "kaftan"], 1850, 1975),
    "chasuble": (["jumper", "dress"], 1900, 1975),
    "dirndl": (["dirndl", "ensemble"], 1850, 1960),
    "qipao": (["cheongsam", "qipao", "dress"], 1900, 1965),
    "robe-manteau": (["coat dress", "dress"], 1895, 1915),
    "paysanne-smocks": (["smock", "dress"], 1880, 1930),
    "francaise-1750": (["robe à la française"], 1740, 1775),
    "polonaise-1780": (["robe à la polonaise", "polonaise"], 1770, 1790),
    "regence-1810": (["dress", "evening dress"], 1800, 1820),
    "romantique-1835": (["dress"], 1828, 1838),
    "crinoline-1855": (["ball gown", "evening dress"], 1850, 1862),
    "pagode-1860": (["dress", "day dress"], 1855, 1866),
    "tournure-1885": (["dress", "afternoon dress"], 1883, 1888),
    "gibson-1895": (["dress", "afternoon dress"], 1893, 1897),
    "edouardienne-1905": (["dress", "afternoon dress"], 1900, 1910),
    "titanic-1912": (["evening dress", "dress"], 1910, 1914),
    "robe-de-style-1924": (["robe de style", "evening dress"], 1920, 1927),
    "biais-1933": (["evening dress"], 1930, 1938),
    "tudor-1540": (["gown", "dress"], 1500, 1650),
    "houppelande-1400": (["gown", "dress"], 1300, 1600),
    "mariee-bal": (["wedding dress"], 1850, 1960),
    "mariee-sirene-dentelle": (["wedding dress"], 1930, 1975),
}


COMMONS = "https://commons.wikimedia.org/w/api.php"
# Free licences only (no NC / ND): the credit (author + licence) is kept and shown with the photo.
ALLOWED = re.compile(r"^(public domain|pd|cc0|cc[ -]by(-sa)?( \d\.\d)?)", re.IGNORECASE)
# Commons searches for dresses the Met does not have in the public domain (modern pieces, folk dress).
COMMONS_QUERIES: dict[str, list[str]] = {
    "fourreau-double": ["sheath dress museum", "1960s sheath dress", "little black dress 1950s mannequin", "Balenciaga sheath dress"],
    "robe-chemise": ["shirtwaist dress 1950s", "shirt dress museum"],
    "portefeuille": ["wrap dress", "Diane von Furstenberg wrap dress"],
    "trapeze-60": ["1960s A-line dress", "mod dress 1960s museum"],
    "boheme-etagee": ["tiered maxi dress", "1970s prairie dress"],
    "godets-30": ["1930s dress museum", "1930s day dress"],
    "sirene-soiree": ["mermaid evening gown", "1950s evening gown museum"],
    "peplum": ["peplum dress", "1940s peplum"],
    "swing-50": ["1950s swing dress", "1950s day dress museum"],
    "babydoll": ["babydoll dress", "1960s babydoll dress"],
    "flamenca": ["traje de flamenca", "flamenco dress"],
    "charleston": ["1920s flapper dress", "1925 beaded dress"],
    "grecque": ["Grecian gown 1930s", "Madame Grès gown"],
    "kimono": ["kimono dress", "kimono museum"],
    "caftan": ["caftan Morocco", "kaftan dress"],
    "chasuble": ["pinafore dress", "jumper dress", "pinafore dress mannequin", "jumper dress 1960s"],
    "dirndl": ["dirndl", "Dirndl Tracht"],
    "qipao": ["qipao 1930s", "cheongsam museum"],
    "robe-manteau": ["coat dress", "1900s coat dress"],
    "paysanne-smocks": ["smocked peasant dress", "smocked dress", "smocking dress museum", "peasant blouse dress embroidered"],
    "tudor-1540": ["Tudor gown reconstruction", "French hood gown 1540", "Tudor dress", "Anne Boleyn costume", "16th century gown costume"],
    "houppelande-1400": ["cotehardie reconstruction", "medieval gown reconstruction", "medieval dress reenactment", "cotehardie", "15th century dress reenactment"],
    "mariee-sirene-dentelle": ["lace mermaid wedding dress", "lace wedding dress"],
    "robe-de-style-1924": ["robe de style Lanvin", "Jeanne Lanvin robe de style", "1920s robe de style"],
    "biais-1933": ["Vionnet bias cut gown", "1930s evening gown bias cut", "Madeleine Vionnet dress"],
}


def commons_candidates(client: httpx.Client, query: str, limit: int) -> list[dict]:
    """Files found by a Commons search, with their licence (free licences only)."""
    found = get(client, COMMONS, action="query", list="search", srsearch=f"{query} filetype:bitmap", srnamespace=6,
                srlimit=min(limit * 5, 30), format="json")
    titles = [h["title"] for h in found.get("query", {}).get("search", [])]
    if not titles:
        return []
    info = get(client, COMMONS, action="query", titles="|".join(titles[:30]), prop="imageinfo",
               iiprop="url|extmetadata|size", iiurlwidth=768, format="json")
    out = []
    for page in info.get("query", {}).get("pages", {}).values():
        ii = (page.get("imageinfo") or [None])[0]
        if not ii:
            continue
        meta = ii.get("extmetadata", {})
        licence = meta.get("LicenseShortName", {}).get("value", "")
        if not ALLOWED.match(licence) or "nc" in licence.lower() or "nd" in licence.lower().split("-"):
            continue
        author = re.sub(r"<[^>]+>", "", meta.get("Artist", {}).get("value", "unknown")).strip()
        out.append({"title": page["title"], "url": ii.get("thumburl") or ii["url"], "page": ii["descriptionurl"],
                    "license": licence, "author": author[:120],
                    "date": re.sub(r"<[^>]+>", "", meta.get("DateTimeOriginal", {}).get("value", ""))[:40]})
    return out


# Commons categories (curated by people, more precise than full-text search); one level of sub-categories is followed.
COMMONS_CATEGORIES: dict[str, list[str]] = {
    "fourreau-double": ["Sheath dresses"],
    "portefeuille": ["Wrap dresses", "Clothing designed by Diane von Fürstenberg"],
    "peplum": ["Peplums"],
    "paysanne-smocks": ["Smocking"],
    "biais-1933": ["Bias cut", "Clothing designed by Madeleine Vionnet"],
    "dirndl": ["Dirndl"],
}
# Targeted searches for the open museum APIs (Europeana, Smithsonian).
MUSEUM_QUERIES: dict[str, list[str]] = {
    "fourreau-double": ["sheath dress", "wiggle dress"],
    "peplum": ["peplum dress", "dress with peplum 1950s"],
    "biais-1933": ["Vionnet bias gown", "cowl neck evening gown 1930s", "bias cut evening dress"],
    "paysanne-smocks": ["smocked peasant dress", "smocked dress"],
    "portefeuille": ["wrap dress"],
    "dirndl": ["dirndl"],
}
EUROPEANA = "https://api.europeana.eu/record/v2/search.json"
SMITHSONIAN = "https://api.si.edu/openaccess/api/v1.0/search"


def free_licence(licence: str) -> bool:
    """Public domain, CC0, CC BY or CC BY-SA (never NC / ND): the photo can be shown with its credit."""
    text = licence.strip().lower()
    if not ALLOWED.match(text):
        return False
    return not re.search(r"\bnc\b|\bnd\b|-nc|-nd", text)


def licence_from_rights(url: str) -> str:
    """Europeana `rights` URL → licence name ('' when not a free licence)."""
    if "publicdomain/zero" in url:
        return "CC0"
    if "publicdomain/mark" in url:
        return "Public domain"
    found = re.search(r"creativecommons\.org/licenses/([a-z-]+)/(\d\.\d)", url)
    if not found:
        return ""
    name = f"CC {found.group(1).upper()} {found.group(2)}"
    return name if free_licence(name) else ""


def europeana_candidates(payload: dict) -> list[dict]:
    """Free images of a Europeana search response."""
    out = []
    for item in payload.get("items", []):
        licence = licence_from_rights((item.get("rights") or [""])[0])
        url = (item.get("edmIsShownBy") or item.get("edmPreview") or [None])[0]
        if not licence or not url:
            continue
        out.append({"title": (item.get("title") or [""])[0], "url": url, "page": item.get("guid", ""),
                    "license": licence, "author": ((item.get("dcCreator") or item.get("dataProvider") or ["unknown"])[0])[:120],
                    "date": str((item.get("year") or [""])[0]),
                    "source": f"Europeana — {(item.get('dataProvider') or [''])[0]}".rstrip(" —")})
    return out


def smithsonian_candidates(payload: dict) -> list[dict]:
    """CC0 images of a Smithsonian Open Access search response."""
    out = []
    for row in payload.get("response", {}).get("rows", []):
        content = row.get("content", {})
        nonrep = content.get("descriptiveNonRepeating", {})
        if nonrep.get("metadata_usage", {}).get("access") != "CC0":
            continue
        media = [m for m in nonrep.get("online_media", {}).get("media", [])
                 if m.get("type") == "Images" and m.get("usage", {}).get("access") == "CC0"]
        if not media:
            continue
        sizes = {r.get("label"): r.get("url") for r in media[0].get("resources", [])}
        url = sizes.get("Screen Image") or sizes.get("High-resolution JPEG") or media[0].get("content")
        if not url:
            continue
        dates = content.get("indexedStructured", {}).get("date") or [""]
        out.append({"title": row.get("title", ""), "url": url, "page": nonrep.get("record_link") or nonrep.get("guid", ""),
                    "license": "CC0 (Smithsonian Open Access)", "author": nonrep.get("data_source", "Smithsonian")[:120],
                    "date": str(dates[0]), "source": f"Smithsonian — {nonrep.get('data_source', '')}".rstrip(" —")})
    return out


def commons_category_files(client: httpx.Client, category: str, depth: int = 1) -> list[str]:
    """File titles of a Commons category (and of its sub-categories, `depth` levels down)."""
    found = get(client, COMMONS, action="query", list="categorymembers", cmtitle=f"Category:{category}",
                cmlimit=500, format="json")
    members = found.get("query", {}).get("categorymembers", [])
    files = [m["title"] for m in members if m["ns"] == 6]
    if depth > 0:
        for sub in (m["title"] for m in members if m["ns"] == 14):
            files += commons_category_files(client, sub.removeprefix("Category:"), depth - 1)
    return files


def commons_file_info(client: httpx.Client, titles: list[str]) -> list[dict]:
    """Licence, author and thumbnail of Commons files (free licences only)."""
    out = []
    for start in range(0, len(titles), 30):
        info = get(client, COMMONS, action="query", titles="|".join(titles[start:start + 30]), prop="imageinfo",
                   iiprop="url|extmetadata|size", iiurlwidth=768, format="json")
        for page in info.get("query", {}).get("pages", {}).values():
            ii = (page.get("imageinfo") or [None])[0]
            if not ii:
                continue
            meta = ii.get("extmetadata", {})
            licence = meta.get("LicenseShortName", {}).get("value", "")
            if not free_licence(licence):
                continue
            author = re.sub(r"<[^>]+>", "", meta.get("Artist", {}).get("value", "unknown")).strip()
            out.append({"title": page["title"], "url": ii.get("thumburl") or ii["url"], "page": ii["descriptionurl"],
                        "license": licence, "author": author[:120], "source": "Wikimedia Commons",
                        "date": re.sub(r"<[^>]+>", "", meta.get("DateTimeOriginal", {}).get("value", ""))[:40]})
    return out


def download(client: httpx.Client, url: str, deadline_s: float = 30, max_bytes: int = 15_000_000) -> bytes | None:
    """An image, or None if it is not one, is too big or takes longer than `deadline_s` in all (a slow host can
    trickle bytes forever under a per-read timeout)."""
    start = time.monotonic()
    try:
        with client.stream("GET", url, headers=UA, timeout=20) as response:
            if response.status_code != 200 or not response.headers.get("content-type", "image/").startswith("image/"):
                return None
            body = bytearray()
            for chunk in response.iter_bytes():
                body += chunk
                if len(body) > max_bytes or time.monotonic() - start > deadline_s:
                    return None
            return bytes(body)
    except httpx.HTTPError:
        return None


def source_candidates(client: httpx.Client, source: str, dress: str, limit: int) -> list[dict]:
    """Candidates of one open source for one dress, before download."""
    if source == "commons-cat":
        titles: list[str] = []
        for category in COMMONS_CATEGORIES.get(dress, []):
            titles += [t for t in commons_category_files(client, category) if t not in titles]
        return commons_file_info(client, [t for t in titles if re.search(r"\.(jpe?g|png)$", t, re.IGNORECASE)])
    out: list[dict] = []
    for query in MUSEUM_QUERIES.get(dress, []):
        if source == "europeana":
            payload = get(client, EUROPEANA, wskey=os.environ.get("EUROPEANA_API_KEY", "api2demo"), query=query,
                          reusability="open", media="true", qf="TYPE:IMAGE", rows=limit * 3)
            out += europeana_candidates(payload)
        elif source == "smithsonian":
            payload = get(client, SMITHSONIAN, api_key=os.environ.get("SMITHSONIAN_API_KEY", "DEMO_KEY"),
                          q=f'{query} AND online_media_type:"Images"', rows=limit * 3)
            out += smithsonian_candidates(payload)
    return out


def get(client: httpx.Client, url: str, **params: str | int) -> dict:
    for attempt in range(3):
        try:
            response = client.get(url, params=params, headers=UA, timeout=30)
        except httpx.HTTPError:
            time.sleep(2 * (attempt + 1))
            continue
        if response.status_code == 200:
            return response.json()
        time.sleep(2 * (attempt + 1))
    return {}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", required=True)
    parser.add_argument("--per", type=int, default=4)
    parser.add_argument("--only", nargs="*", default=None)
    parser.add_argument("--commons", action="store_true", help="search Wikimedia Commons instead of the Met")
    parser.add_argument("--source", choices=["commons-cat", "europeana", "smithsonian"], default=None,
                        help="another open source (Commons categories, Europeana, Smithsonian Open Access)")
    args = parser.parse_args()
    if args.source:
        fetch_source(args.source, Path(args.out).expanduser(), args.per, args.only)
        return
    out = Path(args.out).expanduser()
    out.mkdir(parents=True, exist_ok=True)
    rows: list[dict] = []
    with httpx.Client(follow_redirects=True) as client:
        if args.commons:
            for dress, queries in COMMONS_QUERIES.items():
                if args.only and dress not in args.only:
                    continue
                folder = out / dress
                folder.mkdir(exist_ok=True)
                got = 0
                for query in queries:
                    for cand in commons_candidates(client, query, args.per):
                        if got >= args.per:
                            break
                        image = client.get(cand["url"], headers=UA, timeout=60)
                        if image.status_code != 200 or len(image.content) < 5_000:
                            continue
                        got += 1
                        file = f"{dress}/commons-{got}.jpg"
                        (out / file).write_bytes(image.content)
                        rows.append({"dress": dress, "imagePath": file, "title": cand["title"], "objectName": "",
                                     "date": cand["date"], "culture": "", "page": cand["page"], "url": cand["url"],
                                     "license": cand["license"], "author": cand["author"]})
                        time.sleep(0.3)
                print(f"{dress}: {got} (Commons)", flush=True)
        for dress, (queries, begin, end) in ([] if args.commons else CATALOG.items()):
            if args.only and dress not in args.only:
                continue
            folder = out / dress
            folder.mkdir(exist_ok=True)
            got = 0
            seen: set[int] = set()
            for query in queries:
                if got >= args.per:
                    break
                ids = get(client, SEARCH, q=query, hasImages="true", isPublicDomain="true", departmentId=8,
                          dateBegin=begin, dateEnd=end).get("objectIDs") or []
                for object_id in ids[:40]:
                    if got >= args.per or object_id in seen:
                        continue
                    seen.add(object_id)
                    meta = get(client, f"{BASE}/objects/{object_id}")
                    name, title = meta.get("objectName", ""), meta.get("title", "")
                    url = meta.get("primaryImageSmall")
                    if not meta.get("isPublicDomain") or not url or DROP.search(f"{name} {title}"):
                        continue
                    image = client.get(url, headers=UA, timeout=60)
                    if image.status_code != 200 or len(image.content) < 5_000:
                        continue
                    got += 1
                    file = f"{dress}/cand-{got}.jpg"
                    (out / file).write_bytes(image.content)
                    rows.append({"dress": dress, "imagePath": file, "title": title, "objectName": name,
                                 "date": meta.get("objectDate", ""), "culture": meta.get("culture", ""),
                                 "page": meta.get("objectURL", ""), "url": url, "license": "CC0 (The Met Open Access)",
                                 "author": meta.get("artistDisplayName") or "The Metropolitan Museum of Art"})
                    time.sleep(0.3)
            print(f"{dress}: {got}", flush=True)
    existing = out / ("candidates-commons.jsonl" if args.commons else "candidates.jsonl")
    old = [json.loads(line) for line in existing.read_text().splitlines() if line.strip()] if existing.exists() else []
    keep = [r for r in old if not args.only or r["dress"] not in args.only] if args.only else []
    existing.write_text("\n".join(json.dumps(r, ensure_ascii=False) for r in keep + rows) + "\n")
    print(f"{len(rows)} images in {out}")


def fetch_source(source: str, out: Path, per: int, only: list[str] | None) -> None:
    """Download up to `per` free images per dress from one open source; log licence + source page."""
    dresses = COMMONS_CATEGORIES if source == "commons-cat" else MUSEUM_QUERIES
    rows: list[dict] = []
    with httpx.Client(follow_redirects=True) as client:
        for dress in dresses:
            if only and dress not in only:
                continue
            (out / dress).mkdir(parents=True, exist_ok=True)
            got = 0
            seen: set[str] = set()
            for cand in source_candidates(client, source, dress, per):
                if got >= per or cand["url"] in seen:
                    continue
                seen.add(cand["url"])
                body = download(client, cand["url"])
                if body is None or len(body) < 5_000:
                    continue
                got += 1
                file = f"{dress}/{source}-{got}.jpg"
                (out / file).write_bytes(body)
                rows.append({"dress": dress, "imagePath": file, "objectName": "", "culture": "", **cand})
                time.sleep(0.3)
            print(f"{dress}: {got} ({source})", flush=True)
    log = out / f"candidates-{source}.jsonl"
    old = [json.loads(line) for line in log.read_text().splitlines() if line.strip()] if log.exists() else []
    keep = [r for r in old if only and r["dress"] not in only]
    log.write_text("\n".join(json.dumps(r, ensure_ascii=False) for r in keep + rows) + "\n")
    print(f"{len(rows)} images ({source}) in {out}")


if __name__ == "__main__":
    main()
