// src/App.tsx
import { useState } from 'react';
import MapWidget from './features/map/MapWidget';
import SummaryPanel from './features/routing/SummaryPanel';
import { fetchCoolRoute } from './services/routeApi';

export default function App() {
  const [origin, setOrigin] = useState('Clock Tower, Dehradun');
  const [destination, setDestination] = useState('Dehradun Railway Station');
  const [hour, setHour] = useState('14'); // Default to 2 PM
  
  // Updated state for the new extended backend payload
  const [coolRoute, setCoolRoute] = useState<any>(null);
  const [shortRoute, setShortRoute] = useState<any>(null);
  const [shelters, setShelters] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Pass the text strings and hour into the API call
    const result = await fetchCoolRoute(origin, destination, parseInt(hour));
    
    if (result) {
      // Set the map layers
      setCoolRoute(result.geojson_cool_route);
      setShortRoute(result.geojson_short_route);
      setShelters(result.geojson_shelters || result.shelters); // Failsafe for key name
      
      // Set the dashboard data
      setSummaryData({
        comparison: result.comparison,
        cool_route: result.cool_route
      });
    } else {
      alert("Failed to find a route. Check backend console!");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* HEADER */}
        <header>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">HeatSafe Navigator</h1>
          <p className="text-gray-600 mt-2">Find the coolest, safest route for outdoor workers.</p>
        </header>

        {/* INPUT FORM */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Origin</label>
                <input 
                  type="text" 
                  value={origin} 
                  onChange={(e) => setOrigin(e.target.value)} 
                  placeholder="e.g. Clock Tower, Dehradun"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Destination</label>
                <input 
                  type="text" 
                  value={destination} 
                  onChange={(e) => setDestination(e.target.value)} 
                  placeholder="e.g. ISBT Dehradun"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
              
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 text-blue-600">Time (0-23h)</label>
                <input 
                  type="number" min="0" max="23" 
                  value={hour} 
                  onChange={(e) => setHour(e.target.value)} 
                  className="w-full px-3 py-2 border-2 border-blue-200 rounded-md bg-blue-50 focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
            </div>
            
            <button 
              type="submit" disabled={loading}
              className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:bg-blue-300 transition-colors"
            >
              {loading ? 'Routing...' : 'Find Safe Route'}
            </button>
          </form>
        </div>

        {/* DATA DASHBOARD (Only shows after a successful search) */}
        {summaryData && (
          <SummaryPanel 
            comparison={summaryData.comparison} 
            coolRouteInfo={summaryData.cool_route} 
          />
        )}

        {/* MAP & LEGEND SECTION */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          
          {/* Professional Map Legend */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 text-sm text-gray-700 bg-gray-50 p-3 rounded border">
            <div className="flex items-center gap-4 mb-2 sm:mb-0">
              <span className="flex items-center gap-1">
                <span className="text-xl text-blue-500 font-bold leading-none">- -</span> Shortest Route
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-purple-500 inline-block border border-white ring-1 ring-purple-300"></span> Shelters
              </span>
            </div>

            <div>
              <span className="font-semibold block sm:inline-block mb-1 sm:mb-0 sm:mr-2">Shade Intensity:</span>
              <div className="inline-block align-middle">
                <div style={{ background: 'linear-gradient(to right, #d73027, #fdae61, #1a9850)', width: '150px', height: '12px', borderRadius: '4px' }}></div>
                <div className="flex justify-between w-[150px] text-[10px] text-gray-500 mt-1 font-medium tracking-wide">
                  <span>EXPOSED</span>
                  <span>SHADED</span>
                </div>
              </div>
            </div>
          </div>

          {/* Leaflet Map Widget */}
          <MapWidget 
            coolRoute={coolRoute} 
            shortRoute={shortRoute} 
            shelters={shelters} 
          />
          
        </div>
      </div>
    </div>
  );
}