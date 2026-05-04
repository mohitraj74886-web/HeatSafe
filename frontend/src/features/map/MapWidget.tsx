// src/features/map/MapWidget.tsx
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapWidgetProps {
  coolRoute: any;
  shortRoute: any;
  shelters: any;
}

export default function MapWidget({ coolRoute, shortRoute, shelters }: MapWidgetProps) {
  const defaultCenter: [number, number] = [30.3165, 78.0322]; 

  // Frontend Instruction #2: Style by shade_score
  const getShadeColor = (score: number) => {
    if (score > 0.75) return '#1a9850'; // Green
    if (score >= 0.5) return '#fdae61'; // Yellow
    return '#d73027'; // Red
  };

  return (
    <div className="w-full h-[500px] border-2 border-gray-200 rounded-lg overflow-hidden shadow-md relative z-0">
      <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Frontend Instruction #4: Shortest route as blue dashed overlay */}
        {shortRoute && (
          <GeoJSON 
            key={`short-${JSON.stringify(shortRoute)}`}
            data={shortRoute} 
            style={{
              color: '#3b82f6', // Blue
              weight: 4,
              dashArray: '5, 10', // Creates the dashed effect
              opacity: 0.7
            }}
          />
        )}

        {/* Frontend Instruction #1 & #2: Cool route styled by shade score */}
        {coolRoute && (
          <GeoJSON 
            key={`cool-${JSON.stringify(coolRoute)}`}
            data={coolRoute} 
            style={(feature) => ({
              // Use backend color if provided, otherwise calculate based on score
              color: feature?.properties.color || getShadeColor(feature?.properties.shade_score || 0),
              weight: 6,
              opacity: 0.9
            })}
            onEachFeature={(feature, layer) => {
              if (feature.properties) {
                layer.bindPopup(`Shade Score: ${feature.properties.shade_score?.toFixed(2)}`);
              }
            }}
          />
        )}

        {/* Frontend Instruction #3: Shelters as point markers */}
        {shelters && (
          <GeoJSON 
            key={`shelters-${JSON.stringify(shelters)}`}
            data={shelters} 
            pointToLayer={(_, latlng) => {
              // Creates a clean circle marker instead of needing an image file
              return L.circleMarker(latlng, {
                radius: 6,
                fillColor: "#8b5cf6", // Purple shelters
                color: "#fff",
                weight: 2,
                opacity: 1,
                fillOpacity: 0.9
              }).bindPopup("Safe Shelter / Cooling Station");
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}