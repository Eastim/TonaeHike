export {}

declare global {
  interface Window {
    AMap?: typeof AMap
    _AMapSecurityConfig?: {
      securityJsCode: string
    }
  }

  namespace AMap {
    class LngLat {
      constructor(lng: number, lat: number)
      getLng(): number
      getLat(): number
      lng: number
      lat: number
    }

    class Pixel {
      constructor(x: number, y: number)
      x: number
      y: number
    }

    interface MapOptions {
      zoom?: number
      center?: LngLat | [number, number]
      viewMode?: '2D' | '3D'
      mapStyle?: string
    }

    interface TextOptions {
      text?: string
      position?: LngLat | [number, number]
      offset?: Pixel
      style?: Record<string, string>
      cursor?: string
    }

    class Text {
      constructor(options?: TextOptions)
      on(event: string, handler: (event: unknown) => void): void
    }

    class Scale {
      constructor(config?: unknown)
    }

    class ToolBar {
      constructor(config?: unknown)
    }

    interface GeocodeResult {
      regeocode: {
        formattedAddress: string
      }
    }

    class Geocoder {
      constructor(options?: unknown)
      getAddress(location: LngLat | [number, number], callback: (status: string, result: GeocodeResult | string) => void): void
      getLocation(address: string, callback: (status: string, result: { geocodes: Array<{ location: LngLat }> } | string) => void): void
    }

    interface POI {
      id: string
      name: string
      location: LngLat
      address: string
      pname?: string
      cityname?: string
    }

    interface PlaceSearchResult {
      poiList?: {
        pois: POI[]
      }
    }

    class PlaceSearch {
      constructor(options?: unknown)
      search(keyword: string, callback: (status: string, result: PlaceSearchResult | string) => void): void
      searchNearBy(keyword: string, center: LngLat | [number, number], radius: number, callback: (status: string, result: PlaceSearchResult | string) => void): void
    }

    interface WalkingRoute {
      time: number
      distance: number
    }

    interface WalkingResult {
      routes?: WalkingRoute[]
    }

    class Walking {
      constructor(options?: unknown)
      search(origin: LngLat | [number, number], destination: LngLat | [number, number], callback: (status: string, result: WalkingResult | string) => void): void
    }

    interface TransferPlan {
      time: number
      distance: number
    }

    interface TransferResult {
      plans?: TransferPlan[]
    }

    class Transfer {
      constructor(options?: { city?: string })
      search(origin: LngLat | [number, number], destination: LngLat | [number, number], callback: (status: string, result: TransferResult | string) => void): void
    }

    interface DrivingPath {
      time: number
      distance: number
    }

    interface DrivingResult {
      routes?: DrivingPath[]
    }

    class Driving {
      constructor(options?: unknown)
      search(origin: LngLat | [number, number], destination: LngLat | [number, number], callback: (status: string, result: DrivingResult | string) => void): void
    }

    class Map {
      constructor(container: string | HTMLElement, options?: MapOptions)
      setZoomAndCenter(zoom: number, center: LngLat | [number, number]): void
      add(overlays: Text | Text[]): void
      remove(overlays: Text | Text[]): void
      addControl(control: Scale | ToolBar): void
    }

    function plugin(plugins: string | string[], callback: () => void): void
  }
}
