import { useEffect, useRef, useState } from 'react'
import { Calendar, MapPin, Sparkles, LoaderCircle } from 'lucide-react'
import { TripCard } from '../TripCard/TripCard'
import { TransportCard } from '../TransportCard/TransportCard'
import { AIPlanDialog } from '../AIPlanDialog/AIPlanDialog'
import { useTripStore } from '../../stores/tripStore'
import { deepseekAIService } from '../../services/deepseekAI'
import { gaodeMapService } from '../../services/gaodeMap'
import { searchService } from '../../services/searchService'

const formatDayDate = (value?: string) => {
  if (!value) {
    return '未设置日期'
  }

  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return `${date.getMonth() + 1}月${date.getDate()}日`
}

interface SidebarProps {
  readOnly?: boolean
}

export function Sidebar({ readOnly = false }: SidebarProps) {
  const currentPlan = useTripStore((state) => state.currentPlan)
  const selectedDay = useTripStore((state) => state.selectedDay)
  const selectDay = useTripStore((state) => state.selectDay)
  const reorderSpots = useTripStore((state) => state.reorderSpots)
  const removeSpot = useTripStore((state) => state.removeSpot)
  const addSpot = useTripStore((state) => state.addSpot)
  const [isGenerating, setIsGenerating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [aiReasoning, setAiReasoning] = useState('')
  const [aiSessionVersion, setAiSessionVersion] = useState(0)
  const daySelectorRef = useRef<HTMLDivElement>(null)

  if (!currentPlan) {
    return null
  }

  useEffect(() => {
    if (daySelectorRef.current) {
      const activeButton = daySelectorRef.current.querySelector('[data-active="true"]') as HTMLElement
      if (activeButton) {
        const container = daySelectorRef.current
        const containerRect = container.getBoundingClientRect()
        const buttonRect = activeButton.getBoundingClientRect()
        
        const scrollLeft = activeButton.offsetLeft - containerRect.width / 2 + buttonRect.width / 2
        
        container.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        })
      }
    }
  }, [selectedDay])

  const day = currentPlan.days[selectedDay]

  const moveSpot = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= day.spots.length) {
      return
    }

    const ids = [...day.spots.map((spot) => spot.id)]
    const [moved] = ids.splice(fromIndex, 1)
    ids.splice(toIndex, 0, moved)
    reorderSpots(selectedDay, ids)
  }

  const handleGeneratePlan = async () => {
    setIsGenerating(true)
    deepseekAIService.resetConversation()

    try {
      const weather = await gaodeMapService.getWeather(currentPlan.destination)

      const planResponse = await deepseekAIService.generateTripPlan({
        planName: currentPlan.name,
        destination: currentPlan.destination,
        startDate: currentPlan.startDate,
        endDate: currentPlan.endDate,
        dayCount: currentPlan.days.length,
        weather,
      })

      setAiReasoning(planResponse.reasoning)
      setAiSessionVersion((value) => value + 1)

      const failedSpots: string[] = []

      for (const dayPlan of planResponse.days) {
        for (const spot of dayPlan.spots) {
          try {
            const searchResults = await searchService.searchPlaces(spot.name)
            const matchedSpot = searchResults.find((result) =>
              result.address.includes(currentPlan.destination) ||
              spot.address.includes(result.city || ''),
            ) || searchResults[0]

            if (matchedSpot) {
              addSpot(dayPlan.dayIndex, {
                name: matchedSpot.name,
                address: matchedSpot.address,
                lng: matchedSpot.lng,
                lat: matchedSpot.lat,
                dayIndex: dayPlan.dayIndex,
                tags: spot.tags || ['AI 推荐'],
              })
            } else {
              failedSpots.push(spot.name)
            }
          } catch (searchError) {
            console.warn(`搜索地点 "${spot.name}" 失败:`, searchError)
            failedSpots.push(spot.name)
          }
        }
      }

      if (failedSpots.length > 0) {
        console.warn(`以下地点搜索失败，已跳过: ${failedSpots.join(', ')}`)
      }

      setDialogOpen(true)
    } catch (error) {
      console.error('生成行程失败:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      if (errorMessage.includes('JSAPI')) {
        alert(`生成行程时地点检索失败，可能是网络或服务暂时不可用。\n\n错误详情：${errorMessage}\n\n建议：请检查网络连接后重试，或手动添加地点。`)
      } else {
        alert(`生成行程失败：${errorMessage}`)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAdjustPlan = async (feedback: string) => {
    const planResponse = await deepseekAIService.adjustPlan(feedback)

    currentPlan.days.forEach((day) => {
      day.spots.forEach((spot) => {
        removeSpot(day.index, spot.id)
      })
    })

    for (const dayPlan of planResponse.days) {
      for (const spot of dayPlan.spots) {
        const searchResults = await searchService.searchPlaces(spot.name)
        const matchedSpot = searchResults.find((result) =>
          result.address.includes(currentPlan.destination) ||
          spot.address.includes(result.city || ''),
        ) || searchResults[0]

        if (matchedSpot) {
          addSpot(dayPlan.dayIndex, {
            name: matchedSpot.name,
            address: matchedSpot.address,
            lng: matchedSpot.lng,
            lat: matchedSpot.lat,
            dayIndex: dayPlan.dayIndex,
            tags: spot.tags || ['AI 推荐'],
          })
        }
      }
    }
  }

  const hasAdvisorSession = aiSessionVersion > 0

  const handleAdvisorButtonClick = () => {
    if (hasAdvisorSession) {
      setDialogOpen(true)
      return
    }

    void handleGeneratePlan()
  }

  return (
    <>
      <aside className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 pb-4 pt-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">当前行程</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">{currentPlan.name}</h2>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
              <MapPin className="h-3.5 w-3.5 text-cyan-500" />
              {currentPlan.destination}
            </div>
          </div>
        </div>

        <div className="border-b border-slate-200 px-4 py-4">
          {!readOnly && (
            <button
              type="button"
              onClick={handleAdvisorButtonClick}
              disabled={isGenerating}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-cyan-500/30 transition hover:shadow-xl hover:shadow-cyan-500/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  AI 规划中...
                </>
              ) : hasAdvisorSession ? (
                <>
                  <Sparkles className="h-4 w-4" />
                  继续对话
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  一键生成规划
                </>
              )}
            </button>
          )}

          <div ref={daySelectorRef} className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
            <div className="flex gap-2 min-w-max">
              {currentPlan.days.map((item) => {
                const active = item.index === selectedDay

                return (
                  <button
                    key={item.index}
                    type="button"
                    onClick={() => selectDay(item.index)}
                    data-active={active}
                    className={[
                      'shrink-0 rounded-xl border px-4 py-2.5 text-center transition',
                      active
                        ? 'border-cyan-300 bg-cyan-50 text-slate-900 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        <Calendar className="h-3.5 w-3.5 text-cyan-500" />
                        {item.label}
                      </div>
                      <div className="text-xs text-slate-500">{formatDayDate(item.date)}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {day.spots.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
              <div className="text-sm font-medium text-slate-900">当天还没有安排地点</div>
              <div className="mt-2 text-sm text-slate-600">
                {readOnly ? '作者还没有为当天安排地点' : '可通过顶部搜索或点击"一键生成规划"让 AI 为您规划行程。'}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {day.spots.map((spot, index) => {
                const routeGroup = day.routeGroups[index]
                const nextSpot = day.spots[index + 1]

                return (
                  <div key={spot.id} className="space-y-3">
                    <TripCard
                      spot={spot}
                      sequence={index + 1}
                      canMoveUp={!readOnly && index > 0}
                      canMoveDown={!readOnly && index < day.spots.length - 1}
                      onMoveUp={() => moveSpot(index, index - 1)}
                      onMoveDown={() => moveSpot(index, index + 1)}
                      onDelete={readOnly ? undefined : () => removeSpot(selectedDay, spot.id)}
                    />
                    {routeGroup && nextSpot ? (
                      <TransportCard routes={routeGroup.routes} fromSpot={spot.name} toSpot={nextSpot.name} />
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </aside>

      <AIPlanDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        initialReasoning={aiReasoning}
        sessionVersion={aiSessionVersion}
        onAdjust={handleAdjustPlan}
      />
    </>
  )
}
