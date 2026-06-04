import express from 'express'
import { authenticate, AuthRequest } from '../middleware/auth.middleware'
import prisma from '../prisma/client'

const router = express.Router()

router.get('/', authenticate, async (req: AuthRequest, res) => {
  const { published } = req.query
  
  const where: any = { userId: req.user!.id }
  if (published !== undefined) {
    where.published = published === 'true'
  }
  
  const trips = await prisma.tripPlan.findMany({
    where,
    include: { tripDays: { include: { spots: true } } },
    orderBy: { createdAt: 'desc' }
  })
  res.json(trips)
})

router.get('/published', authenticate, async (req: AuthRequest, res) => {
  const trips = await prisma.tripPlan.findMany({
    where: { published: true } as any,
    include: {
      tripDays: { include: { spots: true } },
      user: { select: { id: true, username: true, nickname: true, avatarUrl: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
  res.json(trips)
})

router.post('/', authenticate, async (req: AuthRequest, res) => {
  const { name, destination, startDate, endDate, tripDays } = req.body
  
  const trip = await prisma.tripPlan.create({
    data: {
      name,
      destination,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      userId: req.user!.id,
      tripDays: {
        create: tripDays.map((day: any, index: number) => ({
          dayIndex: index,
          date: new Date(day.date),
          label: day.label,
          spots: {
            create: day.spots.map((spot: any, spotIndex: number) => ({
              name: spot.name,
              address: spot.address,
              lng: spot.lng,
              lat: spot.lat,
              orderIndex: spotIndex,
              tags: spot.tags
            }))
          }
        }))
      }
    },
    include: { tripDays: { include: { spots: true } } }
  })
  
  res.status(201).json(trip)
})

router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  const trip = await prisma.tripPlan.findUnique({
    where: { id: req.params.id },
    include: {
      tripDays: { include: { spots: true } },
      user: { select: { id: true, username: true, nickname: true, avatarUrl: true } }
    }
  })
  
  if (!trip) {
    return res.status(404).json({ error: '行程不存在' })
  }
  
  // 如果不是自己的行程，必须是已发布的才能查看
  if (trip.userId !== req.user!.id && !trip.published) {
    return res.status(404).json({ error: '行程不存在' })
  }
  
  res.json(trip)
})

router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  const { name, destination, startDate, endDate, tripDays } = req.body
  const tripId = req.params.id

  const existing = await prisma.tripPlan.findUnique({ where: { id: tripId } })
  if (!existing || existing.userId !== req.user!.id) {
    return res.status(404).json({ error: '行程不存在' })
  }

  // 删除所有旧的 tripDays（spots 通过级联删除）
  await prisma.tripDay.deleteMany({ where: { tripPlanId: tripId } })

  const trip = await prisma.tripPlan.update({
    where: { id: tripId },
    data: {
      name,
      destination,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      updatedAt: new Date(),
      tripDays: {
        create: (tripDays || []).map((day: any, index: number) => ({
          dayIndex: index,
          date: new Date(day.date),
          label: day.label,
          spots: {
            create: (day.spots || []).map((spot: any, spotIndex: number) => ({
              name: spot.name,
              address: spot.address,
              lng: spot.lng,
              lat: spot.lat,
              orderIndex: spotIndex,
              tags: spot.tags || []
            }))
          }
        }))
      }
    },
    include: { tripDays: { include: { spots: true } } }
  })

  res.json(trip)
})

router.post('/:id/publish', authenticate, async (req: AuthRequest, res) => {
  const trip = await prisma.tripPlan.update({
    where: { id: req.params.id, userId: req.user!.id },
    data: { published: true } as any,
    include: { tripDays: { include: { spots: true } } }
  })
  
  res.json(trip)
})

router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  await prisma.tripPlan.delete({
    where: { id: req.params.id, userId: req.user!.id }
  })
  res.json({ message: '删除成功' })
})

export default router
