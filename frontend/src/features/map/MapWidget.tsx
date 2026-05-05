import React, { useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface MapWidgetProps {
  coolRoute: any;
  shortRoute: any;
  shelters?: any;
}

// Helper component to auto-zoom the map to fit the routes
const MapBounds = ({ route1, route2 }: { route1: any, route2: any }) => {
  const map = useMap();
  useEffect(() => {
    if (route1 || route2) {
      import('leaflet').then((L) => {
        const bounds = L.geoJSON(route1 || route2).getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      });
    }
  }, [route1, route2, map]);
  return null;
};

export default function MapWidget({ coolRoute, shortRoute, shelters }: MapWidgetProps) {
  // If no routes are loaded, show a static dark map of Dehradun
  if (!coolRoute && !shortRoute) {
    return (
      <MapContainer center={[30.3165, 78.0322]} zoom={13} className="w-full h-full" zoomControl={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; CARTO'
        />
      </MapContainer>
    );
  }

  return (
    <MapContainer center={[30.3165, 78.0322]} zoom={13} className="w-full h-full z-0" zoomControl={false}>
      {/* 1. Dark Theme Base Map */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; CARTO'
      />

      <MapBounds route1={coolRoute} route2={shortRoute} />

      {/* 2. LAYER 1 (BOTTOM): The Shortest Route */}
      {/* We make this line THICKER (weight 8) so it peeks out if the lines overlap */}
      {shortRoute && (
        <GeoJSON
          key={`short-${Date.now()}`}
          data={shortRoute}
          style={{
            color: '#06b6d4', // Cyan 500
            weight: 8,        // Thicker than the cool route
            opacity: 0.5,     // Slightly transparent
            dashArray: '10, 15', // Dashed line
            lineCap: 'round'
          }}
        />
      )}

      {/* 3. LAYER 2 (TOP): The Cool Route */}
      {/* We make this line THINNER (weight 5) so it sits inside the dashed line when overlapping */}
      {coolRoute && (
        <GeoJSON
          key={`cool-${Date.now()}`}
          data={coolRoute}
          style={(feature: any) => ({
            // If the backend sent a color based on shade, use it. Otherwise, default to Emerald.
            color: feature?.properties?.color || '#10b981', 
            weight: 5,        // Thinner than the short route
            opacity: 1,       // Solid
            lineCap: 'round'
          })}
        />
      )}

      {/* 4. LAYER 3 (TOPMOST): Shelters */}
      {shelters && (
        <GeoJSON
          key={`shelters-${Date.now()}`}
          data={shelters}
          pointToLayer={(_, latlng) => {
            // Requires standard Leaflet to draw circle markers
            const L = window.L; 
            return L.circleMarker(latlng, {
              radius: 6,
              fillColor: '#a855f7', // Purple 500
              color: '#18181b',     // Dark border
              weight: 2,
              fillOpacity: 1
            });
          }}
        />
      )}
    </MapContainer>
  );
}