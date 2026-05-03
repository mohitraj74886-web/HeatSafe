// src/types/geojson.d.ts

export interface RouteProperties {
  color: string;
  distance_km?: number;
  shade_score?: number;
}

export interface RouteFeature {
  type: "Feature";
  properties: RouteProperties;
  geometry: {
    type: "LineString";
    coordinates: number[][]; // Array of [longitude, latitude] arrays
  };
}

export interface RouteResponse {
  geojson_cool_route: {
    type: "FeatureCollection";
    features: RouteFeature[];
  };
  comparison?: {
    standard_route: any;
    cool_route: any;
  };
}