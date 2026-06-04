import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { authenticate, AuthRequest } from '../middleware/auth.middleware'
import { getUserById, updateUserAvatar, updateUserProfile } from '../services/auth.service'

const router = express.Router()

// 确保头像目录存在（从项目根目录开始计算）
const avatarDir = path.join(__dirname, '../../public/avatar')
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true })
}

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarDir)
  },
  filename: (req, file, cb) => {
    const userId = (req as AuthRequest).user?.id || 'unknown'
    const ext = path.extname(file.originalname)
    const filename = `${userId}_${Date.now()}${ext}`
    cb(null, filename)
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('只支持JPG、PNG格式的图片'))
    }
  }
})

// 获取当前用户信息
router.get('/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        msg: '未授权'
      })
    }

    const user = await getUserById(req.user.id)
    
    if (!user) {
      return res.status(404).json({
        code: 404,
        msg: '用户不存在'
      })
    }

    // 返回用户信息（不包含密码哈希）
    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatarUrl || '/avatar/default.png',
        nickname: user.nickname,
        gender: user.gender,
        birthday: user.birthday,
        phone: user.phone,
        bio: user.bio,
        created_at: user.createdAt,
        updated_at: user.updatedAt
      }
    })
  } catch (error) {
    console.error('获取用户信息失败:', error)
    res.status(500).json({
      code: 500,
      msg: '服务器错误'
    })
  }
})

// 上传头像
router.post('/avatar', authenticate, upload.single('avatar'), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        msg: '未授权'
      })
    }

    if (!req.file) {
      return res.status(400).json({
        code: 400,
        msg: '请选择图片文件'
      })
    }

    const avatarUrl = `/avatar/${req.file.filename}`
    
    // 更新数据库中的头像URL
    await updateUserAvatar(req.user.id, avatarUrl)

    res.json({
      code: 200,
      msg: '上传成功',
      data: {
        avatar_url: avatarUrl
      }
    })
  } catch (error: any) {
    console.error('上传头像失败:', error)
    res.status(500).json({
      code: 500,
      msg: error.message || '上传失败'
    })
  }
})

// 更新用户资料
router.put('/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        msg: '未授权'
      })
    }

    const { nickname, gender, birthday, phone, email, bio } = req.body

    const updateData: {
      nickname?: string
      gender?: string
      birthday?: Date | null
      phone?: string
      email?: string
      bio?: string
    } = {}

    if (nickname !== undefined) updateData.nickname = nickname || null
    if (gender !== undefined) updateData.gender = gender || null
    if (birthday !== undefined) updateData.birthday = birthday ? new Date(birthday) : null
    if (phone !== undefined) updateData.phone = phone || null
    if (email !== undefined) updateData.email = email
    if (bio !== undefined) updateData.bio = bio || null

    const updatedUser = await updateUserProfile(req.user.id, updateData)

    res.json({
      code: 200,
      msg: '更新成功',
      data: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        avatar_url: updatedUser.avatarUrl || '/avatar/default.png',
        nickname: updatedUser.nickname,
        gender: updatedUser.gender,
        birthday: updatedUser.birthday,
        phone: updatedUser.phone,
        bio: updatedUser.bio,
        created_at: updatedUser.createdAt,
        updated_at: updatedUser.updatedAt
      }
    })
  } catch (error: any) {
    console.error('更新用户资料失败:', error)
    res.status(500).json({
      code: 500,
      msg: error.message || '更新失败'
    })
  }
})

// 关注用户
router.post('/follow/:userId', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ code: 401, msg: '未授权' })
    }

    const targetUserId = req.params.userId
    const followerId = req.user.id

    if (followerId === targetUserId) {
      return res.status(400).json({ code: 400, msg: '不能关注自己' })
    }

    const prisma = (await import('../prisma/client')).default

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetUserId
        }
      }
    })

    if (existingFollow) {
      return res.status(400).json({ code: 400, msg: '已经关注过了' })
    }

    await prisma.follow.create({
      data: {
        followerId,
        followingId: targetUserId
      }
    })

    res.json({ code: 200, msg: '关注成功' })
  } catch (error) {
    console.error('关注失败:', error)
    res.status(500).json({ code: 500, msg: '服务器错误' })
  }
})

// 取消关注
router.delete('/follow/:userId', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ code: 401, msg: '未授权' })
    }

    const targetUserId = req.params.userId
    const followerId = req.user.id

    const prisma = (await import('../prisma/client')).default

    await prisma.follow.deleteMany({
      where: {
        followerId,
        followingId: targetUserId
      }
    })

    res.json({ code: 200, msg: '取消关注成功' })
  } catch (error) {
    console.error('取消关注失败:', error)
    res.status(500).json({ code: 500, msg: '服务器错误' })
  }
})

// 检查是否关注某用户
router.get('/follow/status/:userId', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ code: 401, msg: '未授权' })
    }

    const targetUserId = req.params.userId
    const followerId = req.user.id

    const prisma = (await import('../prisma/client')).default

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetUserId
        }
      }
    })

    res.json({ code: 200, data: { isFollowing: !!follow } })
  } catch (error) {
    console.error('检查关注状态失败:', error)
    res.status(500).json({ code: 500, msg: '服务器错误' })
  }
})

// 获取用户的粉丝数和关注数
router.get('/stats/:userId', authenticate, async (req: AuthRequest, res) => {
  try {
    const targetUserId = req.params.userId
    const prisma = (await import('../prisma/client')).default

    const [followersCount, followingCount] = await Promise.all([
      prisma.follow.count({ where: { followingId: targetUserId } }),
      prisma.follow.count({ where: { followerId: targetUserId } })
    ])

    res.json({
      code: 200,
      data: {
        followersCount,
        followingCount
      }
    })
  } catch (error) {
    console.error('获取用户统计失败:', error)
    res.status(500).json({ code: 500, msg: '服务器错误' })
  }
})

export default router