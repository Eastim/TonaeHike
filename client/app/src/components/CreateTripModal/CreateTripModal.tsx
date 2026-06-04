import { useMemo, useState } from 'react'
import { Modal } from '../Modal/Modal'
import { Sparkles } from 'lucide-react'

interface CreateTripModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    dayCount: number;
  }) => void;
}

const padDate = (value: number) => String(value).padStart(2, '0')

const formatLocalDate = (date: Date) => `${date.getFullYear()}-${padDate(date.getMonth() + 1)}-${padDate(date.getDate())}`

const getDefaultStartDate = () => formatLocalDate(new Date())

const getEndDate = (startDate: string, dayCount: number) => {
  if (!startDate) {
    return ''
  }

  const [year, month, day] = startDate.split('-').map(Number)
  const localDate = new Date(year, (month || 1) - 1, day || 1)
  localDate.setDate(localDate.getDate() + Math.max(dayCount - 1, 0))
  return formatLocalDate(localDate)
}

const formatDisplayDate = (value: string) => {
  if (!value) {
    return '--'
  }

  const [year, month, day] = value.split('-')
  if (!year || !month || !day) {
    return value
  }

  return `${year}/${month}/${day}`
}

const worldCities = [
  // 国内城市
  '北京', '上海', '广州', '深圳', '成都', '杭州', '西安', '重庆',
  '南京', '苏州', '无锡', '常州', '杭州', '宁波', '温州',
  '武汉', '长沙', '郑州', '合肥', '济南', '青岛', '烟台',
  '天津', '沈阳', '大连', '哈尔滨', '长春', '石家庄', '太原',
  '昆明', '贵阳', '南宁', '福州', '厦门', '珠海', '中山',
  '海口', '三亚', '兰州', '西宁', '银川', '呼和浩特', '乌鲁木齐',
  '拉萨', '丽江', '大理', '桂林', '阳朔', '张家界', '黄山',
  '厦门', '泉州', '绍兴', '嘉兴', '扬州', '镇江', '南通',
]

const getRandomCity = () => {
  const randomIndex = Math.floor(Math.random() * worldCities.length)
  return worldCities[randomIndex]
}

export function CreateTripModal({ open, onClose, onSubmit }: CreateTripModalProps) {
  const [name, setName] = useState('')
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState(getDefaultStartDate)
  const [dayCount, setDayCount] = useState(3)

  const endDate = useMemo(() => getEndDate(startDate, dayCount), [startDate, dayCount])
  const isSubmitDisabled = !name.trim() || !destination.trim() || !startDate || dayCount < 1

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="创建行程"
      description="填写目的地、出发日期与天数，系统会自动生成每日安排。"
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm text-slate-600">行程名称</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="例如：毕业旅行"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-300"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-slate-600">目的地</span>
          <div className="relative">
            <input
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder="例如：成都"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-300"
            />
            <button
              type="button"
              onClick={() => setDestination(getRandomCity())}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-cyan-500 transition-colors"
              title="随机选择一个城市"
            >
              <Sparkles className="h-4 w-4" />
            </button>
          </div>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-2 block text-sm text-slate-600">开始日期</span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-cyan-300"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-600">天数</span>
            <input
              type="number"
              min={1}
              max={30}
              value={dayCount}
              onChange={(event) => setDayCount(Math.min(30, Math.max(1, Number(event.target.value) || 1)))}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-cyan-300"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm text-slate-600">结束日期</span>
          <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600">
            {formatDisplayDate(endDate)}
          </div>
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            取消
          </button>
          <button
            type="button"
            disabled={isSubmitDisabled}
            onClick={() => {
              onSubmit({
                name: name.trim(),
                destination: destination.trim(),
                startDate,
                endDate,
                dayCount,
              })
              onClose()
            }}
            className="rounded-full bg-cyan-500 px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 hover:bg-cyan-600"
          >
            创建行程
          </button>
        </div>
      </div>
    </Modal>
  )
}
