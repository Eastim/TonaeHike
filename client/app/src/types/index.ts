export interface Coordinates {
  lng: number;
  lat: number;
}

export type RouteType = 'driving' | 'transit' | 'walking' | 'flight' | 'railway';

export interface RouteInfo {
  type: RouteType;
  duration: string;
  durationSeconds: number;
  distance: string;
  available: boolean;
  icon: string;
}

export interface Spot {
  id: string;
  name: string;
  address: string;
  lng: number;
  lat: number;
  dayIndex: number;
  order: number;
  image?: string;
  tags?: string[];
}

export interface SearchResultItem {
  id: string;
  name: string;
  address: string;
  lng: number;
  lat: number;
  city?: string;
  province?: string;
}

export interface SpotRouteGroup {
  fromSpotId: string;
  toSpotId: string;
  routes: RouteInfo[];
}

export interface TripDay {
  index: number;
  label: string;
  date?: string;
  spots: Spot[];
  routeGroups: SpotRouteGroup[];
  routesLoading?: boolean;
}

export interface TripPlan {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  published?: boolean;
  synced?: boolean;
  days: TripDay[];
  createdAt: string;
  updatedAt: string;
}

export interface MapViewport extends Coordinates {
  zoom: number;
}
