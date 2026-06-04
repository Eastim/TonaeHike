import { useMemo, useState } from 'react'
import { Modal } from '../Modal/Modal'

interface AddSpotModalProps {
  open: boolean;
  defaultName?: string;
  defaultAddress?: string;
  defaultLng?: number;
  defaultLat?: number;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    address: string;
    lng: number;
    lat: number;
    tags: string[];
  }) => void;
}

export function AddSpotModal({
  open,
  defaultName,
  defaultAddress,
  defaultLng,
  defaultLat,
  onClose,
  onSubmit,
}: AddSpotModalProps) {
  const initialValues = useMemo(
    () => ({
      name: defaultName || '',
      address: defaultAddress || '',
      lng: defaultLng || 0,
      lat: defaultLat || 0,
    }),
    [defaultAddress, defaultLat, defaultLng, defaultName],
  )

  const [name, setName] = useState(initialValues.name)
  const [address, setAddress] = useState(initialValues.address)
  const [lng, setLng] = useState(initialValues.lng)
  const [lat, setLat] = useState(initialValues.lat)
  const [tags, setTags] = useState('')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="添加地点"
      description="将地点信息保存到当前日期安排。"
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm text-slate-600">地点名称</span>
          <input 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-cyan-300" 
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm text-slate-600">地址</span>
          <textarea 
            value={address} 
            onChange={(e) => setAddress(e.target.value)} 
            rows={3} 
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-cyan-300" 
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-2 block text-sm text-slate-600">经度</span>
            <input 
              type="number" 
              value={lng} 
              onChange={(e) => setLng(Number(e.target.value) || 0)} 
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-cyan-300" 
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-slate-600">纬度</span>
            <input 
              type="number" 
              value={lat} 
              onChange={(e) => setLat(Number(e.target.value) || 0)} 
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-cyan-300" 
            />
          </label>
        </div>
        <label className="block">
          <span className="mb-2 block text-sm text-slate-600">标签</span>
          <input 
            value={tags} 
            onChange={(e) => setTags(e.target.value)} 
            placeholder="多个标签请用逗号分隔" 
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-300" 
          />
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
            onClick={() => {
              onSubmit({
                name: name || initialValues.name || '未命名地点',
                address: address || initialValues.address,
                lng,
                lat,
                tags: tags.split(/[，,]/).map((item) => item.trim()).filter(Boolean),
              })
              onClose()
            }}
            className="rounded-full bg-cyan-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-cyan-600"
          >
            保存地点
          </button>
        </div>
      </div>
    </Modal>
  )
}
