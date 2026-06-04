import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.routes'
import tripRoutes from './routes/trip.routes'
import postRoutes from './routes/post.routes'
import verificationRoutes from './routes/verification.routes'
import userRoutes from './routes/user.routes'
import commentRoutes from './routes/comment.routes'
import searchRoutes from './routes/search.routes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  next()
})

// 静态文件服务（头像、帖子图片、城市图片等）
app.use('/avatar', express.static('public/avatar'))
app.use('/posts', express.static('public/posts'))
app.use('/CityView', express.static('public/CityView'))
// 添加视频和图片资源服务
app.use('/assset', express.static('public/assset'))
app.use('/img', express.static('public/img'))

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/trips', tripRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/comments', commentRoutes)
app.use('/api/search', searchRoutes)
app.use('/getcode', verificationRoutes)

app.get('/', (req, res) => {
  res.send('TonaeHike Backend API')
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})