// src/App.tsx
import React, { useState } from 'react';
import CommandCenter from './features/routing/CommandCenter';
import MapSection from './features/map/MapSection';
import AnalyticsPanel from './features/routing/AnalyticsPanel';
import { fetchCoolRoute } from './services/routeApi';
import type { RouteState } from './types/route';

export default function App() {
  const [origin, setOrigin] = useState('Clock Tower, Dehradun');
  const [destination, setDestination] = useState('ISBT Dehradun');
  const [hour, setHour] = useState<string>('14');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [routeState, setRouteState] = useState<RouteState>({
    coolRoute: null,
    shortRoute: null,
    shelters: null,
    summaryData: null
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchCoolRoute(origin, destination, parseInt(hour));
      
      if (result) {
        setRouteState({
          coolRoute: result.geojson_cool_route,
          shortRoute: result.geojson_short_route,
          shelters: result.geojson_shelters || result.shelters,
          summaryData: {
            comparison: result.comparison,
            cool_route: result.cool_route
          }
        });
      } else {
        setError("Failed to find a route. Check backend console!");
      }
    } catch (err) {
      setError("Grid connectivity failure. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 font-sans overflow-hidden selection:bg-emerald-500/30">
      
      <CommandCenter 
        origin={origin} setOrigin={setOrigin}
        destination={destination} setDestination={setDestination}
        hour={hour} setHour={setHour}
        loading={loading} error={error}
        onSearch={handleSearch}
      />

      <MapSection 
        coolRoute={routeState.coolRoute}
        shortRoute={routeState.shortRoute}
        shelters={routeState.shelters}
        loading={loading}
      />

      <AnalyticsPanel 
        summaryData={routeState.summaryData}
        loading={loading}
      />

    </div>
  );
}