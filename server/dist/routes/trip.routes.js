"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const client_1 = __importDefault(require("../prisma/client"));
const router = express_1.default.Router();
router.get('/', auth_middleware_1.authenticate, async (req, res) => {
    const { published } = req.query;
    const where = { userId: req.user.id };
    if (published !== undefined) {
        where.published = published === 'true';
    }
    const trips = await client_1.default.tripPlan.findMany({
        where,
        include: { tripDays: { include: { spots: true } } },
        orderBy: { createdAt: 'desc' }
    });
    res.json(trips);
});
router.get('/published', auth_middleware_1.authenticate, async (req, res) => {
    const trips = await client_1.default.tripPlan.findMany({
        where: { published: true },
        include: {
            tripDays: { include: { spots: true } },
            user: { select: { id: true, username: true, nickname: true, avatarUrl: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
    res.json(trips);
});
router.post('/', auth_middleware_1.authenticate, async (req, res) => {
    const { name, destination, startDate, endDate, tripDays } = req.body;
    const trip = await client_1.default.tripPlan.create({
        data: {
            name,
            destination,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            userId: req.user.id,
            tripDays: {
                create: tripDays.map((day, index) => ({
                    dayIndex: index,
                    date: new Date(day.date),
                    label: day.label,
                    spots: {
                        create: day.spots.map((spot, spotIndex) => ({
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
    });
    res.status(201).json(trip);
});
router.get('/:id', auth_middleware_1.authenticate, async (req, res) => {
    const trip = await client_1.default.tripPlan.findUnique({
        where: { id: req.params.id },
        include: {
            tripDays: { include: { spots: true } },
            user: { select: { id: true, username: true, nickname: true, avatarUrl: true } }
        }
    });
    if (!trip) {
        return res.status(404).json({ error: '行程不存在' });
    }
    // 如果不是自己的行程，必须是已发布的才能查看
    if (trip.userId !== req.user.id && !trip.published) {
        return res.status(404).json({ error: '行程不存在' });
    }
    res.json(trip);
});
router.put('/:id', auth_middleware_1.authenticate, async (req, res) => {
    const { name, destination, startDate, endDate, tripDays } = req.body;
    const tripId = req.params.id;
    const existing = await client_1.default.tripPlan.findUnique({ where: { id: tripId } });
    if (!existing || existing.userId !== req.user.id) {
        return res.status(404).json({ error: '行程不存在' });
    }
    // 删除所有旧的 tripDays（spots 通过级联删除）
    await client_1.default.tripDay.deleteMany({ where: { tripPlanId: tripId } });
    const trip = await client_1.default.tripPlan.update({
        where: { id: tripId },
        data: {
            name,
            destination,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            updatedAt: new Date(),
            tripDays: {
                create: (tripDays || []).map((day, index) => ({
                    dayIndex: index,
                    date: new Date(day.date),
                    label: day.label,
                    spots: {
                        create: (day.spots || []).map((spot, spotIndex) => ({
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
    });
    res.json(trip);
});
router.post('/:id/publish', auth_middleware_1.authenticate, async (req, res) => {
    const trip = await client_1.default.tripPlan.update({
        where: { id: req.params.id, userId: req.user.id },
        data: { published: true },
        include: { tripDays: { include: { spots: true } } }
    });
    res.json(trip);
});
router.delete('/:id', auth_middleware_1.authenticate, async (req, res) => {
    await client_1.default.tripPlan.delete({
        where: { id: req.params.id, userId: req.user.id }
    });
    res.json({ message: '删除成功' });
});
exports.default = router;
