// src/services/routeApi.ts
import type { RouteResponse } from '../types/geojson';

const API_URL = import.meta.env.VITE_MAP_API;

export const fetchCoolRoute = async (
  origin: string, 
  destination: string, 
  hour: number
): Promise<RouteResponse | null> => {
  try {
    const response = await fetch(`${API_URL}/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ 
        origin_name: origin,       // Changed to match backend exactly
        dest_name: destination,    // Changed to match backend exactly
        hour: hour,
        include_geojson: true 
      }),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch route:", error);
    return null;
  }
};