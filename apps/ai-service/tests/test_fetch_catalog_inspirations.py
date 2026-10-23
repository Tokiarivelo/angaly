"""Licence filter and parsers of ml/scripts/fetch_catalog_inspirations.py (offline: canned API responses)."""
import importlib.util
from pathlib import Path

import pytest

SCRIPT = Path(__file__).resolve().parents[1] / "ml" / "scripts" / "fetch_catalog_inspirations.py"
spec = importlib.util.spec_from_file_location("fetch_catalog_inspirations", SCRIPT)
assert spec is not None and spec.loader is not None
fetch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fetch)


@pytest.mark.parametrize(
    ("licence", "ok"),
    [
        ("CC0", True),
        ("Public domain", True),
        ("CC BY 4.0", True),
        ("CC BY-SA 3.0", True),
        ("CC BY-NC 4.0", False),
        ("CC BY-ND 2.0", False),
        ("CC BY-NC-SA 4.0", False),
        ("All rights reserved", False),
        ("", False),
    ],
)
def test_free_licence_refuses_nc_and_nd(licence, ok):
    assert fetch.free_licence(licence) is ok


@pytest.mark.parametrize(
    ("url", "name"),
    [
        ("http://creativecommons.org/publicdomain/zero/1.0/", "CC0"),
        ("http://creativecommons.org/publicdomain/mark/1.0/", "Public domain"),
        ("http://creativecommons.org/licenses/by-sa/4.0/", "CC BY-SA 4.0"),
        ("http://creativecommons.org/licenses/by-nc/4.0/", ""),
        ("http://rightsstatements.org/vocab/InC/1.0/", ""),
    ],
)
def test_licence_from_europeana_rights(url, name):
    assert fetch.licence_from_rights(url) == name


def test_europeana_keeps_free_images_with_credit():
    payload = {"items": [
        {"title": ["Wrap dress"], "rights": ["http://creativecommons.org/licenses/by/4.0/"],
         "edmIsShownBy": ["https://img.example/1.jpg"], "guid": "https://www.europeana.eu/item/1",
         "dcCreator": ["Studio X"], "dataProvider": ["MoMu"], "year": ["1975"]},
        {"title": ["No image"], "rights": ["http://creativecommons.org/publicdomain/zero/1.0/"]},
        {"title": ["Closed"], "rights": ["http://rightsstatements.org/vocab/InC/1.0/"],
         "edmPreview": ["https://img.example/2.jpg"]},
    ]}
    [only] = fetch.europeana_candidates(payload)
    assert only["url"] == "https://img.example/1.jpg"
    assert only["license"] == "CC BY 4.0"
    assert only["author"] == "Studio X"
    assert only["source"] == "Europeana — MoMu"
    assert only["date"] == "1975"


def test_smithsonian_keeps_cc0_images_only():
    def row(access, media_access="CC0"):
        return {"title": "Sheath dress", "content": {
            "descriptiveNonRepeating": {
                "metadata_usage": {"access": access}, "data_source": "NMAH", "record_link": "https://si.edu/x",
                "online_media": {"media": [{"type": "Images", "usage": {"access": media_access},
                                            "content": "https://ids.si.edu/full",
                                            "resources": [{"label": "Screen Image", "url": "https://ids.si.edu/screen"}]}]}},
            "indexedStructured": {"date": ["1960s"]}}}

    out = fetch.smithsonian_candidates({"response": {"rows": [row("CC0"), row("Usage conditions apply"),
                                                               row("CC0", media_access="restricted")]}})
    assert len(out) == 1
    assert out[0]["url"] == "https://ids.si.edu/screen"
    assert out[0]["license"].startswith("CC0")
    assert out[0]["page"] == "https://si.edu/x"
    assert out[0]["date"] == "1960s"


def test_every_target_dress_is_in_the_catalogue_queries():
    # The new sources only cover dresses already known to the Met / Commons tables.
    assert set(fetch.MUSEUM_QUERIES) <= set(fetch.CATALOG)
    assert set(fetch.COMMONS_CATEGORIES) <= set(fetch.CATALOG)


SEED = SCRIPT.with_name("seed_pattern_catalog.py")
seed_spec = importlib.util.spec_from_file_location("seed_pattern_catalog", SEED)
assert seed_spec is not None and seed_spec.loader is not None
seed = importlib.util.module_from_spec(seed_spec)
seed_spec.loader.exec_module(seed)


def test_credit_of_museum_api_rows_keeps_their_institution():
    row = {"title": "Sheath dress", "date": "1962; 20th century", "source": "Smithsonian — NMAH",
           "page": "https://si.edu/x", "license": "CC0 (Smithsonian Open Access)"}
    assert seed.credit_of(row) == {"title": "Sheath dress", "date": "1962", "source": "Smithsonian — NMAH",
                                   "page": "https://si.edu/x", "license": "CC0 (Smithsonian Open Access)"}


def test_credit_of_commons_row_hides_upload_dates():
    row = {"title": "File:Red sheath.jpg", "date": "2012-05-03", "author": "JesseFRich",
           "page": "https://commons.wikimedia.org/wiki/File:Red_sheath.jpg", "license": "CC BY-SA 3.0"}
    credit = seed.credit_of(row)
    assert credit["title"] == "Red sheath"
    assert credit["date"] == ""
    assert credit["source"] == "Wikimedia Commons — JesseFRich"


def _client(handler):
    import httpx
    return httpx.Client(transport=httpx.MockTransport(handler))


def test_download_returns_image_bytes():
    import httpx
    with _client(lambda r: httpx.Response(200, content=b"x" * 10, headers={"content-type": "image/jpeg"})) as c:
        assert fetch.download(c, "https://img.example/a.jpg") == b"x" * 10


def test_download_refuses_non_images_errors_and_oversize():
    import httpx
    with _client(lambda r: httpx.Response(200, content=b"<html>", headers={"content-type": "text/html"})) as c:
        assert fetch.download(c, "https://img.example/a") is None
    with _client(lambda r: httpx.Response(404)) as c:
        assert fetch.download(c, "https://img.example/a") is None
    with _client(lambda r: httpx.Response(200, content=b"x" * 100, headers={"content-type": "image/png"})) as c:
        assert fetch.download(c, "https://img.example/a", max_bytes=50) is None

    def boom(request):
        raise httpx.ConnectError("down")
    with _client(boom) as c:
        assert fetch.download(c, "https://img.example/a") is None
