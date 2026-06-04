import { LoaderCircle } from 'lucide-react'
import { useGaodeMap } from '../../hooks/useGaodeMap'
import { useTripStore } from '../../stores/tripStore'

export function MapPanel() {
  const currentPlan = useTripStore((state) => state.currentPlan)
  const selectedDay = useTripStore((state) => state.selectedDay)
  const selectedSpotId = useTripStore((state) => state.selectedSpotId)
  const mapViewport = useTripStore((state) => state.mapViewport)
  const selectSpot = useTripStore((state) => state.selectSpot)

  const spots = currentPlan?.days[selectedDay]?.spots ?? []
  const activeSpot = spots.find((spot) => spot.id === selectedSpotId) ?? spots[0] ?? null

  const { containerRef, isLoading, error } = useGaodeMap({
    center: activeSpot
      ? { lng: activeSpot.lng, lat: activeSpot.lat }
      : { lng: mapViewport.lng, lat: mapViewport.lat },
    zoom: mapViewport.zoom,
    spots,
    selectedSpotId,
    onSpotSelect: selectSpot,
  })

  return (
    <section className="relative flex h-full min-h-[760px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative flex flex-1 flex-col">
        <div className="z-10 border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">地图</p>
          </div>
        </div>

        <div className="relative flex-1 p-4">
          <div className="absolute inset-4 overflow-hidden rounded-xl border border-slate-200">
            <div ref={containerRef} className="h-full w-full" />
          </div>

          {activeSpot ? (
            <div className="pointer-events-none absolute left-8 top-8 z-10">
              <div className="rounded-xl border border-slate-200 bg-white/95 px-5 py-4 shadow-sm backdrop-blur-sm">
                <div className="text-xs uppercase tracking-[0.3em] text-slate-500">当前地点</div>
                <div className="mt-2 text-lg font-semibold text-slate-900">{activeSpot.name}</div>
                <div className="mt-1 max-w-[420px] text-sm text-slate-600">{activeSpot.address}</div>
                <div className="mt-2 text-xs text-slate-500">
                  {activeSpot.lng.toFixed(3)}, {activeSpot.lat.toFixed(3)}
                </div>
              </div>
            </div>
          ) : null}

          {isLoading ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm text-slate-700 shadow-sm">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                地图加载中...
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="absolute inset-x-10 bottom-10 z-20 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              地图加载失败：{error}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
