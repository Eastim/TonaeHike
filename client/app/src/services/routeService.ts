import type { Coordinates, RouteInfo, RouteType, Spot, SpotRouteGroup } from '../types'

const unsupportedRoutes: RouteType[] = ['railway', 'flight']

const iconMap: Record<RouteType, string> = {
  walking: 'footprints',
  transit: 'bus',
  driving: 'car',
  railway: 'train',
  flight: 'plane',
}

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

function calculateDistanceMeters(origin: Coordinates, destination: Coordinates) {
  const earthRadius = 6371000
  const dLat = toRadians(destination.lat - origin.lat)
  const dLng = toRadians(destination.lng - origin.lng)
  const lat1 = toRadians(origin.lat)
  const lat2 = toRadians(destination.lat)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadius * c
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) {
    return '--'
  }

  if (seconds < 3600) {
    return `${Math.max(1, Math.ceil(seconds / 60))}分钟`
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.ceil((seconds % 3600) / 60)
  return minutes > 0 ? `${hours}小时${minutes}分` : `${hours}小时`
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}米`
  }

  return `${(meters / 1000).toFixed(1)}公里`
}

function createRoute(type: RouteType, distanceMeters: number, speedMetersPerSecond: number, multiplier = 1): RouteInfo {
  const adjustedDistance = distanceMeters * multiplier
  const durationSeconds = adjustedDistance / speedMetersPerSecond

  return {
    type,
    duration: formatDuration(durationSeconds),
    durationSeconds,
    distance: formatDistance(adjustedDistance),
    available: true,
    icon: iconMap[type],
  }
}

function emptyRoute(type: RouteType): RouteInfo {
  return {
    type,
    duration: '--',
    durationSeconds: 0,
    distance: '--',
    available: false,
    icon: iconMap[type],
  }
}

class RouteService {
  async getAllRoutes(origin: Coordinates, destination: Coordinates): Promise<RouteInfo[]> {
    const distanceMeters = calculateDistanceMeters(origin, destination)

    return [
      createRoute('walking', distanceMeters, 1.15, 1.08),
      createRoute('transit', distanceMeters, 6.5, 1.28),
      createRoute('driving', distanceMeters, 11.5, 1.18),
      ...unsupportedRoutes.map((type) => emptyRoute(type)),
    ]
  }

  async buildRouteGroups(spots: Spot[]): Promise<SpotRouteGroup[]> {
    if (spots.length < 2) {
      return []
    }

    return Promise.all(
      spots.slice(0, -1).map(async (spot, index) => {
        const nextSpot = spots[index + 1]
        const routes = await this.getAllRoutes(
          { lng: spot.lng, lat: spot.lat },
          { lng: nextSpot.lng, lat: nextSpot.lat },
        )

        return {
          fromSpotId: spot.id,
          toSpotId: nextSpot.id,
          routes,
        }
      }),
    )
  }
}

export const routeService = new RouteService()
