# server.py
"""
Local Python server that:
  1) Finds latest TEMPO granule via CMR (/tempo/latest)
  2) Requests Harmony to subset/reproject it to COG (/tempo/cog)
  3) Serves XYZ tiles from that COG via TiTiler (mounted at /tiles)

Run:
  uvicorn server:app --reload --port 8000

Test flow:
  1) GET  http://localhost:8000/tempo/latest?short_name=TEMPO_NO2_L3&bbox=-125,24,-66,50
  2) GET  http://localhost:8000/tempo/cog?granule_href=<HREF_FROM_STEP_1>&bbox=-125,24,-66,50
  3) Open a tile:
     http://localhost:8000/tiles/cog/tiles/4/3/6.png?url=<ENCODED_COG_URL>&rescale=0,1&colormap=viridis
"""

import os
import time
import datetime
import urllib.parse
import requests
from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware

# Mount TiTiler's ready-made tile app at /tiles
from titiler.application.main import app as titiler_app

EDL_TOKEN = "eyJ0eXAiOiJKV1QiLCJvcmlnaW4iOiJFYXJ0aGRhdGEgTG9naW4iLCJzaWciOiJlZGxqd3RwdWJrZXlfb3BzIiwiYWxnIjoiUlMyNTYifQ.eyJ0eXBlIjoiVXNlciIsInVpZCI6Im1paW5naXNhYWMiLCJleHAiOjE3NjMxNjQ3OTksImlhdCI6MTc1NzkwNjI5MCwiaXNzIjoiaHR0cHM6Ly91cnMuZWFydGhkYXRhLm5hc2EuZ292IiwiaWRlbnRpdHlfcHJvdmlkZXIiOiJlZGxfb3BzIiwiYWNyIjoiZWRsIiwiYXNzdXJhbmNlX2xldmVsIjozfQ.Xd6nHuxKj9QsTEN8keZ8xaA_NvHRvEjXcKM-90v7R_-EzxXVtY11k65KlBbR3lHgqEYIPfrZ4gc2ni6Y2qhsaj9ZwYsl76U5i8mv_WfvvTVjtTpbFkfnCVwp45FbNSdRqV7beecalF8wX8mpqvq2o-_J5ZdawDZ3rC1jdiiCU8mgH-8Fu26xAT0GnkpwXiSfSZ7Ql3TcG-XU_YOIkmKvI6e05y15v2FicOdTIRSvoBC-3LEIFVTUC6AXT-VseUdoHPE4xkLSGdiazof1gKiacO7rA6v60cEudxVpnW_HByKKZgf_MvF8fizRFHn6ONfxM98_S_ASJ416R9QRYNW7kw"

app = FastAPI(title="Local AQ Server (TEMPO + Harmony + Tiles)")

# Allow your local web app to call this server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # lock down to http://localhost:3000 if you prefer
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"ok": True, "service": "Local AQ Server", "endpoints": ["/health", "/tempo/latest", "/tempo/cog", "/tiles/..."]}

@app.get("/health")
def health():
    return {"status": "ok"}

# ---------- 1) Find latest TEMPO granule (CMR) ----------
@app.get("/tempo/latest")
def tempo_latest(
    short_name: str = Query("TEMPO_NO2_L3", description="TEMPO collection short_name"),
    hours: int = Query(48, ge=1, le=168, description="Look-back window in hours"),
    bbox: str = Query("-125,24,-66,50", description="minLon,minLat,maxLon,maxLat"),
):
    """
    Returns the most recent *data granule* link (NetCDF) within bbox & time window.
    Prefers .nc/.nc4 links and ignores thumbnails/browse images.
    """
    now = datetime.datetime.utcnow()
    start = now - datetime.timedelta(hours=hours)
    temporal = f"{start.isoformat()}Z,{now.isoformat()}Z"

    cmr = "https://cmr.earthdata.nasa.gov/search/granules.json"
    url = (
        f"{cmr}?short_name={urllib.parse.quote(short_name)}"
        f"&temporal={urllib.parse.quote(temporal)}"
        f"&bounding_box={urllib.parse.quote(bbox)}"
        f"&sort_key=-start_date&page_size=10"   # scan a few recent granules
    )

    r = requests.get(url, headers={"Accept": "application/json"}, timeout=60)
    if not r.ok:
        return JSONResponse({"error": "CMR query failed", "detail": r.text}, status_code=502)

    data = r.json()
    entries = data.get("feed", {}).get("entry") or []
    if not entries:
        return JSONResponse({"error": "No recent TEMPO granules"}, status_code=404)

    def is_image_link(link: dict) -> bool:
        ctype = (link.get("type") or "").lower()
        rel = (link.get("rel") or "").lower()
        title = (link.get("title") or "").lower()
        return ctype.startswith("image/") or "browse" in rel or "thumbnail" in title

    def pick_data_link(entry: dict) -> str | None:
        links = entry.get("links", []) or []
        # 1) Prefer explicit data files
        for l in links:
            href = (l.get("href") or "").strip()
            if href and not is_image_link(l) and href.lower().endswith((".nc", ".nc4", ".h5", ".he5")):
                return href
        # 2) Fallback: any non-image, non-metadata HTTP link
        for l in links:
            href = (l.get("href") or "").strip()
            rel = (l.get("rel") or "").lower()
            if href.startswith("http") and not is_image_link(l) and "metadata" not in rel:
                return href
        # 3) Last resort: derive from thumbnail path (thumb-<name>.nc.png -> <name>.nc)
        thumb = next((l.get("href") for l in links if (l.get("href") or "").lower().endswith(".png")), None)
        if thumb and "/thumb-" in thumb:
            base = thumb.replace("/thumb-", "/")
            if base.lower().endswith(".nc.png") or base.lower().endswith(".nc4.png"):
                return base[:-4]  # drop trailing ".png"
        return None

    chosen, data_href = None, None
    for e in entries:
        data_href = pick_data_link(e)
        if data_href:
            chosen = e
            break

    if not chosen or not data_href:
        return JSONResponse({"error": "No data link on recent granules", "first_entry": entries[0]}, status_code=502)

    return {
        "granuleId": chosen.get("id"),
        "title": chosen.get("title"),
        "href": data_href,                 # <-- real data file (e.g., .nc or .nc4)
        "time_start": chosen.get("time_start"),
        "updated": chosen.get("updated"),
        "bbox": bbox,
    }


# ---------- 2) Ask Harmony to subset/reproject to COG ----------
@app.get("/tempo/cog")
def tempo_cog(
    granule_href: str | None = Query(None, description="Data link (.nc/.nc4) from /tempo/latest (optional if granule_id provided)"),
    granule_id: str | None = Query(None, description="CMR granule concept-id (e.g., G3731939905-LARC_CLOUD)"),
    bbox: str = Query("-125,24,-66,50", description="minLon,minLat,maxLon,maxLat"),
    crs: str = Query("EPSG:3857", description="Output CRS for web maps"),
):
    """
    Submits a Harmony job and polls until success, then returns a COG URL.
    Uses granule_id if provided; otherwise resolves granule_id from the href via CMR.
    """
    if not EDL_TOKEN:
        return JSONResponse({"error": "EDL_TOKEN not set in environment"}, status_code=500)

    HARMONY_BASE = "https://harmony.earthdata.nasa.gov"
    # TEMPO gridded NO2 L3 V03 (update if you target V04 instead)
    TEMPO_NO2_L3_CONCEPT_ID = "C2930763263-LARC_CLOUD"

    # 1) Ensure we have a granule_id. If only href is given, resolve via CMR.
    if not granule_id:
        if not granule_href:
            return JSONResponse({"error": "Provide either granule_id or granule_href"}, status_code=400)
        # Extract filename from href, e.g. TEMPO_NO2_L3_V04_20250917T114232Z_S002.nc
        fname = os.path.basename(urllib.parse.urlparse(granule_href).path)
        if not fname:
            return JSONResponse({"error": "Could not parse filename from granule_href"}, status_code=400)

        # Infer version from filename (e.g., V03 / V04) to narrow search
        version = None
        try:
            # split on '_', find token like 'V03'
            for tok in fname.split("_"):
                if len(tok) == 3 and tok[0] == "V" and tok[1:].isdigit():
                    version = tok[1:]
                    break
        except Exception:
            pass

        # Query CMR by short_name + (version) + readable granule name
        params = {
            "short_name": "TEMPO_NO2_L3",
            "readable_granule_name": fname,
            "page_size": 1
        }
        if version:
            params["version"] = version

        cmr_url = "https://cmr.earthdata.nasa.gov/search/granules.json"
        resp = requests.get(cmr_url, params=params, headers={"Accept": "application/json"}, timeout=60)
        if not resp.ok:
            return JSONResponse({"error": "CMR lookup failed", "detail": resp.text}, status_code=502)
        entries = (resp.json().get("feed", {}).get("entry")) or []
        if not entries:
            return JSONResponse({"error": "CMR could not resolve granule_id from href", "filename": fname}, status_code=404)
        granule_id = entries[0].get("id")

    # 2) Build Harmony payload using the collection concept_id + granuleIds
    bbox_list = [float(x) for x in bbox.split(",")]
    payload = {
        "sources": [
            {
                "collection": TEMPO_NO2_L3_CONCEPT_ID,
                "granuleIds": [granule_id],
            }
        ],
        "spatial": {"bbox": bbox_list},
        "crs": crs,
        "format": "image/tiff; application=geotiff; profile=cloud-optimized",
    }

    submit = requests.post(
        f"{HARMONY_BASE}/jobs",
        headers={
            "Authorization": f"Bearer {EDL_TOKEN}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=120,
    )
    if not submit.ok:
        return JSONResponse({"error": "Harmony submit failed", "detail": submit.text}, status_code=502)

    job = submit.json()
    job_id = job.get("jobID")
    if not job_id:
        return JSONResponse({"error": "Harmony did not return jobID", "detail": job}, status_code=502)

    # 3) Poll for completion
    status = "running"
    detail = {}
    for _ in range(60):
        poll = requests.get(
            f"{HARMONY_BASE}/jobs/{job_id}",
            headers={"Authorization": f"Bearer {EDL_TOKEN}"},
            timeout=60,
        )
        if not poll.ok:
            time.sleep(5)
            continue
        detail = poll.json()
        status = detail.get("status", "unknown")
        if status == "successful":
            break
        if status in ("failed", "canceled"):
            return JSONResponse({"error": "Harmony job failed", "detail": detail}, status_code=502)
        time.sleep(5)

    if status != "successful":
        return JSONResponse({"error": "Harmony timeout", "detail": detail}, status_code=504)

    # 4) Extract first COG link
    links = detail.get("links", []) or []
    cog = next((l.get("href") for l in links if (l.get("href") or "").lower().endswith((".tif", ".tiff"))), None)
    if not cog:
        return JSONResponse({"error": "No COG in Harmony output", "detail": detail}, status_code=502)

    return {"cogUrl": cog, "jobID": job_id, "bbox": bbox, "crs": crs}


# ---------- 3) Mount TiTiler under /tiles ----------
# TiTiler exposes routes like:
#   /tiles/cog/info
#   /tiles/cog/tiles/{z}/{x}/{y}.png?url=<ENCODED_COG_URL>&rescale=MIN,MAX&colormap=viridis
#   /tiles/cog/preview.png?url=<ENCODED_COG_URL>&rescale=MIN,MAX&colormap=viridis
app.mount("/tiles", titiler_app)
