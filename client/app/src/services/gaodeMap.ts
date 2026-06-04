import type { Coordinates, RouteInfo, Spot, SpotRouteGroup } from '../types'

const AMAP_KEY = 'ab5e502fd56c175dd12c0243301e6437'
const AMAP_SECURITY_CODE = '3816674cbad37c6ee605c190906ae4ea'
const AMAP_SCRIPT_ID = 'amap-js-api-script'

const formatDuration = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '--'
  }

  const minutes = Math.max(1, Math.round(seconds / 60))
  if (minutes < 60) {
    return `${minutes}分钟`
  }

  const hours = Math.floor(minutes / 60)
  const remainMinutes = minutes % 60
  return remainMinutes > 0 ? `${hours}小时${remainMinutes}分钟` : `${hours}小时`
}

const formatDistance = (meters: number) => {
  if (!Number.isFinite(meters) || meters <= 0) {
    return '--'
  }

  if (meters < 1000) {
    return `${Math.round(meters)} m`
  }

  return `${(meters / 1000).toFixed(1)} km`
}

const createRouteInfo = (
  type: RouteInfo['type'],
  icon: RouteInfo['icon'],
  durationSeconds: number,
  distanceMeters: number,
  available: boolean,
): RouteInfo => ({
  type,
  icon,
  duration: available ? formatDuration(durationSeconds) : '--',
  durationSeconds: available ? Math.round(durationSeconds) : 0,
  distance: available ? formatDistance(distanceMeters) : '--',
  available,
})

const toRadians = (value: number) => (value * Math.PI) / 180

const getStraightDistanceMeters = (from: Coordinates, to: Coordinates) => {
  const earthRadius = 6371000
  const dLat = toRadians(to.lat - from.lat)
  const dLng = toRadians(to.lng - from.lng)
  const lat1 = toRadians(from.lat)
  const lat2 = toRadians(to.lat)

  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadius * c
}

const getCityFromAddress = (address?: string) => {
  if (!address) {
    return ''
  }

  const match = address.match(/(.+?[市州盟地区县区])/)
  return match?.[1] ?? address.slice(0, 2)
}

class GaodeMapService {
  private loadPromise: Promise<typeof AMap> | null = null

  async load(): Promise<typeof AMap> {
    if (window.AMap) {
      return window.AMap
    }

    if (this.loadPromise) {
      return this.loadPromise
    }

    this.loadPromise = new Promise((resolve, reject) => {
      const existingScript = document.getElementById(AMAP_SCRIPT_ID) as HTMLScriptElement | null

      if (existingScript) {
        existingScript.addEventListener('load', () => {
          if (window.AMap) {
            resolve(window.AMap)
          } else {
            reject(new Error('高德地图脚本已加载，但 AMap 不存在'))
          }
        })

        existingScript.addEventListener('error', () => {
          reject(new Error('高德地图脚本加载失败'))
        })

        return
      }

      window._AMapSecurityConfig = {
        securityJsCode: AMAP_SECURITY_CODE,
      }

      const script = document.createElement('script')
      script.id = AMAP_SCRIPT_ID
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}`
      script.async = true
      script.defer = true
      script.onload = () => {
        if (window.AMap) {
          resolve(window.AMap)
        } else {
          reject(new Error('高德地图初始化失败'))
        }
      }
      script.onerror = () => reject(new Error('高德地图脚本加载失败'))
      document.head.appendChild(script)
    })

    return this.loadPromise
  }

  async createMap(container: HTMLElement, center: Coordinates, zoom = 12): Promise<AMap.Map> {
    await this.load()
    const map = new AMap.Map(container, {
      zoom,
      center: [center.lng, center.lat],
      viewMode: '2D',
      mapStyle: 'amap://styles/normal',
    })

    AMap.plugin(['AMap.Scale', 'AMap.ToolBar'], () => {
      map.addControl(new AMap.Scale())
      map.addControl(new AMap.ToolBar())
    })

    return map
  }

  createPoint(coords: Coordinates): AMap.LngLat {
    return new AMap.LngLat(coords.lng, coords.lat)
  }

  async reverseGeocode(point: Coordinates): Promise<string> {
    await this.load()

    return new Promise((resolve) => {
      AMap.plugin('AMap.Geocoder', () => {
        const geocoder = new AMap.Geocoder()
        geocoder.getAddress([point.lng, point.lat], (status, result) => {
          if (status === 'complete' && typeof result !== 'string') {
            resolve(result.regeocode.formattedAddress || '')
          } else {
            resolve('')
          }
        })
      })
    })
  }

  async geocodeAddress(address: string): Promise<Coordinates | null> {
    const keyword = address.trim()
    if (!keyword) {
      return null
    }

    await this.load()

    return new Promise((resolve) => {
      AMap.plugin('AMap.Geocoder', () => {
        const geocoder = new AMap.Geocoder()
        geocoder.getLocation(keyword, (status, result) => {
          if (status === 'complete' && typeof result !== 'string' && result.geocodes.length > 0) {
            const location = result.geocodes[0].location
            resolve({ lng: location.getLng(), lat: location.getLat() })
          } else {
            resolve(null)
          }
        })
      })
    })
  }

  getRouteInfo(from: Spot, to: Spot): RouteInfo[] {
    const straightDistance = getStraightDistanceMeters(from, to)
    const sameCity = getCityFromAddress(from.address) && getCityFromAddress(from.address) === getCityFromAddress(to.address)

    const walkingDistance = straightDistance * 1.18
    const transitDistance = straightDistance * 1.42
    const drivingDistance = straightDistance * 1.35
    const railwayDistance = straightDistance * 1.08
    const flightDistance = straightDistance

    const walkingSpeed = 1.25
    const busMetroAverageSpeed = ((18 + 35) / 2) * 1000 / 3600
    const drivingSpeed = 35 * 1000 / 3600
    const railwaySpeed = 220 * 1000 / 3600
    const flightSpeed = 750 * 1000 / 3600

    const walkingSeconds = walkingDistance / walkingSpeed
    const transitSeconds = transitDistance / busMetroAverageSpeed + 10 * 60
    const drivingSeconds = drivingDistance / drivingSpeed

    const railwayAvailable = !sameCity && straightDistance >= 80000
    const flightAvailable = !sameCity && straightDistance >= 300000

    const railwaySeconds = railwayAvailable ? railwayDistance / railwaySpeed + 35 * 60 : 0
    const flightSeconds = flightAvailable ? flightDistance / flightSpeed + 90 * 60 : 0

    return [
      createRouteInfo('walking', 'footprints', walkingSeconds, walkingDistance, true),
      createRouteInfo('transit', 'bus', transitSeconds, transitDistance, true),
      createRouteInfo('driving', 'car', drivingSeconds, drivingDistance, true),
      createRouteInfo('railway', 'train', railwaySeconds, railwayDistance, railwayAvailable),
      createRouteInfo('flight', 'plane', flightSeconds, flightDistance, flightAvailable),
    ]
  }

  async buildRouteGroups(spots: Spot[]): Promise<SpotRouteGroup[]> {
    return spots.slice(0, -1).map((spot, index) => ({
      fromSpotId: spot.id,
      toSpotId: spots[index + 1].id,
      routes: this.getRouteInfo(spot, spots[index + 1]),
    }))
  }

  async getWeather(city: string): Promise<string> {
    await this.load()

    interface WeatherResult {
      info: string
      weather: string
      temperature: string
      windDirection: string
      windPower: string
    }

    interface WeatherPlugin {
      getLive: (targetCity: string, callback: (status: string, result: WeatherResult) => void) => void
    }

    interface WeatherCtor {
      new(): WeatherPlugin
    }

    interface AMapWithWeather {
      Weather: WeatherCtor
    }

    return new Promise((resolve) => {
      AMap.plugin('AMap.Weather', () => {
        const weatherApi = AMap as unknown as AMapWithWeather
        const weather = new weatherApi.Weather()
        weather.getLive(city, (status, result) => {
          if (status === 'complete' && result.info === 'OK') {
            const { weather: weatherDesc, temperature, windDirection, windPower } = result
            resolve(`${weatherDesc}，温度${temperature}°C，${windDirection}风${windPower}级`)
          } else {
            resolve('天气信息获取失败，将按晴天规划')
          }
        })
      })
    })
  }
}

export const gaodeMapService = new GaodeMapService()
