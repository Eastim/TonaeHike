import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import sharp from 'sharp'
import { authenticate, AuthRequest } from '../middleware/auth.middleware'
import { createPost, getPosts, getPostById, deletePost, getPostsByUserId, updatePostImages } from '../services/post.service'
import prisma from '../prisma/client'

const router = express.Router()

// 确保帖子图片根目录存在
const postImagesDir = path.join(__dirname, '../../public/posts')
if (!fs.existsSync(postImagesDir)) {
  fs.mkdirSync(postImagesDir, { recursive: true })
}

// 创建帖子（两步：先创建帖子记录，再上传图片）
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        msg: '未授权'
      })
    }

    const { title, content, category, destination, tags } = req.body
    
    if (!title || !content) {
      return res.status(400).json({
        code: 400,
        msg: '标题和内容不能为空'
      })
    }

    // 处理标签
    const tagsArray = typeof tags === 'string' ? JSON.parse(tags) : (tags || [])

    const post = await createPost({
      userId: req.user.id,
      title,
      content,
      category,
      destination,
      coverImage: undefined,
      images: [],
      tags: tagsArray
    })

    res.json({
      code: 200,
      msg: '发布成功',
      data: post
    })
  } catch (error: any) {
    console.error('创建帖子失败:', error)
    res.status(500).json({
      code: 500,
      msg: error.message || '发布失败'
    })
  }
})

// 上传帖子图片（每个帖子专属文件夹）
router.post('/:id/images', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        msg: '未授权'
      })
    }

    const { id: postId } = req.params

    // 创建帖子专属文件夹
    const postDir = path.join(postImagesDir, postId)
    if (!fs.existsSync(postDir)) {
      fs.mkdirSync(postDir, { recursive: true })
    }

    // 配置 multer 存储到帖子专属文件夹
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, postDir)
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname)
        const filename = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}${ext}`
        cb(null, filename)
      }
    })

    const upload = multer({
      storage,
      limits: {
        fileSize: 30 * 1024 * 1024 // 30MB
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true)
        } else {
          cb(new Error('只支持JPG、PNG、WebP格式的图片'))
        }
      }
    })

    // 使用 Promise 包装 multer 中间件
    const files = await new Promise<Express.Multer.File[]>((resolve, reject) => {
      upload.array('images', 10)(req as any, res as any, (err: any) => {
        if (err) {
          reject(err)
        } else {
          resolve((req as any).files || [])
        }
      })
    })

    const images: string[] = []
    let coverImage: string | undefined

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext = path.extname(file.originalname)
      const filePath = path.join(postDir, file.filename)
      
      // 生成缩略图（用于首页展示）
      const thumbnailFilename = `thumb_${file.filename}`
      const thumbnailPath = path.join(postDir, thumbnailFilename)
      
      try {
        await sharp(filePath)
          .resize(400, 400, { 
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 70 })
          .toFile(thumbnailPath)
      } catch (sharpError) {
        console.error('生成缩略图失败:', sharpError)
        // 如果缩略图生成失败，复制原图作为缩略图
        fs.copyFileSync(filePath, thumbnailPath)
      }
      
      if (i === 0) {
        // 第一张图片作为封面，重命名为 cover
        const coverFilename = `cover${ext}`
        const thumbCoverFilename = `thumb_cover${ext}`
        const oldPath = filePath
        const oldThumbPath = thumbnailPath
        const newPath = path.join(postDir, coverFilename)
        const newThumbPath = path.join(postDir, thumbCoverFilename)
        
        fs.renameSync(oldPath, newPath)
        fs.renameSync(oldThumbPath, newThumbPath)
        
        coverImage = `/posts/${postId}/${coverFilename}`
        images.push(coverImage)
      } else {
        // 其他图片保持原文件名
        images.push(`/posts/${postId}/${file.filename}`)
      }
    }

    // 更新帖子记录
    const updatedPost = await updatePostImages(postId, coverImage, images)

    res.json({
      code: 200,
      msg: '图片上传成功',
      data: {
        images,
        coverImage,
        post: updatedPost
      }
    })
  } catch (error: any) {
    console.error('上传图片失败:', error)
    res.status(500).json({
      code: 500,
      msg: error.message || '上传失败'
    })
  }
})

// 获取帖子列表
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10

    const posts = await getPosts(page, pageSize)

    res.json({
      code: 200,
      msg: '获取成功',
      data: posts
    })
  } catch (error: any) {
    console.error('获取帖子列表失败:', error)
    res.status(500).json({
      code: 500,
      msg: error.message || '获取失败'
    })
  }
})

// 获取单篇帖子
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const post = await getPostById(id)

    if (!post) {
      return res.status(404).json({
        code: 404,
        msg: '帖子不存在'
      })
    }

    res.json({
      code: 200,
      msg: '获取成功',
      data: post
    })
  } catch (error: any) {
    console.error('获取帖子失败:', error)
    res.status(500).json({
      code: 500,
      msg: error.message || '获取失败'
    })
  }
})

// 删除帖子
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        msg: '未授权'
      })
    }

    const { id } = req.params

    const result = await deletePost(id, req.user.id)

    if (result.count === 0) {
      return res.status(404).json({
        code: 404,
        msg: '帖子不存在或无权删除'
      })
    }

    // 删除帖子专属文件夹
    const postDir = path.join(postImagesDir, id)
    if (fs.existsSync(postDir)) {
      fs.rmSync(postDir, { recursive: true, force: true })
    }

    res.json({
      code: 200,
      msg: '删除成功'
    })
  } catch (error: any) {
    console.error('删除帖子失败:', error)
    res.status(500).json({
      code: 500,
      msg: error.message || '删除失败'
    })
  }
})

// 点赞/取消点赞
router.post('/:id/like', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        msg: '未授权'
      })
    }

    const { id } = req.params
    const { like } = req.body

    const post = await prisma.post.findUnique({
      where: { id }
    })

    if (!post) {
      return res.status(404).json({
        code: 404,
        msg: '帖子不存在'
      })
    }

    // 更新点赞数
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        likesCount: like ? { increment: 1 } : { decrement: 1 }
      }
    })

    res.json({
      code: 200,
      msg: like ? '点赞成功' : '取消点赞成功',
      data: {
        likesCount: updatedPost.likesCount
      }
    })
  } catch (error: any) {
    console.error('点赞失败:', error)
    res.status(500).json({
      code: 500,
      msg: error.message || '点赞失败'
    })
  }
})

// 获取用户的帖子
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10

    const posts = await getPostsByUserId(userId, page, pageSize)

    res.json({
      code: 200,
      msg: '获取成功',
      data: posts
    })
  } catch (error: any) {
    console.error('获取用户帖子失败:', error)
    res.status(500).json({
      code: 500,
      msg: error.message || '获取失败'
    })
  }
})

export default router
