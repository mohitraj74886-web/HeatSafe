// src/features/map/MapWidget.tsx
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // CRITICAL: Leaflet will break without this
import type { RouteFeature } from '../../types/geojson';

interface MapWidgetProps {
  routeData: {
    type: "FeatureCollection";
    features: RouteFeature[];
  } | null;
}

export default function MapWidget({ routeData }: MapWidgetProps) {
  // Default center (Update this to a coordinate relevant to your project)
  const defaultCenter: [number, number] = [28.6139, 77.2090]; // Example: New Delhi

  return (
    <div className="w-full h-[500px] border-2 border-gray-200 rounded-lg overflow-hidden shadow-md">
      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        {/* Free OpenStreetMap Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Render the route if we have data */}
        {routeData && (
          <GeoJSON 
            key={JSON.stringify(routeData)} 
            data={routeData} 
            style={(feature) => ({
              color: feature?.properties.color || '#3b82f6', 
              weight: 6,
              opacity: 0.8
            })}
            // ADD THIS NEW BLOCK:
            onEachFeature={(feature, layer) => {
              if (feature.properties) {
                // This grabs whatever data your friend attached to the street
                const props = feature.properties;
                layer.bindPopup(`
                  <div class="p-2">
                    <p><strong>Color Code:</strong> ${props.color}</p>
                    <p><strong>Heat/Shade Score:</strong> ${props.shade_score || 'Not provided'}</p>
                    <p><strong>Distance:</strong> ${props.distance_km || 'Not provided'} km</p>
                  </div>
                `);
              }
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}