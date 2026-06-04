import { create } from 'zustand'
import { gaodeMapService } from '../services/gaodeMap'
import type { MapViewport, SearchResultItem, Spot, SpotRouteGroup, TripPlan } from '../types'

interface PendingSpotPayload {
  lng: number;
  lat: number;
  address: string;
  name?: string;
}

interface CreatePlanPayload {
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  dayCount: number;
}

interface TripStoreState {
  plans: TripPlan[];
  currentPlan: TripPlan | null;
  selectedDay: number;
  selectedSpotId: string | null;
  mapViewport: MapViewport;
  pendingSpot: PendingSpotPayload | null;
  loading: boolean;
  createMockPlan: () => void;
  createPlan: (payload: CreatePlanPayload) => void;
  updatePlanDates: (startDate: string, endDate: string) => void;
  selectPlan: (planId: string) => void;
  selectDay: (dayIndex: number) => void;
  selectSpot: (spotId: string | null) => void;
  focusSearchResult: (result: SearchResultItem) => void;
  setMapViewport: (viewport: Partial<MapViewport>) => void;
  setPendingSpot: (spot: PendingSpotPayload | null) => void;
  setRoutesLoading: (dayIndex: number, loading: boolean) => void;
  addSpot: (dayIndex: number, spot: Omit<Spot, 'id' | 'order'>) => void;
  removeSpot: (dayIndex: number, spotId: string) => void;
  reorderSpots: (dayIndex: number, orderedSpotIds: string[]) => void;
  setRouteGroups: (dayIndex: number, routeGroups: SpotRouteGroup[]) => void;
  loadPlans: () => Promise<void>;
  addPlan: (plan: TripPlan) => void;
  removePlan: (planId: string) => void;
}

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

const buildRouteGroups = () => [] satisfies SpotRouteGroup[]

const createDayDate = (startDate: string, offset: number) => {
  const [year, month, day] = startDate.split('-').map(Number)
  const localDate = new Date(year, (month || 1) - 1, day || 1)
  localDate.setDate(localDate.getDate() + offset)
  return `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`
}

const createEmptyDays = (dayCount: number, startDate: string) =>
  Array.from({ length: dayCount }, (_, index) => ({
    index,
    label: `第${index + 1}天`,
    date: createDayDate(startDate, index),
    spots: [],
    routeGroups: [],
    routesLoading: false,
  }))

const createMockPlanData = (): TripPlan => {
  const day0Spots: Spot[] = [
    {
      id: createId(),
      name: '天安门广场',
      address: '北京市东城区东长安街',
      lng: 116.397,
      lat: 39.908,
      dayIndex: 0,
      order: 0,
      tags: ['地标', '拍照'],
    },
    {
      id: createId(),
      name: '故宫博物院',
      address: '北京市东城区景山前街4号',
      lng: 116.403,
      lat: 39.924,
      dayIndex: 0,
      order: 1,
      tags: ['文化', '历史'],
    },
  ]

  return {
    id: createId(),
    name: '示例行程',
    destination: '北京',
    startDate: '2026-06-01',
    endDate: '2026-06-02',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    days: [
      {
        index: 0,
        label: '第1天',
        date: '2026-06-01',
        spots: day0Spots,
        routeGroups: buildRouteGroups(),
        routesLoading: false,
      },
      {
        index: 1,
        label: '第2天',
        date: '2026-06-02',
        spots: [],
        routeGroups: [],
        routesLoading: false,
      },
    ],
  }
}

const defaultViewport: MapViewport = {
  lng: 116.404,
  lat: 39.915,
  zoom: 12,
}

const cityViewportMap: Record<string, MapViewport> = {
  北京: { lng: 116.404, lat: 39.915, zoom: 12 },
  上海: { lng: 121.4737, lat: 31.2304, zoom: 12 },
  广州: { lng: 113.2644, lat: 23.1291, zoom: 12 },
  深圳: { lng: 114.0579, lat: 22.5431, zoom: 12 },
  成都: { lng: 104.0665, lat: 30.5728, zoom: 12 },
  重庆: { lng: 106.5516, lat: 29.563, zoom: 12 },
  杭州: { lng: 120.1551, lat: 30.2741, zoom: 12 },
  南京: { lng: 118.7969, lat: 32.0603, zoom: 12 },
  西安: { lng: 108.9398, lat: 34.3416, zoom: 12 },
  武汉: { lng: 114.3054, lat: 30.5931, zoom: 12 },
  苏州: { lng: 120.5853, lat: 31.2989, zoom: 12 },
  天津: { lng: 117.2009, lat: 39.0842, zoom: 12 },
  长沙: { lng: 112.9388, lat: 28.2282, zoom: 12 },
  青岛: { lng: 120.3826, lat: 36.0671, zoom: 12 },
  厦门: { lng: 118.0894, lat: 24.4798, zoom: 12 },
  昆明: { lng: 102.8329, lat: 24.8801, zoom: 12 },
  三亚: { lng: 109.5121, lat: 18.2528, zoom: 12 },
  拉萨: { lng: 91.1322, lat: 29.6604, zoom: 12 },
}

const resolveViewportByDestination = (destination: string): MapViewport => {
  const normalized = destination.trim()
  if (!normalized) {
    return defaultViewport
  }

  const matchedEntry = Object.entries(cityViewportMap).find(([city]) =>
    normalized.includes(city) || city.includes(normalized),
  )

  return matchedEntry?.[1] ?? defaultViewport
}

const isKnownViewport = (destination: string) => {
  const normalized = destination.trim()
  return Object.keys(cityViewportMap).some((city) => normalized.includes(city) || city.includes(normalized))
}

const updateViewportByDestination = async (
  destination: string,
  set: (partial: Partial<TripStoreState> | ((state: TripStoreState) => Partial<TripStoreState> | TripStoreState)) => void,
) => {
  if (!destination.trim() || isKnownViewport(destination)) {
    return
  }

  try {
    const coords = await gaodeMapService.geocodeAddress(destination)
    if (!coords) {
      return
    }

    set((state) => ({
      mapViewport: {
        ...state.mapViewport,
        lng: coords.lng,
        lat: coords.lat,
        zoom: 12,
      },
    }))
  } catch {
    return
  }
}

const updatePlanInList = (plans: TripPlan[], nextPlan: TripPlan) =>
  plans.map((plan) => (plan.id === nextPlan.id ? nextPlan : plan))

export const useTripStore = create<TripStoreState>((set) => ({
  plans: [],
  currentPlan: null,
  selectedDay: 0,
  selectedSpotId: null,
  pendingSpot: null,
  mapViewport: defaultViewport,
  loading: false,
  createMockPlan: () => {
    const plan = createMockPlanData()
    set({
      plans: [plan],
      currentPlan: plan,
      selectedDay: 0,
      selectedSpotId: null,
      pendingSpot: null,
      mapViewport: resolveViewportByDestination(plan.destination),
    })
  },
  createPlan: ({ name, destination, startDate, endDate, dayCount }) => {
    const plan: TripPlan = {
      id: createId(),
      name,
      destination,
      startDate,
      endDate,
      synced: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      days: createEmptyDays(dayCount, startDate),
    }

    set((state) => ({
      plans: [plan, ...state.plans],
      currentPlan: plan,
      selectedDay: 0,
      selectedSpotId: null,
      pendingSpot: null,
      mapViewport: resolveViewportByDestination(destination),
    }))

    void updateViewportByDestination(destination, set)
  },
  updatePlanDates: (startDate, endDate) =>
    set((state) => {
      if (!state.currentPlan) {
        return state
      }

      const start = new Date(`${startDate}T00:00:00`)
      const end = new Date(`${endDate}T00:00:00`)
      const dayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

      if (dayCount < 1 || dayCount > 30) {
        return state
      }

      const existingDays = state.currentPlan.days
      const newDays = createEmptyDays(dayCount, startDate)

      const mergedDays = newDays.map((newDay) => {
        const existingDay = existingDays[newDay.index]
        return existingDay
          ? {
              ...newDay,
              spots: existingDay.spots.map((spot) => ({ ...spot, dayIndex: newDay.index })),
              routeGroups: existingDay.routeGroups,
              routesLoading: existingDay.routesLoading,
            }
          : newDay
      })

      const nextPlan = {
        ...state.currentPlan,
        startDate,
        endDate,
        days: mergedDays,
        updatedAt: new Date().toISOString(),
      }

      return {
        currentPlan: nextPlan,
        plans: updatePlanInList(state.plans, nextPlan),
        selectedDay: Math.min(state.selectedDay, dayCount - 1),
      }
    }),
  selectPlan: (planId) =>
    set((state) => {
      const target = state.plans.find((plan) => plan.id === planId) ?? null
      if (target) {
        void updateViewportByDestination(target.destination, set)
      }

      return {
        currentPlan: target,
        selectedDay: 0,
        selectedSpotId: null,
        pendingSpot: null,
        mapViewport: target ? resolveViewportByDestination(target.destination) : defaultViewport,
      }
    }),
  selectDay: (dayIndex) => set({ selectedDay: dayIndex, selectedSpotId: null, pendingSpot: null }),
  selectSpot: (spotId) =>
    set((state) => {
      if (!spotId || !state.currentPlan) {
        return { selectedSpotId: spotId }
      }

      const target = state.currentPlan.days
        .flatMap((day) => day.spots)
        .find((spot) => spot.id === spotId)

      return target
        ? {
            selectedSpotId: spotId,
            mapViewport: {
              ...state.mapViewport,
              lng: target.lng,
              lat: target.lat,
            },
          }
        : { selectedSpotId: spotId }
    }),
  focusSearchResult: (result) =>
    set((state) => ({
      selectedSpotId: null,
      mapViewport: {
        ...state.mapViewport,
        lng: result.lng,
        lat: result.lat,
        zoom: 15,
      },
      pendingSpot: {
        name: result.name,
        address: result.address,
        lng: result.lng,
        lat: result.lat,
      },
    })),
  setMapViewport: (viewport) =>
    set((state) => ({
      mapViewport: {
        ...state.mapViewport,
        ...viewport,
      },
    })),
  setPendingSpot: (spot) => set({ pendingSpot: spot }),
  setRoutesLoading: (dayIndex, loading) =>
    set((state) => {
      if (!state.currentPlan) {
        return state
      }

      const nextPlan = {
        ...state.currentPlan,
        days: state.currentPlan.days.map((day) =>
          day.index === dayIndex ? { ...day, routesLoading: loading } : day,
        ),
      }

      return {
        currentPlan: nextPlan,
        plans: updatePlanInList(state.plans, nextPlan),
      }
    }),
  addSpot: (dayIndex, spot) =>
    set((state) => {
      if (!state.currentPlan) {
        return state
      }

      const days = state.currentPlan.days.map((day) => {
        if (day.index !== dayIndex) {
          return day
        }

        const nextSpots = [
          ...day.spots,
          {
            ...spot,
            id: createId(),
            order: day.spots.length,
          },
        ]

        return {
          ...day,
          spots: nextSpots,
          routeGroups: buildRouteGroups(),
        }
      })

      const nextPlan = {
        ...state.currentPlan,
        days,
        updatedAt: new Date().toISOString(),
      }

      return {
        currentPlan: nextPlan,
        plans: updatePlanInList(state.plans, nextPlan),
        pendingSpot: null,
      }
    }),
  removeSpot: (dayIndex, spotId) =>
    set((state) => {
      if (!state.currentPlan) {
        return state
      }

      const days = state.currentPlan.days.map((day) => {
        if (day.index !== dayIndex) {
          return day
        }

        const nextSpots = day.spots
          .filter((spot) => spot.id !== spotId)
          .map((spot, index) => ({ ...spot, order: index }))

        return {
          ...day,
          spots: nextSpots,
          routeGroups: buildRouteGroups(),
        }
      })

      const nextPlan = {
        ...state.currentPlan,
        days,
        updatedAt: new Date().toISOString(),
      }

      return {
        currentPlan: nextPlan,
        plans: updatePlanInList(state.plans, nextPlan),
        selectedSpotId: state.selectedSpotId === spotId ? null : state.selectedSpotId,
      }
    }),
  reorderSpots: (dayIndex, orderedSpotIds) =>
    set((state) => {
      if (!state.currentPlan) {
        return state
      }

      const days = state.currentPlan.days.map((day) => {
        if (day.index !== dayIndex) {
          return day
        }

        const sortedSpots = orderedSpotIds
          .map((id) => day.spots.find((spot) => spot.id === id))
          .filter((spot): spot is Spot => Boolean(spot))
          .map((spot, index) => ({ ...spot, order: index }))

        return {
          ...day,
          spots: sortedSpots,
          routeGroups: buildRouteGroups(),
        }
      })

      const nextPlan = {
        ...state.currentPlan,
        days,
        updatedAt: new Date().toISOString(),
      }

      return {
        currentPlan: nextPlan,
        plans: updatePlanInList(state.plans, nextPlan),
      }
    }),
  setRouteGroups: (dayIndex, routeGroups) =>
    set((state) => {
      if (!state.currentPlan) {
        return state
      }

      const nextPlan = {
        ...state.currentPlan,
        days: state.currentPlan.days.map((day) =>
          day.index === dayIndex ? { ...day, routeGroups } : day,
        ),
        updatedAt: new Date().toISOString(),
      }

      return {
        currentPlan: nextPlan,
        plans: updatePlanInList(state.plans, nextPlan),
      }
    }),
  loadPlans: async () => {
    set({ loading: true })
    try {
      const response = await fetch('http://localhost:3000/api/trips', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      
      const plans: TripPlan[] = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        destination: item.destination,
        startDate: item.startDate.split('T')[0],
        endDate: item.endDate.split('T')[0],
        published: item.published || false,
        synced: true,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        days: item.tripDays.map((day: any) => ({
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
      }))
      
      set({ plans, loading: false })
    } catch (error) {
      console.error('加载行程计划失败:', error)
      set({ loading: false })
    }
  },
  addPlan: (plan) =>
    set((state) => {
      const exists = state.plans.some((p) => p.id === plan.id)
      return {
        plans: exists
          ? state.plans.map((p) => (p.id === plan.id ? plan : p))
          : [plan, ...state.plans],
        currentPlan: state.currentPlan?.id === plan.id ? plan : state.currentPlan,
      }
    }),
  removePlan: (planId) =>
    set((state) => ({
      plans: state.plans.filter((plan) => plan.id !== planId),
    })),
}))
