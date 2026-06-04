import { ArrowDown, ArrowUp, MapPinned, Tags, Trash2 } from 'lucide-react'
import type { Spot } from '../../types'
import { useTripStore } from '../../stores/tripStore'

interface TripCardProps {
  spot: Spot;
  sequence: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
}

export function TripCard({
  spot,
  sequence,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onDelete,
}: TripCardProps) {
  const selectedSpotId = useTripStore((state) => state.selectedSpotId)
  const selectSpot = useTripStore((state) => state.selectSpot)
  const isActive = selectedSpotId === spot.id

  return (
    <div
      className={[
        'w-full rounded-xl border p-4 text-left transition',
        isActive
          ? 'border-cyan-300 bg-cyan-50 shadow-sm'
          : 'border-slate-200 bg-white hover:bg-slate-50',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => selectSpot(spot.id)}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-700">
            {sequence}
          </div>

          <div className="min-w-0 flex-1">
            <div>
              <h3 className="line-clamp-1 text-base font-semibold text-slate-900">{spot.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{spot.address}</p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                <MapPinned className="h-3.5 w-3.5 text-cyan-500" />
                {spot.lng.toFixed(3)}, {spot.lat.toFixed(3)}
              </span>
              {spot.tags?.length ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                  <Tags className="h-3.5 w-3.5 text-cyan-500" />
                  {spot.tags.join(' · ')}
                </span>
              ) : null}
            </div>
          </div>
        </button>

        {onDelete && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              className={[
                'rounded-lg p-2 transition',
                canMoveUp ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900' : 'cursor-not-allowed text-slate-300',
              ].join(' ')}
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              className={[
                'rounded-lg p-2 transition',
                canMoveDown ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900' : 'cursor-not-allowed text-slate-300',
              ].join(' ')}
            >
              <ArrowDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg p-2 text-rose-500 transition hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
