import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, MapPin, Heart, User, CalendarDays, Clock3, ArrowRight, X } from 'lucide-react'
import { Header } from '../../components/Header/Header'
import { TabBar } from '../../components/TabBar/TabBar'
import { motion, AnimatePresence } from 'framer-motion'

const SERVER_BASE_URL = 'http://localhost:3000'

interface PostItem {
  id: string
  type: 'post'
  title: string
  image: string
  category: string
  location: string
  likes: number
  comments: number
  description: string
  authorName: string
  authorAvatar: string
  authorId: string
  createdAt: string
}

interface TripItem {
  id: string
  type: 'trip'
  name: string
  destination: string
  startDate: string
  endDate: string
  days: number
  spots: number
  likes: number
  authorName: string
  authorAvatar: string
  authorId: string
  createdAt: string
}

interface UserItem {
  id: string
  type: 'user'
  nickname: string
  avatar: string
  bio: string
  followers: number
  posts: number
}

interface Comment {
  id: string
  userId: string
  username: string
  nickname?: string
  content: string
  avatarUrl?: string
  likesCount: number
  createdAt: string
}

type SearchItem = PostItem | TripItem | UserItem

export function SearchResultPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [results, setResults] = useState<SearchItem[]>([])
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)
  const [loading, setLoading] = useState(true)
  
  // 帖子详情模态框相关状态
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>({})
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const searchKeyword = searchParams.get('q') || '成都'
    setKeyword(searchKeyword)
    fetchSearchResults(searchKeyword)
  }, [location.search])

  const fetchSearchResults = async (searchKeyword: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${SERVER_BASE_URL}/api/search/all?q=${encodeURIComponent(searchKeyword)}`)
      const data = await response.json()

      if (data.code === 200 && data.data) {
        const posts: SearchItem[] = (data.data.posts || []).map((item: any) => ({
          ...item,
          type: 'post' as const
        }))
        const trips: SearchItem[] = (data.data.trips || []).map((item: any) => ({
          ...item,
          type: 'trip' as const
        }))
        const users: SearchItem[] = (data.data.users || []).map((item: any) => ({
          ...item,
          type: 'user' as const
        }))

        setResults([...posts, ...trips, ...users])
      }
    } catch (error) {
      console.error('搜索失败:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const getBackgroundImage = () => {
    return `${SERVER_BASE_URL}/CityView/${keyword}.jpg`
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement
    target.src = `${SERVER_BASE_URL}/CityView/上海.jpg`
  }

  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + 'w'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toString()
  }

  const filteredResults = activeCategory === 'all'
    ? results
    : results.filter(item => item.type === activeCategory)

  const categoryCounts = {
    all: results.length,
    post: results.filter(r => r.type === 'post').length,
    trip: results.filter(r => r.type === 'trip').length,
    user: results.filter(r => r.type === 'user').length
  }

  const categories = [
    { key: 'all', label: '全部', count: categoryCounts.all },
    { key: 'post', label: '帖子', count: categoryCounts.post },
    { key: 'trip', label: '行程', count: categoryCounts.trip },
    { key: 'user', label: '用户', count: categoryCounts.user }
  ]

  const handlePostClick = useCallback(async (post: PostItem) => {
    setSelectedPost(post)
    setCurrentImageIndex(0)
    
    try {
      const response = await fetch(`${SERVER_BASE_URL}/api/posts/${post.id}`)
      const data = await response.json()
      
      if (data.code === 200 && data.data.comments) {
        setPostComments(prev => ({
          ...prev,
          [post.id]: data.data.comments
        }))
      }
    } catch (error) {
      console.error('获取帖子详情失败:', error)
    }
  }, [])

  const handleClosePostModal = useCallback(() => {
    setSelectedPost(null)
  }, [])

  const handleLike = useCallback(async () => {
    if (!selectedPost) return
    
    const token = localStorage.getItem('token')
    if (!token) {
      alert('请先登录')
      return
    }
    
    const isLiked = likedPosts.has(selectedPost.id)
    
    try {
      const response = await fetch(`${SERVER_BASE_URL}/api/posts/${selectedPost.id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ like: !isLiked })
      })
      
      const data = await response.json()
      if (data.code === 200) {
        setLikedPosts(prev => {
          const newSet = new Set(prev)
          if (isLiked) {
            newSet.delete(selectedPost.id)
          } else {
            newSet.add(selectedPost.id)
          }
          return newSet
        })
      }
    } catch (error) {
      console.error('点赞失败:', error)
    }
  }, [selectedPost, likedPosts])

  const handleUserClick = (user: UserItem) => {
    navigate(`/profile?userId=${user.id}`)
  }

  const getAllImages = (post: PostItem | null): string[] => {
    if (!post) return []
    
    let imagesArray: string[] = []
    
    if (post.image) {
      imagesArray = [post.image]
    }
    
    return imagesArray.map(img => 
      img.startsWith('http') ? img : `${SERVER_BASE_URL}${img}`
    )
  }

  const renderPostCard = (item: PostItem) => (
    <div
      key={item.id}
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 cursor-pointer hover:border-[#0F9AFF]/30"
      onClick={() => handlePostClick(item)}
    >
      <div className="flex items-start gap-3">
        {/* 作者头像 */}
        <div className="flex-shrink-0">
          <img
            src={item.authorAvatar ? `${SERVER_BASE_URL}${item.authorAvatar}` : undefined}
            alt={item.authorName}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              target.nextElementSibling?.classList.remove('hidden')
            }}
          />
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] flex items-center justify-center hidden">
            <User className="h-5 w-5 text-white" />
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 min-w-0">
          {/* 顶部信息 */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-900">{item.authorName}</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs">
              {item.category || '攻略'}
            </span>
          </div>

          {/* 标题 */}
          <h3 className="text-base font-semibold text-gray-900 line-clamp-2 mb-1 hover:text-[#0F9AFF] transition-colors">
            {item.title}
          </h3>

          {/* 描述 */}
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">
            {item.description}
          </p>

          {/* 底部信息 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin className="h-3 w-3" />
              <span>{item.location}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {formatNumber(item.likes)}
              </span>
              <span>{formatNumber(item.comments)} 评论</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTripCard = (item: TripItem) => (
    <div
      key={item.id}
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 cursor-pointer hover:border-[#0F9AFF]/30"
      onClick={() => {
        navigate('/trip-planner', { state: { tripId: item.id } })
      }}
    >
      <div className="flex items-start gap-3">
        {/* 作者头像 */}
        <div className="flex-shrink-0">
          <img
            src={item.authorAvatar ? `${SERVER_BASE_URL}${item.authorAvatar}` : undefined}
            alt={item.authorName}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              target.nextElementSibling?.classList.remove('hidden')
            }}
          />
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] flex items-center justify-center hidden">
            <User className="h-5 w-5 text-white" />
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 min-w-0">
          {/* 顶部信息 */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-900">{item.authorName}</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-xs">
              <MapPin className="h-3 w-3" />
              {item.destination}
            </span>
          </div>

          {/* 行程名称 */}
          <h3 className="text-base font-semibold text-gray-900 mb-2 hover:text-[#0F9AFF] transition-colors">
            {item.name}
          </h3>

          {/* 行程信息 */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <CalendarDays className="h-3 w-3" />
              {item.startDate ? item.startDate.split('T')[0] : ''} ~ {item.endDate ? item.endDate.split('T')[0] : ''}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <Clock3 className="h-3 w-3" />
              共 {item.days} 天
            </span>
            {item.spots > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="h-3 w-3" />
                {item.spots} 个景点
              </span>
            )}
          </div>

          {/* 底部信息 */}
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Heart className="h-3 w-3" />
            <span>{formatNumber(item.likes)} 收藏</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderUserCard = (item: UserItem) => (
    <div
      key={item.id}
      className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 cursor-pointer hover:border-[#0F9AFF]/30 flex items-center gap-3"
      onClick={() => handleUserClick(item)}
    >
      {/* 头像 */}
      <div className="flex-shrink-0">
        <img
          src={item.avatar ? `${SERVER_BASE_URL}${item.avatar}` : undefined}
          alt={item.nickname}
          className="w-12 h-12 rounded-full bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            target.nextElementSibling?.classList.remove('hidden')
          }}
        />
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] flex items-center justify-center hidden">
          <User className="h-6 w-6 text-white" />
        </div>
      </div>

      {/* 昵称 */}
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold text-gray-900 hover:text-[#0F9AFF] transition-colors truncate">
          {item.nickname}
        </h3>
        <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
          <span>{formatNumber(item.followers)} 粉丝</span>
          <span>{item.posts} 帖子</span>
        </div>
      </div>

      <ArrowRight className="h-5 w-5 text-gray-300 flex-shrink-0" />
    </div>
  )

  const renderCard = (item: SearchItem) => {
    if (item.type === 'post') return renderPostCard(item)
    if (item.type === 'trip') return renderTripCard(item)
    if (item.type === 'user') return renderUserCard(item)
    return null
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] pb-20">
      <Header showSearch={true} searchQuery={keyword} />

      {/* 顶部大图区域 */}
      <div className="relative h-[420px] overflow-hidden">
        <img
          src={getBackgroundImage()}
          alt={keyword}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
        {/* 渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

        <div className="absolute inset-0 p-6 flex flex-col justify-end">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-sm mb-3">
              <Search className="h-4 w-4" />
              <span>搜索 "{keyword}"</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
              {keyword}
            </h1>
            <p className="text-white/80 text-base">
              共找到 <span className="font-semibold text-white">{results.length}</span> 条相关内容
            </p>
          </div>
        </div>
      </div>

      {/* 分类标签 */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-100/50">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map(category => (
              <button
                key={category.key}
                onClick={() => setActiveCategory(category.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === category.key
                    ? 'bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] text-white shadow-lg shadow-[#0F9AFF]/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category.label}
                {category.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeCategory === category.key ? 'bg-white/20' : 'bg-white'
                  }`}>
                    {category.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 搜索结果 */}
      <main className="mx-auto max-w-3xl px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white/50 rounded-xl">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-[#0F9AFF] border-t-transparent"></div>
            <p className="text-gray-500 mt-3">搜索中...</p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white/50 rounded-xl">
            <Search className="h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-600 mb-1">未找到相关内容</h3>
            <p className="text-sm text-gray-400">试试其他关键词吧</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredResults.map(renderCard)}
          </div>
        )}
      </main>

      {/* 用户详情弹窗 */}
      <AnimatePresence>
        {selectedUser && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
            />
            <motion.div
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[420px] bg-white rounded-2xl overflow-hidden z-50 shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-32 bg-gradient-to-r from-[#0F9AFF] to-[#0010B3]">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="relative px-6 pb-6">
                <div className="absolute -top-12 left-6">
                  <img
                    src={selectedUser.avatar ? `${SERVER_BASE_URL}${selectedUser.avatar}` : undefined}
                    alt={selectedUser.nickname}
                    className="w-20 h-20 rounded-full bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] border-4 border-white shadow-lg object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      target.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] border-4 border-white shadow-lg flex items-center justify-center hidden">
                    <User className="h-10 w-10 text-white" />
                  </div>
                </div>
                <div className="pt-12">
                  <h3 className="text-2xl font-bold text-gray-900 text-center">{selectedUser.nickname}</h3>
                  <p className="text-gray-500 text-center mt-2">{selectedUser.bio}</p>
                  <div className="flex items-center justify-center gap-8 mt-6">
                    <div className="text-center">
                      <p className="text-xl font-bold text-gray-900">{formatNumber(selectedUser.followers)}</p>
                      <p className="text-xs text-gray-400">粉丝</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-gray-900">{selectedUser.posts}</p>
                      <p className="text-xs text-gray-400">帖子</p>
                    </div>
                  </div>
                  <button className="w-full mt-6 py-3 bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] text-white rounded-xl font-medium hover:shadow-lg transition-all">
                    关注
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 帖子详情弹窗 */}
      <AnimatePresence>
        {selectedPost && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClosePostModal}
            />
            <motion.div
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[1200px] max-h-[90vh] bg-white rounded-2xl overflow-hidden z-[200] shadow-[0_25px_80px_rgba(0,0,0,0.3)]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.button
                className="modal-close absolute top-5 left-5 w-12 h-12 bg-[rgba(15,154,255,0.25)] backdrop-blur-[20px] border border-[rgba(15,154,255,0.3)] rounded-full text-[#0F9AFF] flex items-center justify-center z-[300] transition-all duration-300 hover:bg-[rgba(15,154,255,0.4)] hover:border-[rgba(15,154,255,0.5)] hover:scale-105"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleClosePostModal();
                }}
              >
                <X className="h-5 w-5" />
              </motion.button>

              <div className="modal-content flex h-[90vh]">
                <div className="modal-left w-3/5 h-full bg-gray-900 relative">
                  <div className="image-carousel w-full h-full relative">
                    <div className="carousel-track w-full h-full">
                      {getAllImages(selectedPost).map((imageUrl, index) => (
                        <motion.div
                          key={index}
                          className="carousel-item absolute inset-0"
                          animate={{ 
                            opacity: currentImageIndex === index ? 1 : 0,
                            x: currentImageIndex === index ? 0 : (index > currentImageIndex ? 100 : -100)
                          }}
                          transition={{ duration: 0.3 }}
                          style={{ 
                            background: imageUrl
                              ? `url(${imageUrl})`
                              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                        />
                      ))}
                    </div>
                    <span className="image-number text-white/60 text-sm font-medium absolute top-5 right-5">
                      {currentImageIndex + 1}/{getAllImages(selectedPost).length}
                    </span>
                    {/* 下载原图按钮 - 鼠标悬停时显示 */}
                    <motion.div 
                      className="download-btn absolute top-5 right-20 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer z-20"
                      style={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      onClick={() => {
                        const images = getAllImages(selectedPost);
                        if (images[currentImageIndex]) {
                          const link = document.createElement('a');
                          link.href = images[currentImageIndex];
                          link.download = `post-image-${currentImageIndex + 1}.jpg`;
                          link.target = '_blank';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    </motion.div>
                  </div>
                </div>

                <div className="modal-right w-2/5 h-full flex flex-col overflow-hidden">
                  <div className="post-header px-5 py-5 flex justify-between items-center border-b border-gray-100">
                    <div className="post-author flex items-center gap-3">
                      <img
                        src={selectedPost.authorAvatar ? `${SERVER_BASE_URL}${selectedPost.authorAvatar}` : undefined}
                        alt={selectedPost.authorName}
                        className="w-12 h-12 rounded-full bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = ''
                          target.style.background = 'linear-gradient(to-r, #0F9AFF, #0010B3)'
                        }}
                      />
                      <div className="author-info flex flex-col">
                        <span className="author-name-lg text-sm font-semibold text-gray-800">
                          {selectedPost.authorName}
                        </span>
                        <span className="author-location text-xs text-gray-400 mt-0.5">
                          {selectedPost.location || '未知地点'}
                        </span>
                      </div>
                    </div>
                    <button className="follow-btn-lg px-6 py-2 bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] text-white border-none rounded-[24px] text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-[0_4px_16px_rgba(15,154,255,0.4)]">
                      关注
                    </button>
                  </div>

                  <div className="post-body flex-1 overflow-y-auto px-5 py-5">
                    <div className="post-content mb-5">
                      <p className="text-base font-semibold text-gray-800 mb-3 leading-relaxed">{selectedPost.title}</p>
                      <p className="post-text text-sm text-gray-500 leading-relaxed mb-4">{selectedPost.description}</p>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs mb-3">
                        {selectedPost.category || '攻略'}
                      </span>
                      <span className="post-time text-xs text-gray-400">
                        {new Date(selectedPost.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>

                    <div className="post-stats mb-5 pb-4 border-b border-gray-100">
                      <span className="stat-item text-sm text-gray-400">共 {(postComments[selectedPost.id] || []).length} 条评论</span>
                    </div>

                    <div className="comments-section flex flex-col gap-5">
                      {(postComments[selectedPost.id] || []).map((comment) => (
                        <div key={comment.id} className="comment flex flex-col gap-2">
                          <div className="comment-author flex items-center gap-2">
                            <img
                              src={comment.avatarUrl ? `${SERVER_BASE_URL}${comment.avatarUrl}` : undefined}
                              alt={comment.username}
                              className="w-8 h-8 rounded-full bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = ''
                                target.style.background = 'linear-gradient(to-r, #0F9AFF, #0010B3)'
                              }}
                            />
                            <span className="comment-name text-xs font-semibold text-gray-800">
                              {comment.nickname || comment.username}
                            </span>
                          </div>
                          <p className="comment-text text-sm text-gray-800 leading-relaxed ml-10">{comment.content}</p>
                          <div className="comment-actions flex gap-4 ml-10">
                            <button 
                              className="comment-action text-xs text-gray-500 hover:text-[#0F9AFF] transition-colors"
                            >
                              回复
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="post-actions-bar px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-4">
                    <div className="comment-input-container flex-1 flex gap-2.5">
                      <input
                        type="text"
                        className="comment-input flex-1 px-4 py-2.5 bg-gray-50 border-none rounded-[20px] text-sm outline-none transition-all duration-300 focus:bg-white focus:shadow-[0_0_0_2px_rgba(15,154,255,0.2)] placeholder:text-gray-400"
                        placeholder="写下你的评论..."
                      />
                      <button
                        className="comment-submit w-10 h-10 bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] text-white border-none rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-[0_4px_16px_rgba(15,154,255,0.4)]"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="22" y1="2" x2="11" y2="13"/>
                          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                        </svg>
                      </button>
                    </div>

                    <div className="action-icons flex items-center gap-5">
                      <button 
                        className={`action-icon-btn flex flex-col items-center gap-1 bg-none border-none transition-all duration-200 hover:scale-105 ${likedPosts.has(selectedPost.id) ? 'text-red-500' : 'text-gray-500 hover:text-red-400'}`}
                        onClick={handleLike}
                      >
                        <Heart className={`h-5 w-5 ${likedPosts.has(selectedPost.id) ? 'fill-current' : ''}`} />
                        <span className="text-xs text-gray-400">{selectedPost.likes}</span>
                      </button>
                      <button className="action-icon-btn flex flex-col items-center gap-1 bg-none border-none text-gray-500 transition-all duration-200 hover:scale-105 hover:text-[#0F9AFF]">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        <span className="text-xs text-gray-400">{(postComments[selectedPost.id] || []).length}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* TabBar 毛玻璃效果 */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-t border-gray-100/50" />
        <TabBar />
      </div>
    </div>
  )
}
