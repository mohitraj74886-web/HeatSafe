// src/services/routeApi.ts
import type { RouteResponse } from '../types/geojson';

export const fetchCoolRoute = async (
  originLat: number, 
  originLon: number, 
  destLat: number, 
  destLon: number,
  hour:number,
): Promise<RouteResponse | null> => {
  try {
    const response = await fetch('/api/route', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Sending EXACTLY what the FastAPI backend requested:
      body: JSON.stringify({ 
        origin_lat: originLat,
        origin_lon: originLon,
        dest_lat: destLat,
        dest_lon: destLon,
        hour: hour, // 14 = 2:00 PM (peak heat for a good test!)
        include_geojson: true 
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: RouteResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch route:", error);
    return null;
  }
};