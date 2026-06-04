import { motion } from 'framer-motion'
import { Bus, Car, Footprints, Plane, Train } from 'lucide-react'
import type { RouteInfo, RouteType } from '../../types'

interface TransportCardProps {
  routes: RouteInfo[];
  fromSpot: string;
  toSpot: string;
}

const iconMap: Record<RouteType, typeof Car> = {
  driving: Car,
  transit: Bus,
  walking: Footprints,
  flight: Plane,
  railway: Train,
}

const labelMap: Record<RouteType, string> = {
  driving: '驾车',
  transit: '公交',
  walking: '步行',
  flight: '飞机',
  railway: '铁路',
}

export function TransportCard({ routes, fromSpot, toSpot }: TransportCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 }}
      className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
    >
      <div className="relative">
        <div className="mb-3 flex items-center justify-between gap-3 text-sm text-slate-700">
          <span className="max-w-[38%] truncate">{fromSpot}</span>
          <span className="text-cyan-500">→</span>
          <span className="max-w-[38%] truncate text-right">{toSpot}</span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {routes.map((route) => {
            const Icon = iconMap[route.type]

            return (
              <div
                key={route.type}
                className={[
                  'rounded-xl border px-2 py-2 text-center transition',
                  route.available
                    ? 'border-cyan-200 bg-cyan-50 text-slate-900'
                    : 'border-slate-200 bg-white text-slate-400',
                ].join(' ')}
              >
                <Icon className="mx-auto h-4 w-4" />
                <div className="mt-2 text-[11px]">{labelMap[route.type]}</div>
                <div className="mt-1 text-[11px] font-medium">{route.available ? route.duration : '--'}</div>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
