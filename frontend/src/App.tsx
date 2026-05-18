// src/App.tsx
import { useState } from "react";
import { MessageSquareText } from "lucide-react";
import CommandCenter from "./features/routing/CommandCenter";
import MapSection from "./features/map/MapSection";
import AnalyticsPanel from "./features/routing/AnalyticsPanel";
import HeatSafeChatPage from "./features/risk-profile/HeatSafeChatPage";
import HeatSafeLanding from "./features/landing/HeatSafeLanding"; // <-- 1. IMPORT LANDING PAGE
import { fetchCoolRoute } from "./services/routeApi";
import type { RouteState } from "./types/route";

export default function App() {
  // 2. Add 'landing' as the default view
  const [view, setView] = useState<"landing" | "map" | "chat">("landing");

  const [origin, setOrigin] = useState("Clock Tower, Dehradun");
  const [destination, setDestination] = useState("ISBT Dehradun");
  const [hour, setHour] = useState<string>("14");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [routeState, setRouteState] = useState<RouteState>({
    coolRoute: null,
    shortRoute: null,
    shelters: null,
    summaryData: null,
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
            comparison: result.comparison ?? {
              shade_improvement_pct: 0,
              extra_distance_m: 0,
              extra_distance_pct: 0,
            },

            cool_route: result.cool_route ?? {
              total_length_m: 0,
              mean_shade_score: 0,
              heat_exposure_pct: 0,
              n_segments: 0,
            },
          },
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

  // 3. CONDITIONAL RENDERING ARCHITECTURE

  // Show the Landing Page first
  if (view === "landing") {
    return <HeatSafeLanding onLaunch={() => setView("map")} />;
  }

  // Show the Full-Screen Chat if requested
  if (view === "chat") {
    return <HeatSafeChatPage onBack={() => setView("map")} />;
  }

  // Otherwise, show the main Map Dashboard
  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 font-sans overflow-hidden selection:bg-emerald-500/30">
      <CommandCenter
        origin={origin}
        setOrigin={setOrigin}
        destination={destination}
        setDestination={setDestination}
        hour={hour}
        setHour={setHour}
        loading={loading}
        error={error}
        onSearch={handleSearch}
      />

      <MapSection
        coolRoute={routeState.coolRoute}
        shortRoute={routeState.shortRoute}
        shelters={routeState.shelters}
        loading={loading}
      />

      <AnalyticsPanel summaryData={routeState.summaryData} loading={loading} />

      {/* Floating button to open the full-screen AI chat */}
      <button
        onClick={() => setView("chat")}
        className="fixed bottom-8 right-8 z-50 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-full flex items-center gap-2.5 shadow-[0_0_24px_rgba(16,185,129,0.4)] transition-all hover:scale-105 active:scale-95"
      >
        <MessageSquareText className="h-5 w-5" /> Open HeatSafe AI
      </button>
    </div>
  );
}
