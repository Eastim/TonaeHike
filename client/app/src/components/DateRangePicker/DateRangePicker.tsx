import { useState } from 'react'
import { X, Calendar } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface DateRangePickerProps {
  open: boolean
  onClose: () => void
  initialStartDate: string
  initialEndDate: string
  onConfirm: (startDate: string, endDate: string) => void
}

export function DateRangePicker({
  open,
  onClose,
  initialStartDate,
  initialEndDate,
  onConfirm,
}: DateRangePickerProps) {
  const [startDate, setStartDate] = useState(initialStartDate)
  const [endDate, setEndDate] = useState(initialEndDate)

  const handleConfirm = () => {
    if (!startDate || !endDate) {
      return
    }

    const start = new Date(`${startDate}T00:00:00`)
    const end = new Date(`${endDate}T00:00:00`)

    if (start > end) {
      alert('开始日期不能晚于结束日期')
      return
    }

    const dayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    if (dayCount > 30) {
      alert('行程天数不能超过 30 天')
      return
    }

    onConfirm(startDate, endDate)
    onClose()
  }

  const getDayCount = () => {
    if (!startDate || !endDate) {
      return 0
    }

    const start = new Date(`${startDate}T00:00:00`)
    const end = new Date(`${endDate}T00:00:00`)

    if (start > end) {
      return 0
    }

    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }

  const dayCount = getDayCount()

  if (!open) {
    return null
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">修改行程日期</h2>
                <p className="text-xs text-slate-500">调整开始和结束日期</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-5 px-6 py-5">
            <div>
              <label htmlFor="start-date" className="mb-2 block text-sm font-medium text-slate-700">
                开始日期
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>

            <div>
              <label htmlFor="end-date" className="mb-2 block text-sm font-medium text-slate-700">
                结束日期
              </label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>

            {dayCount > 0 ? (
              <div className="rounded-xl bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
                共 <span className="font-semibold">{dayCount}</span> 天行程
              </div>
            ) : null}

            {dayCount > 30 ? (
              <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-900">
                行程天数不能超过 30 天
              </div>
            ) : null}
          </div>

          <div className="flex gap-3 border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={dayCount === 0 || dayCount > 30}
              className="flex-1 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              确认修改
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
