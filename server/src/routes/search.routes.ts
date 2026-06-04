import express from 'express'
import prisma from '../prisma/client'

const router = express.Router()

// 全局搜索接口
router.get('/all', async (req, res) => {
  try {
    const { q, type } = req.query
    const keyword = q as string

    if (!keyword) {
      return res.json({
        code: 200,
        msg: '请提供搜索关键词',
        data: { posts: [], trips: [], users: [] }
      })
    }

    const results: any = {
      posts: [],
      trips: [],
      users: []
    }

    // 搜索帖子（不限制登录）
    if (!type || type === 'post' || type === 'all') {
      const posts = await prisma.post.findMany({
        where: {
          OR: [
            { title: { contains: keyword } },
            { content: { contains: keyword } },
            { destination: { contains: keyword } },
            { category: { contains: keyword } }
          ]
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              nickname: true,
              avatarUrl: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      })
      results.posts = posts.map((post: any) => ({
        id: post.id,
        type: 'post',
        title: post.title,
        content: post.content,
        image: post.coverImage || (post.images && post.images.length > 0 ? post.images[0] : ''),
        category: post.category,
        destination: post.destination,
        location: post.destination,
        likes: post.likesCount || 0,
        comments: post.commentsCount || 0,
        description: post.content.substring(0, 100),
        authorId: post.userId,
        authorName: post.user?.nickname || post.user?.username || '未知用户',
        authorAvatar: post.user?.avatarUrl || '/avatar/default.png',
        createdAt: post.createdAt
      }))
    }

    // 搜索行程（不限制登录）
    if (!type || type === 'trip' || type === 'all') {
      const trips = await prisma.tripPlan.findMany({
        where: {
          OR: [
            { name: { contains: keyword } },
            { destination: { contains: keyword } }
          ]
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              nickname: true,
              avatarUrl: true
            }
          },
          tripDays: {
            include: {
              spots: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
      results.trips = trips.map((trip: any) => ({
        id: trip.id,
        type: 'trip',
        name: trip.name,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        days: trip.tripDays.length,
        spots: trip.tripDays.reduce((sum: number, day: any) => sum + (day.spots?.length || 0), 0),
        likes: 0,
        authorId: trip.userId,
        authorName: trip.user?.nickname || trip.user?.username || '未知用户',
        authorAvatar: trip.user?.avatarUrl || '/avatar/default.png',
        createdAt: trip.createdAt
      }))
    }

    // 搜索用户（不限制登录）
    if (!type || type === 'user' || type === 'all') {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: keyword } },
            { nickname: { contains: keyword } },
            { bio: { contains: keyword } }
          ]
        },
        select: {
          id: true,
          username: true,
          nickname: true,
          avatarUrl: true,
          bio: true,
          _count: {
            select: {
              posts: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })

      // 获取粉丝数（暂时忽略，follows表未创建）
      results.users = users.map((user: any) => ({
        id: user.id,
        type: 'user',
        nickname: user.nickname || user.username,
        avatar: user.avatarUrl || '/avatar/default.png',
        bio: user.bio || '',
        followers: 0,
        posts: user._count.posts
      }))
    }

    res.json({
      code: 200,
      msg: '搜索成功',
      data: results
    })
  } catch (error: any) {
    console.error('搜索失败:', error)
    res.status(500).json({
      code: 500,
      msg: error.message || '搜索失败'
    })
  }
})

// 搜索帖子
router.get('/posts', async (req, res) => {
  try {
    const { q } = req.query
    const keyword = q as string

    if (!keyword) {
      return res.json({
        code: 200,
        msg: '请提供搜索关键词',
        data: []
      })
    }

    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { title: { contains: keyword } },
          { content: { contains: keyword } },
          { destination: { contains: keyword } },
          { category: { contains: keyword } }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    res.json({
      code: 200,
      msg: '搜索成功',
      data: posts
    })
  } catch (error: any) {
    console.error('搜索帖子失败:', error)
    res.status(500).json({
      code: 500,
      msg: error.message || '搜索失败'
    })
  }
})

// 搜索行程
router.get('/trips', async (req, res) => {
  try {
    const { q } = req.query
    const keyword = q as string

    if (!keyword) {
      return res.json({
        code: 200,
        msg: '请提供搜索关键词',
        data: []
      })
    }

    const trips = await prisma.tripPlan.findMany({
      where: {
        OR: [
          { name: { contains: keyword } },
          { destination: { contains: keyword } }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatarUrl: true
          }
        },
        tripDays: {
          include: {
            spots: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    res.json({
      code: 200,
      msg: '搜索成功',
      data: trips
    })
  } catch (error: any) {
    console.error('搜索行程失败:', error)
    res.status(500).json({
      code: 500,
      msg: error.message || '搜索失败'
    })
  }
})

// 搜索用户
router.get('/users', async (req, res) => {
  try {
    const { q } = req.query
    const keyword = q as string

    if (!keyword) {
      return res.json({
        code: 200,
        msg: '请提供搜索关键词',
        data: []
      })
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: keyword } },
          { nickname: { contains: keyword } },
          { bio: { contains: keyword } }
        ]
      },
      select: {
        id: true,
        username: true,
        nickname: true,
        avatarUrl: true,
        bio: true,
        _count: {
          select: {
            posts: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // 获取粉丝数（暂时忽略，follows表未创建）
    const usersWithFollowers = users.map((user: any) => ({
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatarUrl || '/avatar/default.png',
      bio: user.bio,
      followers: 0,
      posts: user._count.posts
    }))

    res.json({
      code: 200,
      msg: '搜索成功',
      data: usersWithFollowers
    })
  } catch (error: any) {
    console.error('搜索用户失败:', error)
    res.status(500).json({
      code: 500,
      msg: error.message || '搜索失败'
    })
  }
})

export default router
