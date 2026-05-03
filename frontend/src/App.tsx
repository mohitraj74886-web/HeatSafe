// src/App.tsx
import { useState } from 'react';
import MapWidget from './features/map/MapWidget';
import { fetchCoolRoute } from './services/routeApi';

export default function App() {
  const [originLat, setOriginLat] = useState('30.3248');
  const [originLon, setOriginLon] = useState('78.0435');
  const [destLat, setDestLat] = useState('30.3159');
  const [destLon, setDestLon] = useState('78.0324');
  const [hour, setHour] = useState('14'); // Default to 2 PM
  
  const [routeData, setRouteData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Pass the hour into the API call
    const result = await fetchCoolRoute(
      parseFloat(originLat), 
      parseFloat(originLon), 
      parseFloat(destLat), 
      parseFloat(destLon),
      parseInt(hour)
    );
    
    if (result && result.geojson_cool_route) {
      setRouteData(result.geojson_cool_route);
    } else {
      alert("Failed to find a route. Check backend console!");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <header>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">HeatSafe Navigator</h1>
          <p className="text-gray-600 mt-2">Find the coolest, safest route for outdoor workers.</p>
        </header>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700">Origin Lat</label>
                <input type="number" step="any" value={originLat} onChange={(e) => setOriginLat(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700">Origin Lon</label>
                <input type="number" step="any" value={originLon} onChange={(e) => setOriginLon(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700">Dest Lat</label>
                <input type="number" step="any" value={destLat} onChange={(e) => setDestLat(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700">Dest Lon</label>
                <input type="number" step="any" value={destLon} onChange={(e) => setDestLon(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
              </div>
              
              
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 text-blue-600">Time (0-23h)</label>
                <input 
                  type="number" min="0" max="23" 
                  value={hour} onChange={(e) => setHour(e.target.value)} 
                  className="w-full px-3 py-2 border-2 border-blue-200 rounded-md bg-blue-50" 
                />
              </div>
            </div>
            
            <button 
              type="submit" disabled={loading}
              className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:bg-blue-300"
            >
              {loading ? 'Routing...' : 'Find Safe Route'}
            </button>
          </form>
        </div>

        <MapWidget routeData={routeData} />
      </div>
    </div>
  );
}