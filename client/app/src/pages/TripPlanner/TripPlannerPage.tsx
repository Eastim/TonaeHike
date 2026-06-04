import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { CalendarDays, MapPinned, Save, ArrowLeft, Eye } from 'lucide-react'
import { motion } from 'framer-motion'
import { Header } from '../../components/Header/Header'
import { Sidebar } from '../../components/Sidebar/Sidebar'
import { MapPanel } from '../../components/Map/MapPanel'
import { SearchBox } from '../../components/Search/SearchBox'
import { CreateTripModal } from '../../components/CreateTripModal/CreateTripModal'
import { DateRangePicker } from '../../components/DateRangePicker/DateRangePicker'
import { ShowSuccessModal } from '../../components/showSuccessModal/showSuccessmodal'
import { useRouteSync } from '../../hooks/useRouteSync'
import { useSearch } from '../../hooks/useSearch'
import { useTripStore } from '../../stores/tripStore'
import type { SearchResultItem, TripPlan } from '../../types'

export function TripPlannerPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const viewId = searchParams.get('id')
  
  const [keyword, setKeyword] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [saveFeedback, setSaveFeedback] = useState<'idle' | 'saving' | 'saved' | 'publishing' | 'published'>('idle')
  const [loadingPlan, setLoadingPlan] = useState(false)
  const [isReadOnly, setIsReadOnly] = useState(false)
  const [showPublishSuccess, setShowPublishSuccess] = useState(false)
  const searchOverlayRef = useRef<HTMLDivElement | null>(null)
  const currentPlan = useTripStore((state) => state.currentPlan)
  const selectedDay = useTripStore((state) => state.selectedDay)
  const createPlan = useTripStore((state) => state.createPlan)
  const updatePlanDates = useTripStore((state) => state.updatePlanDates)
  const addSpot = useTripStore((state) => state.addSpot)
  const focusSearchResult = useTripStore((state) => state.focusSearchResult)
  const setPendingSpot = useTripStore((state) => state.setPendingSpot)
  const { results, loading, error } = useSearch(keyword)
  const addPlan = useTripStore((state) => state.addPlan)

  useRouteSync()

  useEffect(() => {
    if (!viewId) return
    const myInfo = localStorage.getItem('userInfo')
    const myId = myInfo ? JSON.parse(myInfo).id : null
    
    setLoadingPlan(true)
    fetch(`http://localhost:3000/api/trips/${viewId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        const plan: TripPlan = {
          id: data.id,
          name: data.name,
          destination: data.destination,
          startDate: data.startDate.split('T')[0],
          endDate: data.endDate.split('T')[0],
          published: data.published || false,
          synced: true,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          days: (data.tripDays || []).map((day: any) => ({
            index: day.dayIndex,
            label: day.label,
            date: day.date.split('T')[0],
            spots: (day.spots || []).map((spot: any) => ({
              id: spot.id,
              name: spot.name,
              address: spot.address,
              lng: parseFloat(spot.lng),
              lat: parseFloat(spot.lat),
              dayIndex: day.dayIndex,
              order: spot.orderIndex,
              tags: spot.tags || []
            })),
            routeGroups: [],
            routesLoading: false
          }))
        }
        addPlan(plan)
        useTripStore.setState({ currentPlan: plan, selectedDay: 0 })
        setIsReadOnly(data.userId !== myId)
        setLoadingPlan(false)
      })
      .catch(() => setLoadingPlan(false))
  }, [viewId, addPlan])

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!searchOverlayRef.current?.contains(event.target as Node)) {
        setSearchFocused(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  const isSavedToServer = currentPlan?.synced === true

  const handleSavePlan = async () => {
    if (!currentPlan || isReadOnly) return

    setSaveFeedback('saving')

    try {
      const tripData = {
        name: currentPlan.name,
        destination: currentPlan.destination,
        startDate: currentPlan.startDate,
        endDate: currentPlan.endDate,
        tripDays: currentPlan.days.map((day) => ({
          date: day.date,
          label: day.label,
          spots: day.spots.map((spot) => ({
            name: spot.name,
            address: spot.address,
            lng: spot.lng,
            lat: spot.lat,
            tags: spot.tags || []
          }))
        }))
      }

      let response
      if (isSavedToServer) {
        response = await fetch(`http://localhost:3000/api/trips/${currentPlan.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(tripData)
        })
      } else {
        response = await fetch('http://localhost:3000/api/trips', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(tripData)
        })
      }

      const result = await response.json()
      console.log('保存计划成功:', result)

      const savedPlan: TripPlan = {
        id: result.id,
        name: result.name,
        destination: result.destination,
        startDate: result.startDate.split('T')[0],
        endDate: result.endDate.split('T')[0],
        published: result.published || false,
        synced: true,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
        days: result.tripDays.map((day: any) => ({
          index: day.dayIndex,
          label: day.label,
          date: day.date.split('T')[0],
          spots: day.spots.map((spot: any) => ({
            id: spot.id,
            name: spot.name,
            address: spot.address,
            lng: parseFloat(spot.lng),
            lat: parseFloat(spot.lat),
            dayIndex: day.dayIndex,
            order: spot.orderIndex,
            tags: spot.tags || [],
          })),
          routeGroups: [],
          routesLoading: false,
        })),
      }

      addPlan(savedPlan)
      useTripStore.setState({ currentPlan: savedPlan })

      setSaveFeedback('saved')
      setTimeout(() => setSaveFeedback('idle'), 2000)
    } catch (error) {
      console.error('保存计划失败:', error)
      setSaveFeedback('idle')
      alert('保存计划失败，请稍后重试')
    }
  }

  const handlePublishPlan = async () => {
    if (!currentPlan || !isSavedToServer || isReadOnly) {
      alert('请先保存计划')
      return
    }

    setSaveFeedback('publishing')

    try {
      const response = await fetch(`http://localhost:3000/api/trips/${currentPlan.id}/publish`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      })

      const result = await response.json()
      console.log('发布计划成功:', result)

      const publishedPlan: TripPlan = {
        ...currentPlan,
        published: true,
        updatedAt: result.updatedAt
      }
      addPlan(publishedPlan)

      setSaveFeedback('published')
      setShowPublishSuccess(true)
      setTimeout(() => {
        setSaveFeedback('idle')
        setShowPublishSuccess(false)
      }, 2000)
    } catch (error) {
      console.error('发布计划失败:', error)
      setSaveFeedback('idle')
      alert('发布计划失败，请稍后重试')
    }
  }

  const selectedDayLabel = useMemo(
    () => currentPlan?.days[selectedDay]?.label ?? `第${selectedDay + 1}天`,
    [currentPlan, selectedDay],
  )

  if (loadingPlan) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500" />
      </div>
    )
  }

  if (!currentPlan) {
    return <Navigate to="/main" replace />
  }

  const showSearchDropdown = searchFocused && Boolean(keyword.trim())

  const handlePickSearchResult = (item: SearchResultItem) => {
    focusSearchResult(item)
    addSpot(selectedDay, {
      name: item.name,
      address: item.address,
      lng: item.lng,
      lat: item.lat,
      dayIndex: selectedDay,
      tags: [item.city || '搜索结果'],
    })
    setPendingSpot(null)
    setKeyword('')
    setSearchFocused(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <div ref={searchOverlayRef} className="mx-auto flex min-h-[calc(100vh-40px)] max-w-[1600px] flex-col gap-4 px-6 py-5">
        <header className="relative flex items-center gap-6 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm overflow-visible">
          <button
            type="button"
            onClick={() => navigate(viewId ? '/main' : '/trip-home')}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:border-cyan-500/20 hover:text-cyan-500"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </button>

          {isReadOnly && (
            <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
              <Eye className="h-4 w-4" />
              <span>浏览模式 · 他人分享的行程</span>
            </div>
          )}

          {!isReadOnly && <div className="relative">
            <SearchBox
              keyword={keyword}
              onKeywordChange={setKeyword}
              loading={loading}
              onFocus={() => setSearchFocused(true)}
              onClear={() => setKeyword('')}
            />

            {showSearchDropdown ? (
              <div className="absolute left-0 right-0 top-full mt-2 z-[70]">
                <div className="w-full max-w-[980px] rounded-2xl border border-slate-200 bg-white shadow-lg">
                  <div className="border-b border-slate-200 px-5 py-3 text-sm text-slate-600">
                    当前将添加到 {selectedDayLabel}
                  </div>

                  {error ? (
                    <div className="px-5 py-4 text-sm text-rose-600">{error}</div>
                  ) : results.length === 0 && !loading ? (
                    <div className="px-5 py-6 text-sm text-slate-500">暂无匹配地点</div>
                  ) : (
                    <div className="max-h-[360px] overflow-y-auto p-2">
                      {results.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handlePickSearchResult(item)}
                          className="flex w-full items-start gap-4 rounded-xl px-4 py-4 text-left transition hover:bg-slate-50"
                        >
                          <div className="rounded-full bg-slate-100 p-2 text-slate-600">
                            <MapPinned className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-base font-medium text-slate-900">{item.name}</div>
                            <div className="mt-1 line-clamp-2 text-sm text-slate-600">{item.address}</div>
                            <div className="mt-2 text-xs text-slate-500">
                              {item.city || '未知城市'} · {item.lng.toFixed(3)}, {item.lat.toFixed(3)}
                            </div>
                          </div>
                          <div className="shrink-0 rounded-full bg-cyan-500 px-3 py-1.5 text-xs font-medium text-white">
                            加入当天
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>}

          <div className="ml-auto flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setDatePickerOpen(true)}
              disabled={isReadOnly}
              className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 lg:flex"
            >
              <CalendarDays className="h-4 w-4 text-cyan-500" />
              <span>{currentPlan.startDate} ~ {currentPlan.endDate}</span>
            </button>
            
            {!isReadOnly && (
              <>
            <button
              type="button"
              onClick={handleSavePlan}
              disabled={saveFeedback === 'saving'}
              className={[
                'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition',
                saveFeedback === 'saved'
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100',
                saveFeedback === 'saving' && 'cursor-not-allowed opacity-70',
              ].join(' ')}
            >
              <Save className={`h-4 w-4 ${saveFeedback === 'saving' ? 'animate-spin' : ''}`} />
              {saveFeedback === 'saving' ? '保存中...' : saveFeedback === 'saved' ? '已保存' : isSavedToServer ? '更新计划' : '保存计划'}
            </button>

            <button
              type="button"
              onClick={handlePublishPlan}
              disabled={!isSavedToServer || saveFeedback === 'publishing' || currentPlan?.published}
              className={[
                'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition',
                !isSavedToServer
                  ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                  : currentPlan?.published
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : saveFeedback === 'published'
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100',
                (saveFeedback === 'publishing' || currentPlan?.published) && 'cursor-not-allowed opacity-70',
              ].join(' ')}
            >
              <svg className={`h-4 w-4 ${saveFeedback === 'publishing' ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              {saveFeedback === 'publishing' ? '发布中...' : currentPlan?.published ? '已公开' : '发布计划'}
            </button>
              </>
            )}
          </div>
        </header>

        <section className="grid flex-1 grid-cols-[360px_minmax(0,1fr)] gap-4 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="min-h-0"
          >
            <Sidebar readOnly={isReadOnly} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.06, ease: 'easeOut' }}
            className="min-h-0"
          >
            <MapPanel />
          </motion.div>
        </section>
      </div>

      <CreateTripModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={createPlan}
      />

      <DateRangePicker
        key={`${currentPlan.startDate}-${currentPlan.endDate}`}
        open={datePickerOpen}
        onClose={() => setDatePickerOpen(false)}
        initialStartDate={currentPlan.startDate}
        initialEndDate={currentPlan.endDate}
        onConfirm={updatePlanDates}
      />

      <ShowSuccessModal
        show={showPublishSuccess}
        title="发布成功"
        message="您的行程攻略已成功发布"
      />
    </div>
  )
}
