// src/features/routing/SummaryPanel.tsx

interface SummaryPanelProps {
  comparison: any;
  coolRouteInfo: any;
}

export default function SummaryPanel({ comparison, coolRouteInfo }: SummaryPanelProps) {
  if (!comparison) return null;

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 grid grid-cols-3 gap-4 mb-4">
      <div className="p-3 bg-green-50 rounded-lg border border-green-100">
        <p className="text-sm text-green-700 font-medium">Shade Improvement</p>
        <p className="text-2xl font-bold text-green-800">+{comparison.shade_improvement_pct}%</p>
      </div>
      
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-sm text-blue-700 font-medium">Total Distance</p>
        <p className="text-2xl font-bold text-blue-800">
          {(coolRouteInfo?.total_length_m / 1000).toFixed(2)} km
        </p>
      </div>

      <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
        <p className="text-sm text-orange-700 font-medium">Extra Walk Added</p>
        <p className="text-2xl font-bold text-orange-800">
          +{comparison.extra_distance_m} m
        </p>
        <p className="text-xs text-orange-600">({comparison.extra_distance_pct}% longer)</p>
      </div>
    </div>
  );
}