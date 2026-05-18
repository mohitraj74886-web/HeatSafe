// src/types/geojson.d.ts

export interface RouteFeature {
  type: "Feature";
  properties: {
    shade_score?: number;
    color?: string;
    distance_m?: number;
    [key: string]: any;
  };
  geometry: any;
}

export interface RouteResponse {
  shelters: { type: "FeatureCollection"; features: any[]; } | undefined;
  geojson_cool_route: { type: "FeatureCollection"; features: RouteFeature[] };
  geojson_short_route?: { type: "FeatureCollection"; features: RouteFeature[] };
  geojson_shelters?: { type: "FeatureCollection"; features: any[] };
  comparison?: {
    shade_improvement_pct: number;
    extra_distance_m: number;
    extra_distance_pct: number;
  };
  cool_route?: {
  total_length_m: number;
  mean_shade_score: number;
  heat_exposure_pct: number;
  n_segments: number;
};
}