"""
HeatSafe Navigator — Routing API
FastAPI endpoint wrapping the ThermalRouteOptimizer.

Run:
    uvicorn app:app --reload --port 8001
"""

import os, json, math, time, logging
from pathlib import Path
from datetime import datetime
from typing import Optional, List
from contextlib import asynccontextmanager

import numpy as np
import joblib
import requests
import osmnx as ox
import networkx as nx
import geopandas as gpd
from shapely.geometry import Point, mapping, LineString
import pvlib
from pvlib import location as pvloc
import pandas as pd

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("heatsafe.routing.api")

BASE_DIR     = Path(__file__).parent.parent
SHADE_DIR    = BASE_DIR.parent / "shade_model" / "artifacts"

CITY     = os.getenv("HEATSAFE_CITY",  "Dehradun, Uttarakhand, India")
LAT      = float(os.getenv("HEATSAFE_LAT",  "30.3165"))
LON      = float(os.getenv("HEATSAFE_LON",  "78.0322"))
TIMEZONE = os.getenv("HEATSAFE_TZ",   "Asia/Kolkata")
CRS      = "EPSG:32644"

W_DIST = 1.0
W_HEAT = 20.0
W_TIME = 5.0

APP_STATE = {}

def load_shade_model():
    model    = joblib.load(SHADE_DIR / "shade_model.joblib")
    scaler   = joblib.load(SHADE_DIR / "scaler.joblib")
    encoders = joblib.load(SHADE_DIR / "label_encoders.joblib")
    with open(SHADE_DIR / "model_metadata.json") as f:
        meta = json.load(f)
    return {"model": model, "scaler": scaler, "encoders": encoders,
            "features": meta["features"], "highway_proxy": meta["highway_width_proxy"],
            "surface_factor": meta["surface_shade_factor"],
            "highway_classes": meta["highway_classes"],
            "surface_classes": meta["surface_classes"]}

def get_solar(lat, lon, hour=None):
    site = pvloc.Location(lat, lon, tz=TIMEZONE, altitude=700)
    if hour is None:
        hour = datetime.now().hour
    dt = pd.Timestamp(f"{datetime.now().strftime('%Y-%m-%d')} {hour:02d}:00:00", tz=TIMEZONE)
    sp = site.get_solarposition(pd.DatetimeIndex([dt]))
    elev = float(sp["elevation"].iloc[0])
    return {"elevation_deg": elev, "azimuth_deg": float(sp["azimuth"].iloc[0]),
            "heat_penalty": max(0.0, math.sin(math.radians(max(elev, 0)))) ** 0.5,
            "hour": hour}

def score_edge(data, geom, art, solar):
    def safe_first(v): return v[0] if isinstance(v, list) else v
    hw   = safe_first(data.get("highway", "unclassified"))
    sf   = safe_first(data.get("surface",  "asphalt"))
    length = float(data.get("length", 50))
    hw   = hw if hw in art["highway_proxy"] else "unclassified"
    sf   = sf if sf in art["surface_factor"] else "asphalt"
    w    = art["highway_proxy"].get(hw, 5.0)
    sfac = art["surface_factor"].get(sf, 0.1)
    le_hw = art["encoders"]["highway"]
    le_sf = art["encoders"]["surface"]
    hw_safe = hw if hw in art["highway_classes"] else art["highway_classes"][0]
    sf_safe = sf if sf in art["surface_classes"] else art["surface_classes"][0]
    hw_enc = int(le_hw.transform([hw_safe])[0])
    sf_enc = int(le_sf.transform([sf_safe])[0])
    elev = solar["elevation_deg"]
    az   = solar["azimuth_deg"]
    orient = 90.0
    if geom and len(list(geom.coords)) >= 2:
        coords = list(geom.coords)
        dx, dy = coords[-1][0]-coords[0][0], coords[-1][1]-coords[0][1]
        orient = math.degrees(math.atan2(dx, dy)) % 180
    shadow = 0.0
    if elev > 0:
        sl = 6.0 / math.tan(math.radians(elev))
        of = abs(math.sin(math.radians(az) - math.radians(orient)))
        shadow = min(sl * of, 50) / (w/2 + min(sl * of, 50) + 1e-6)
    fmap = {
        "road_width": w, "road_orientation_deg": orient, "is_oneway": int(bool(data.get("oneway", False))),
        "highway_enc": hw_enc, "surface_enc": sf_enc, "surface_factor": sfac,
        "building_height_mean": 6.0, "shadow_mean": shadow, "shadow_peak": shadow,
        "shadow_min": shadow*0.5, "shadow_noon": shadow,
        "sun_elevation_noon": max(elev, 0),
        "length_m_log": math.log1p(length), "tree_count_log": 0.0,
        "tree_density_log": 0.0, "building_count_log": 0.0,
    }
    row = np.array([fmap.get(f, 0.0) for f in art["features"]]).reshape(1, -1)
    row_s = art["scaler"].transform(row)
    return float(min(max(art["model"].predict(row_s)[0], 0.0), 1.0))

def thermal_cost(length, shade, solar_pen):
    base_cost = length * W_DIST
    heat_exposure = 1.0 - shade
    time_penalty  = heat_exposure * solar_pen
    penalty_multiplier = (W_HEAT * heat_exposure) + (W_TIME * time_penalty)
    total_cost = base_cost + (length * penalty_multiplier)
    return round(total_cost, 6)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("⏳ Loading shade model...")
    art = load_shade_model()
    APP_STATE["artifacts"] = art

    logger.info(f"⏳ Downloading street network: {CITY}")
    G_raw = ox.graph_from_place(CITY, network_type="walk", simplify=True)
    G = ox.project_graph(G_raw, to_crs=CRS)

    logger.info("⏳ Pre-scoring all edges for 24 hours (this may take a minute)...")
    # THE FIX: Calculate sun positions for all 24 hours
    solar_profiles = {h: get_solar(LAT, LON, h) for h in range(24)}

    for u, v, k, data in G.edges(data=True, keys=True):
        geom = data.get("geometry", None)
        
        # THE FIX: Create a dictionary of 24 sticky notes for this street
        shade_hourly = {}
        for h in range(24):
            shade = score_edge(data, geom, art, solar_profiles[h])
            shade_hourly[h] = round(shade, 4)
            
        G[u][v][k]["shade_hourly"] = shade_hourly
        G[u][v][k]["length"] = float(data.get("length", 50))

    APP_STATE["G"] = G
    logger.info(f"✅ Ready — {G.number_of_edges():,} edges scored for 24 hours")
    yield
    APP_STATE.clear()

app = FastAPI(title="HeatSafe Navigator — Routing API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class RouteRequest(BaseModel):
    origin_name:     Optional[str] = Field(None, example="clock tower")
    dest_name:       Optional[str] = Field(None, example="parade ground")
    origin_lat:      Optional[float] = Field(None, example=30.3248)
    origin_lon:      Optional[float] = Field(None, example=78.0435)
    dest_lat:        Optional[float] = Field(None, example=30.3159)
    dest_lon:        Optional[float] = Field(None, example=78.0324)
    hour:            Optional[int] = Field(None, ge=0, le=23)
    include_geojson: bool = Field(True)

class BatchRouteRequest(BaseModel):
    routes: List[RouteRequest]

@app.get("/health")
def health():
    G = APP_STATE.get("G")
    return {"status": "ok", "city": CITY}

def _geocode(name: str) -> tuple:
    import requests as _req
    url = "https://nominatim.openstreetmap.org/search"
    params = {"q": f"{name}, Dehradun, Uttarakhand, India", "format": "json", "limit": 1, "countrycodes": "in", "viewbox": "77.85,30.15,78.25,30.55", "bounded": 1}
    r = _req.get(url, params=params, headers={"User-Agent": "HeatSafeNavigator/1.0"}, timeout=8)
    d = r.json()
    if d: return float(d[0]["lat"]), float(d[0]["lon"])
    raise HTTPException(400, f"Cannot geocode '{name}'")

@app.post("/route")
def find_route(req: RouteRequest):
    G   = APP_STATE.get("G")
    if G is None: raise HTTPException(503, "Graph not loaded yet")

    try:
        solar = get_solar(LAT, LON, req.hour)
        request_hour = solar["hour"] # THE FIX: Store the requested hour

        if req.origin_name: o_lat, o_lon = _geocode(req.origin_name)
        elif req.origin_lat is not None and req.origin_lon is not None: o_lat, o_lon = req.origin_lat, req.origin_lon
        else: raise HTTPException(400, "Provide origin")

        if req.dest_name: d_lat, d_lon = _geocode(req.dest_name)
        elif req.dest_lat is not None and req.dest_lon is not None: d_lat, d_lon = req.dest_lat, req.dest_lon
        else: raise HTTPException(400, "Provide dest")

        orig_gdf = gpd.GeoDataFrame(geometry=[Point(o_lon, o_lat)], crs="EPSG:4326").to_crs(CRS)
        dest_gdf = gpd.GeoDataFrame(geometry=[Point(d_lon, d_lat)], crs="EPSG:4326").to_crs(CRS)
        orig = ox.distance.nearest_nodes(G, X=orig_gdf.geometry.iloc[0].x, Y=orig_gdf.geometry.iloc[0].y)
        dest = ox.distance.nearest_nodes(G, X=dest_gdf.geometry.iloc[0].x, Y=dest_gdf.geometry.iloc[0].y)

        def dynamic_thermal_weight(u, v, edge_data):
            min_cost = float('inf')
            for k, d in edge_data.items():
                # THE FIX: Get the shade for THIS SPECIFIC HOUR
                shade = float(d.get("shade_hourly", {}).get(request_hour, 0.15))
                length = float(d.get("length", 50))
                cost = thermal_cost(length, shade, solar["heat_penalty"])
                if cost < min_cost:
                    min_cost = cost
            return min_cost

        cool_nodes  = nx.shortest_path(G, orig, dest, weight=dynamic_thermal_weight, method="dijkstra")
        short_nodes = nx.shortest_path(G, orig, dest, weight="length",       method="dijkstra")

        def summarize_nodes(nodes):
            total_len = 0
            weighted_shades = 0
            feats = []
            for i in range(len(nodes)-1):
                u, v = nodes[i], nodes[i+1]
                
                # THE FIX: Use the specific hour for the summary math
                bk = min(G[u][v], key=lambda k: thermal_cost(
                    float(G[u][v][k].get("length", 50)),
                    float(G[u][v][k].get("shade_hourly", {}).get(request_hour, 0.15)),
                    solar["heat_penalty"]
                ))
                d  = G[u][v][bk]
                seg_len = float(d.get("length", 0))
                shade = float(d.get("shade_hourly", {}).get(request_hour, 0.15))

                total_len += seg_len
                weighted_shades += (shade * seg_len)

                if req.include_geojson:
                    geom = d.get("geometry", None)
                    if geom is None:
                        n1, n2 = G.nodes[u], G.nodes[v]
                        geom = LineString([(n1["x"],n1["y"]),(n2["x"],n2["y"])])
                    g_wgs = gpd.GeoDataFrame(geometry=[geom], crs=CRS).to_crs("EPSG:4326").geometry.iloc[0]
                    from matplotlib import colors as mcolors
                    import matplotlib.pyplot as plt
                    feats.append({"type": "Feature", "geometry": mapping(g_wgs),
                                   "properties": {"shade_score": shade,
                                                  "color": mcolors.to_hex(plt.cm.RdYlGn(shade)),
                                                  "length_m": seg_len}})

            mean_shade = weighted_shades / max(total_len, 1)
            return total_len, mean_shade, feats

        cool_len,  cool_shade,  cool_feats  = summarize_nodes(cool_nodes)
        short_len, short_shade, short_feats = summarize_nodes(short_nodes)

        resp = {
            "cool_route": {
                "total_length_m":   round(cool_len, 1),
                "mean_shade_score": round(cool_shade, 4),
                "heat_exposure_pct": round((1-cool_shade)*100, 1),
                "n_segments":       len(cool_nodes)-1,
            },
            "shortest_route": {
                "total_length_m":   round(short_len, 1),
                "mean_shade_score": round(short_shade, 4),
            },
            "comparison": {
                "shade_improvement_pct": round(((cool_shade-short_shade)/max(short_shade,0.01))*100, 1),
                "extra_distance_m":      round(cool_len - short_len, 1),
                "extra_distance_pct":    round(((cool_len-short_len)/max(short_len,1))*100, 1),
            },
            "solar_elevation_deg": solar["elevation_deg"],
            "computed_at":         datetime.now().isoformat(),
        }
        if req.include_geojson:
            resp["geojson_cool_route"]  = {"type": "FeatureCollection", "features": cool_feats}
            resp["geojson_short_route"] = {"type": "FeatureCollection", "features": short_feats}
        return resp

    except nx.NetworkXNoPath:
        raise HTTPException(400, "No path found. Try different coordinates within the city.")
    except Exception as e:
        logger.error(f"Route error: {e}")
        raise HTTPException(500, str(e))