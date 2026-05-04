"""
HeatSafe Navigator — Routing API
FastAPI endpoint wrapping the ThermalRouteOptimizer.
"""

import os, math, logging, pickle
from pathlib import Path
from datetime import datetime
from typing import Optional, List
from contextlib import asynccontextmanager

import networkx as nx
import geopandas as gpd
from shapely.geometry import Point, mapping, LineString
import pvlib
from pvlib import location as pvloc
import pandas as pd
import osmnx as ox

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("heatsafe.routing.api")

# ─── Config & Paths ───────────────────────────────────────────────────
# __file__ is in routing/api/app.py. 
# .parent is api/
# .parent.parent is routing/
BASE_DIR     = Path(__file__).parent.parent
ARTIFACT_DIR = BASE_DIR / "artifacts"

CITY     = os.getenv("HEATSAFE_CITY",  "Dehradun, Uttarakhand, India")
LAT      = float(os.getenv("HEATSAFE_LAT",  "30.3165"))
LON      = float(os.getenv("HEATSAFE_LON",  "78.0322"))
TIMEZONE = os.getenv("HEATSAFE_TZ",   "Asia/Kolkata")
CRS      = "EPSG:32644"

W_DIST = 1.0
W_HEAT = 120.0
W_TIME = 20

APP_STATE = {}

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

def thermal_cost(length, shade, solar_pen):
    
    base_cost = length * 1.0
    heat_exposure = 1.0 - shade
    
    exponential_heat = heat_exposure ** 3 
    
    # Use massive weights
    W_HEAT_DEMO = 500.0 
    
    penalty_multiplier = (W_HEAT_DEMO * exponential_heat)
    
    # Total cost = base distance + massive penalty for sun
    total_cost = base_cost + (length * penalty_multiplier)
    return round(total_cost, 6)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("⏳ Loading pre-baked graph from artifacts folder...")
    
    graph_path = ARTIFACT_DIR / "baked_graph.pkl"
    if not graph_path.exists():
        logger.error(f"❌ Could not find {graph_path}. Make sure baked_graph.pkl is in the artifacts folder!")
        raise FileNotFoundError(f"Missing {graph_path}")

    with open(graph_path, "rb") as f:
        G = pickle.load(f)

    APP_STATE["G"] = G
    logger.info(f"✅ Ready — Loaded {G.number_of_edges():,} pre-scored edges.")
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
    G = APP_STATE.get("G")
    if G is None: raise HTTPException(503, "Graph not loaded yet")

    try:
        solar = get_solar(LAT, LON, req.hour)
        request_hour = solar["hour"]

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
                # Get the pre-calculated shade score for the requested hour
                # If hour isn't in 8-18 (e.g. night time), default to 0.15
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