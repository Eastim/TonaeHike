import { useEffect, useMemo, useRef } from 'react'
import { gaodeMapService } from '../services/gaodeMap'
import { useTripStore } from '../stores/tripStore'

export function useRouteSync() {
  const currentPlan = useTripStore((state) => state.currentPlan)
  const selectedDay = useTripStore((state) => state.selectedDay)
  const setRoutesLoading = useTripStore((state) => state.setRoutesLoading)
  const setRouteGroups = useTripStore((state) => state.setRouteGroups)
  const lastSyncedKeyRef = useRef<string>('')

  const day = currentPlan?.days[selectedDay]
  const planId = currentPlan?.id ?? ''
  const spots = useMemo(() => day?.spots ?? [], [day?.spots])
  const routeGroupsLength = day?.routeGroups.length ?? 0

  const routeSignature = useMemo(
    () => spots.map((spot) => `${spot.id}:${spot.lng},${spot.lat}`).join('|'),
    [spots],
  )
  const syncKey = `${planId}:${selectedDay}:${routeSignature}`

  useEffect(() => {
    if (!planId) {
      return
    }

    if (spots.length < 2) {
      if (routeGroupsLength > 0) {
        setRouteGroups(selectedDay, [])
      }
      setRoutesLoading(selectedDay, false)
      lastSyncedKeyRef.current = ''
      return
    }

    if (!routeSignature || lastSyncedKeyRef.current === syncKey) {
      return
    }

    let disposed = false
    lastSyncedKeyRef.current = syncKey
    setRoutesLoading(selectedDay, true)

    Promise.resolve(gaodeMapService.buildRouteGroups(spots))
      .then((routeGroups) => {
        if (disposed) {
          return
        }
        setRouteGroups(selectedDay, routeGroups)
      })
      .catch(() => {
        if (disposed) {
          return
        }
        setRouteGroups(selectedDay, [])
      })
      .finally(() => {
        if (disposed) {
          return
        }
        setRoutesLoading(selectedDay, false)
      })

    return () => {
      disposed = true
    }
  }, [planId, routeGroupsLength, routeSignature, selectedDay, setRouteGroups, setRoutesLoading, spots, syncKey])
}
