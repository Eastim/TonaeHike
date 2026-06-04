import { useEffect, useRef, useState } from 'react'
import { gaodeMapService } from '../services/gaodeMap'
import type { Coordinates, Spot } from '../types'

interface UseGaodeMapOptions {
  center: Coordinates
  zoom: number
  spots: Spot[]
  selectedSpotId: string | null
  onSpotSelect?: (spotId: string) => void
}

export function useGaodeMap({
  center,
  zoom,
  spots,
  selectedSpotId,
  onSpotSelect,
}: UseGaodeMapOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<AMap.Map | null>(null)
  const markersRef = useRef<AMap.Text[]>([])
  const initialCenterRef = useRef(center)
  const initialZoomRef = useRef(zoom)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const initMap = async () => {
      if (!containerRef.current || mapRef.current) {
        return
      }

      try {
        setIsLoading(true)
        const map = await gaodeMapService.createMap(
          containerRef.current,
          initialCenterRef.current,
          initialZoomRef.current,
        )
        mapRef.current = map

        if (!cancelled) {
          setError(null)
          setIsLoading(false)
        }
      } catch (mapError) {
        if (!cancelled) {
          setError(mapError instanceof Error ? mapError.message : '地图初始化失败')
          setIsLoading(false)
        }
      }
    }

    void initMap()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) {
      return
    }

    map.setZoomAndCenter(zoom, [center.lng, center.lat])
  }, [center, zoom])

  useEffect(() => {
    const map = mapRef.current
    if (!map) {
      return
    }

    markersRef.current.forEach((marker) => map.remove(marker))
    markersRef.current = []

    spots.forEach((spot, index) => {
      const isSelected = selectedSpotId === spot.id
      const text = new AMap.Text({
        text: String(index + 1),
        position: [spot.lng, spot.lat],
        offset: new AMap.Pixel(-10, -10),
        style: {
          color: isSelected ? '#0f172a' : '#ffffff',
          background: isSelected ? '#67e8f9' : '#0f172acc',
          border: isSelected ? '1px solid #cffafe' : '1px solid rgba(255,255,255,0.2)',
          borderRadius: '999px',
          padding: '4px 8px',
          fontSize: '12px',
          boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
          cursor: 'pointer',
        },
      })

      if (onSpotSelect) {
        text.on('click', () => onSpotSelect(spot.id))
      }

      map.add(text)
      markersRef.current.push(text)
    })
  }, [spots, selectedSpotId, onSpotSelect])

  return {
    containerRef,
    isLoading,
    error,
  }
}
