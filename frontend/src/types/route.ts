// src/types/route.ts

export interface RouteSummaryData {
  comparison: {
    shade_improvement_pct: number;
    extra_distance_m: number;
    extra_distance_pct: number;
  };
  cool_route: {
    total_length_m: number;
    mean_shade_score: number;
    heat_exposure_pct: number;
    n_segments: number;
  };
}

export interface RouteState {
  coolRoute: any | null;
  shortRoute: any | null;
  shelters: any | null;
  summaryData: RouteSummaryData | null;
}