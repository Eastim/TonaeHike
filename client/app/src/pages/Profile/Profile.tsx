import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit3, Heart, Camera, X, Trash2 } from 'lucide-react'
import { Header } from '../../components/Header/Header'
import { TabBar } from '../../components/TabBar/TabBar'
import { ShowSuccessModal } from '../../components/showSuccessModal/showSuccessmodal'
import { PlanCard } from '../../components/PlanCard/PlanCard'
import { useTripStore } from '../../stores/tripStore'
import type { TripPlan } from '../../types'

interface UserInfo {
  id: string
  username: string
  email: string
  avatar_url: string
  nickname: string
  gender: string
  birthday: string
  phone: string
  bio: string
  created_at: string
  updated_at: string
}

interface Post {
  id: string
  title: string
  content: string
  coverImage?: string
  images?: string[]
  tags?: string[]
  likesCount: number
  commentsCount: number
  createdAt: string
  destination?: string
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


export function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'posts' | 'trips' | 'likes' | 'favorites'>('posts')
  const [showModal, setShowModal] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [formData, setFormData] = useState({
    nickname: '',
    gender: '',
    birthday: '',
    phone: '',
    email: '',
    bio: ''
  })
  const [posts, setPosts] = useState<Post[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  
  // 帖子展开相关状态
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>({})
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyInput, setReplyInput] = useState('')
  
  // 删除帖子相关状态
  const [deleteConfirmPost, setDeleteConfirmPost] = useState<Post | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  
  // 行程计划相关
  const [tripsLoading, setTripsLoading] = useState(false)
  const [trips, setTrips] = useState<TripPlan[]>([])
  const [deleteConfirmPlan, setDeleteConfirmPlan] = useState<TripPlan | null>(null)
  
  const navigate = useNavigate()
  const API_BASE_URL = 'http://localhost:3000'

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    // 验证文件大小（2MB）
    if (file.size > 2 * 1024 * 1024) {
      alert('图片大小不能超过2MB')
      return
    }

    setUploading(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch(`${API_BASE_URL}/api/users/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const data = await response.json()

      if (data.code === 200) {
        // 更新用户信息和头像URL（添加时间戳避免缓存）
        const avatarUrlWithTimestamp = `${data.data.avatar_url}?t=${Date.now()}`
        const newUserInfo = { ...userInfo!, avatar_url: avatarUrlWithTimestamp }
        setUserInfo(newUserInfo)
        localStorage.setItem('userInfo', JSON.stringify(newUserInfo))
        // 强制刷新Header组件
        window.dispatchEvent(new Event('userInfoUpdated'))
        setTimeout(() => {
          window.dispatchEvent(new Event('userInfoUpdated'))
        }, 100)
        setShowSuccessModal(true)
        setTimeout(() => setShowSuccessModal(false), 1500)
      } else {
        alert(data.msg || '上传失败')
      }
    } catch (error) {
      console.error('上传失败:', error)
      alert('上传失败，请稍后重试')
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    fetchUserInfo()
  }, [])

  useEffect(() => {
    if (userInfo) {
      fetchUserPosts()
      fetchUserStats()
    }
  }, [userInfo])

  useEffect(() => {
    if (activeTab === 'trips') {
      fetchUserTrips()
    }
  }, [activeTab])

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token || !userInfo) return

      const response = await fetch(`${API_BASE_URL}/api/users/stats/${userInfo.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.code === 200) {
        setFollowersCount(data.data.followersCount)
        setFollowingCount(data.data.followingCount)
      }
    } catch (error) {
      console.error('获取用户统计失败:', error)
    }
  }

  const fetchUserTrips = async () => {
    try {
      setTripsLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        return
      }

      const response = await fetch(`${API_BASE_URL}/api/trips`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      
      // 转换数据格式以匹配前端类型
      const plans: TripPlan[] = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        destination: item.destination,
        startDate: item.startDate.split('T')[0],
        endDate: item.endDate.split('T')[0],
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

      setTrips(plans)
    } catch (error) {
      console.error('获取用户行程失败:', error)
    } finally {
      setTripsLoading(false)
    }
  }

  const fetchUserPosts = async () => {
    try {
      setPostsLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        return
      }

      const response = await fetch(`${API_BASE_URL}/api/posts/user/${userInfo?.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.code === 200) {
        setPosts(data.data)
      }
    } catch (error) {
      console.error('获取用户帖子失败:', error)
    } finally {
      setPostsLoading(false)
    }
  }

  const fetchUserInfo = async () => {
    try {
      setLoading(true)
      setError('')
      
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.code === 200) {
        setUserInfo(data.data)
        // 更新localStorage中的用户信息
        localStorage.setItem('userInfo', JSON.stringify(data.data))
        // 触发全局事件，通知Header组件刷新用户信息
        window.dispatchEvent(new Event('userInfoUpdated'))
        // 初始化表单数据
        setFormData({
          nickname: data.data.nickname || '',
          gender: data.data.gender || '',
          birthday: data.data.birthday ? formatDate(data.data.birthday) : '',
          phone: data.data.phone || '',
          email: data.data.email || '',
          bio: data.data.bio || ''
        })
      } else {
        setError(data.msg || '获取用户信息失败')
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleLogout = () => {
    localStorage.removeItem('userInfo')
    localStorage.removeItem('token')
    navigate('/login')
  }

  // 获取帖子所有图片
  const getAllImages = useCallback((post: Post | null): string[] => {
    if (!post) return []
    
    let imagesArray: string[] = []
    
    if (Array.isArray(post.images)) {
      imagesArray = post.images.map(img => 
        img.startsWith('http') ? img : `${API_BASE_URL}${img}`
      )
    } else if (typeof post.images === 'string') {
      try {
        imagesArray = JSON.parse(post.images).map((img: string) => 
          img.startsWith('http') ? img : `${API_BASE_URL}${img}`
        )
      } catch {
        imagesArray = []
      }
    }
    
    if (post.coverImage) {
      const coverUrl = post.coverImage.startsWith('http') 
        ? post.coverImage 
        : `${API_BASE_URL}${post.coverImage}`
      if (!imagesArray.includes(coverUrl)) {
        imagesArray.unshift(coverUrl)
      }
    }
    
    return imagesArray
  }, [])

  // 点击帖子展开
  const handlePostClick = useCallback(async (post: Post) => {
    setSelectedPost(post)
    setCurrentImageIndex(0)
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${post.id}`)
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

  // 关闭帖子模态框
  const handleCloseModal = useCallback(() => {
    setSelectedPost(null)
    setReplyingTo(null)
    setReplyInput('')
  }, [])

  // 处理回复评论
  const handleReply = useCallback((commentId: string) => {
    setReplyingTo(replyingTo === commentId ? null : commentId)
    setReplyInput('')
  }, [replyingTo])

  // 提交回复
  const handleSubmitReply = useCallback(async () => {
    if (!replyInput.trim() || !selectedPost || !replyingTo) return
    
    const token = localStorage.getItem('token')
    if (!token) {
      alert('请先登录')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          postId: selectedPost.id,
          content: `@${postComments[selectedPost.id]?.find(c => c.id === replyingTo)?.username || '用户'} ${replyInput}`
        })
      })

      const data = await response.json()

      if (data.code === 200) {
        const newComment: Comment = {
          id: data.data.id,
          userId: userInfo?.username || '',
          username: userInfo?.nickname || userInfo?.username || '',
          content: `@${postComments[selectedPost.id]?.find(c => c.id === replyingTo)?.username || '用户'} ${replyInput}`,
          avatarUrl: userInfo?.avatar_url,
          likesCount: 0,
          createdAt: new Date().toISOString()
        }

        setPostComments(prev => {
          const comments = prev[selectedPost.id] || []
          const targetIndex = comments.findIndex(c => c.id === replyingTo)
          if (targetIndex !== -1) {
            const newComments = [...comments]
            newComments.splice(targetIndex + 1, 0, newComment)
            return {
              ...prev,
              [selectedPost.id]: newComments,
            }
          }
          return {
            ...prev,
            [selectedPost.id]: [...comments, newComment],
          }
        })
        setReplyInput('')
        setReplyingTo(null)
      } else {
        alert(data.msg || '回复失败')
      }
    } catch (error) {
      console.error('回复失败:', error)
      alert('回复失败，请稍后重试')
    }
  }, [replyInput, selectedPost, replyingTo, userInfo, postComments])

  // 删除帖子
  const handleDeletePost = useCallback(async () => {
    if (!deleteConfirmPost) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('请先登录');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${deleteConfirmPost.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.code === 200) {
        // 更新本地帖子列表
        setPosts(prev => prev.filter(post => post.id !== deleteConfirmPost.id));
        // 如果当前打开的是被删除的帖子，关闭模态框
        if (selectedPost && selectedPost.id === deleteConfirmPost.id) {
          setSelectedPost(null);
        }
        setDeleteConfirmPost(null);
        // 显示删除成功弹窗
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
      } else {
        alert(data.msg || '删除失败');
      }
    } catch (error) {
      console.error('删除帖子失败:', error);
      alert('删除失败，请稍后重试');
    }
  }, [deleteConfirmPost, selectedPost])

  // 删除行程计划
  const handleDeletePlan = useCallback(async () => {
    if (!deleteConfirmPlan) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('请先登录');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/trips/${deleteConfirmPlan.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // 更新本地行程列表
        setTrips(prev => prev.filter(plan => plan.id !== deleteConfirmPlan.id));
        setDeleteConfirmPlan(null);
        // 显示删除成功弹窗
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
      } else {
        alert('删除失败');
      }
    } catch (error) {
      console.error('删除行程计划失败:', error);
      alert('删除失败，请稍后重试');
    }
  }, [deleteConfirmPlan])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.code === 200) {
        // 更新用户信息
        setUserInfo(data.data)
        localStorage.setItem('userInfo', JSON.stringify(data.data))
        window.dispatchEvent(new Event('userInfoUpdated'))
        setShowModal(false)
        setShowSuccessModal(true)
        setTimeout(() => setShowSuccessModal(false), 1500)
      } else {
        alert(data.msg || '更新失败')
      }
    } catch (error) {
      console.error('更新失败:', error)
      alert('更新失败，请稍后重试')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f6f8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F9AFF]"></div>
      </div>
    )
  }

  if (error || !userInfo) {
    return (
      <div className="min-h-screen bg-[#f5f6f8] flex flex-col items-center justify-center px-4">
        <p className="text-slate-500 mb-4">{error || '无法获取用户信息'}</p>
        <button 
          onClick={fetchUserInfo}
          className="px-6 py-2.5 bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] text-white rounded-lg text-sm font-medium"
        >
          重试
        </button>
      </div>
    )
  }

  // 构建头像URL
  const avatarUrl = userInfo.avatar_url.startsWith('http') 
    ? userInfo.avatar_url 
    : `${API_BASE_URL}${userInfo.avatar_url}`

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      <Header showSearch={false} />
      
      <main className="mx-auto max-w-[900px] px-4 py-6">
        <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_20px_rgba(15,154,255,0.06)] mb-6">
          <div className="h-[200px] relative">
            <img 
              src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=300&fit=crop" 
              alt="封面" 
              className="w-full h-full object-cover" 
            />
          </div>
          
          <div className="px-6 pb-6">
            <div className="flex justify-between items-end mt-[-80px] relative">
              <div className="w-40 h-40 rounded-full border-4 border-white shadow-[0_4px_20px_rgba(0,0,0,0.1)] overflow-hidden">
                <img src={avatarUrl} alt="用户头像" className="w-full h-full object-cover" />
              </div>
              <button 
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#f7f8fa]/90 border border-[rgba(15,154,255,0.2)] rounded-xl text-sm text-slate-600 hover:bg-[#f0f7ff]/90 hover:border-[#0F9AFF] hover:text-[#0F9AFF] transition-all"
              >
                <Edit3 className="h-4 w-4" strokeWidth={2} />
                编辑资料
              </button>
            </div>

            <div className="mt-4">
              <h1 className="text-2xl font-bold text-slate-800">{userInfo.nickname || userInfo.username}</h1>
              <p className="text-sm text-slate-400 mt-1">{userInfo.bio || '热爱旅行，分享旅途故事'}</p>
            </div>

            <div className="flex gap-8 mt-5 pt-5 border-t border-[rgba(15,154,255,0.08)]">
              <div className="cursor-pointer hover:opacity-80 transition-opacity">
                <span className="block text-lg font-bold text-slate-800">{posts.length}</span>
                <span className="text-xs text-slate-400">帖子</span>
              </div>
              <div className="cursor-pointer hover:opacity-80 transition-opacity">
                <span className="block text-lg font-bold text-slate-800">{followersCount}</span>
                <span className="text-xs text-slate-400">粉丝</span>
              </div>
              <div className="cursor-pointer hover:opacity-80 transition-opacity">
                <span className="block text-lg font-bold text-slate-800">{followingCount}</span>
                <span className="text-xs text-slate-400">关注</span>
              </div>
              <div className="cursor-pointer hover:opacity-80 transition-opacity">
                <span className="block text-lg font-bold text-slate-800">{trips.length}</span>
                <span className="text-xs text-slate-400">行程</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-2 shadow-[0_2px_20px_rgba(15,154,255,0.06)] mb-6">
          <div className="flex">
            {[
              { id: 'posts', label: '帖子', icon: 'post' },
              { id: 'trips', label: '行程', icon: 'trip' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] text-white'
                    : 'text-slate-400 hover:text-[#0F9AFF] hover:bg-[rgba(15,154,255,0.06)]'
                }`}
              >
                {tab.id === 'posts' && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                )}
                {tab.id === 'trips' && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9"/>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                )}
                {tab.id === 'likes' && <Heart className="h-4 w-4" strokeWidth={2} />}
                {tab.id === 'favorites' && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                )}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`bg-white rounded-xl p-4 shadow-[0_2px_20px_rgba(15,154,255,0.06)] ${
          activeTab === 'posts' ? 'block' : 'hidden'
        }`}>
          {postsLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F9AFF]"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <p className="mt-4">暂无帖子内容</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {posts.map((post, index) => (
                <div 
                  key={post.id} 
                  className="aspect-square rounded-xl overflow-hidden relative group"
                  style={{
                    background: post.coverImage
                      ? `url(${API_BASE_URL}${post.coverImage})`
                      : `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {/* 删除按钮 */}
                  <motion.button
                    initial={{ opacity: 0, y: -10 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    className="delete-post-btn absolute top-2 right-2 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center text-white cursor-pointer hover:bg-red-500/80 transition-colors z-10 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmPost(post);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                  </motion.button>
                  
                  {/* 点击帖子展开 */}
                  <div 
                    className="absolute inset-0 cursor-pointer"
                    onClick={() => handlePostClick(post)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`bg-white rounded-xl p-4 shadow-[0_2px_20px_rgba(15,154,255,0.06)] ${
          activeTab === 'trips' ? 'block' : 'hidden'
        }`}>
          {tripsLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
            </div>
          ) : trips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              <p className="mt-4">暂无行程内容</p>
              <button
                onClick={() => navigate('/trip-home')}
                className="mt-4 px-6 py-2 bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] text-white rounded-full text-sm font-medium cursor-pointer hover:shadow-lg transition-all"
              >
                创建行程
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  userAvatar={userInfo?.avatar_url}
                  userNickname={userInfo?.nickname || userInfo?.username}
                  onViewDetail={() => {
                    // 先将计划添加到 store 中，然后选择它
                    const store = useTripStore.getState()
                    store.addPlan(plan)
                    store.selectPlan(plan.id)
                    navigate('/trip-planner')
                  }}
                  showDelete={true}
                  onDelete={() => setDeleteConfirmPlan(plan)}
                />
              ))}
            </div>
          )}
        </div>

        <div className={`bg-white rounded-xl p-4 shadow-[0_2px_20px_rgba(15,154,255,0.06)] ${
          activeTab === 'likes' ? 'block' : 'hidden'
        }`}>
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Heart className="h-20 w-20 opacity-50" strokeWidth={1.5} />
            <p className="mt-4">暂无喜欢内容</p>
          </div>
        </div>

        <div className={`bg-white rounded-xl p-4 shadow-[0_2px_20px_rgba(15,154,255,0.06)] ${
          activeTab === 'favorites' ? 'block' : 'hidden'
        }`}>
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <p className="mt-4">暂无收藏内容</p>
          </div>
        </div>
      </main>

      <div className="pb-32"></div>

      {/* 删除确认弹窗 */}
      <AnimatePresence>
        {deleteConfirmPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-[400px] shadow-2xl"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">确认删除</h3>
                <p className="text-sm text-gray-500 mb-6">此操作不可撤销！确定要删除这篇帖子吗？</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirmPost(null)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleDeletePost}
                    className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
                  >
                    确认删除
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 删除行程计划确认弹窗 */}
      <AnimatePresence>
        {deleteConfirmPlan && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteConfirmPlan(null)}
          >
            <motion.div
              className="w-[90%] max-w-[420px] bg-white rounded-2xl p-6 shadow-[0_25px_80px_rgba(0,0,0,0.3)]"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-gray-900">确认删除</h3>
                <p className="mt-2 text-gray-500">确定要删除这个行程计划吗？此操作不可撤销！</p>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setDeleteConfirmPlan(null)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleDeletePlan}
                    className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
                  >
                    确认删除
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 删除成功弹窗 */}
      <ShowSuccessModal 
        show={showSuccessModal} 
        title="操作成功" 
        message="删除成功" 
      />

      {/* 帖子展开模态框 */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-[900px] h-[500px] bg-white rounded-2xl overflow-hidden shadow-2xl flex"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 左侧图片区域 */}
              <div className="modal-left w-3/5 h-full relative">
                <div className="w-full h-full flex overflow-hidden">
                  {getAllImages(selectedPost).map((image, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: currentImageIndex === index ? 1 : 0 }}
                      className="absolute inset-0"
                      style={{
                        background: `url(${image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                  ))}
                </div>
                
                {/* 关闭按钮 */}
                <button
                  onClick={handleCloseModal}
                  className="close-modal-btn absolute top-4 right-4 w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-black/50 transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>

                {/* 下载原图按钮 - 鼠标悬停时显示 */}
                <motion.div 
                  className="download-btn absolute top-5 right-20 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer z-20 opacity-0 hover:opacity-100 transition-opacity duration-300"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  onClick={() => {
                    const images = getAllImages(selectedPost);
                    if (images[currentImageIndex]) {
                      const link = document.createElement('a');
                      link.href = images[currentImageIndex].startsWith('http') 
                        ? images[currentImageIndex] 
                        : `${API_BASE_URL}${images[currentImageIndex]}`;
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

                {/* 图片指示器 */}
                {getAllImages(selectedPost).length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {getAllImages(selectedPost).map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full cursor-pointer transition-all ${
                          currentImageIndex === index ? 'bg-white w-6' : 'bg-white/50'
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* 右侧内容区域 */}
              <div className="modal-right w-2/5 h-full flex flex-col overflow-hidden">
                <div className="post-header px-5 py-5 flex justify-between items-center border-b border-gray-100">
                  <div className="post-author flex items-center gap-3">
                    <div 
                      className="author-avatar-lg w-12 h-12 rounded-full overflow-hidden"
                      style={{
                        background: userInfo?.avatar_url
                          ? `url(${API_BASE_URL}${userInfo.avatar_url})`
                          : 'linear-gradient(to-r, #0F9AFF, #0010B3)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                    <div className="author-info flex flex-col">
                      <span className="author-name-lg text-sm font-semibold text-gray-800">
                        {userInfo?.nickname || userInfo?.username}
                      </span>
                      <span className="author-location text-xs text-gray-400 mt-0.5">
                        {selectedPost.destination || '未知地点'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="post-body flex-1 overflow-y-auto px-5 py-5">
                  <div className="post-content mb-5">
                    <p className="text-base font-semibold text-gray-800 mb-3 leading-relaxed">{selectedPost.title}</p>
                    <p className="post-text text-sm text-gray-500 leading-relaxed mb-4">{selectedPost.content}</p>
                    {selectedPost.tags && selectedPost.tags.length > 0 && (
                      <div className="post-tags flex flex-wrap gap-2 mb-3">
                        {selectedPost.tags.map((tag, index) => (
                          <span key={index} className="post-tag px-2.5 py-1 bg-[rgba(15,154,255,0.08)] text-[#0F9AFF] rounded-md text-xs">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <span className="post-time text-xs text-gray-400">
                      {new Date(selectedPost.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>

                  <div className="post-stats mb-5 pb-4 border-b border-gray-100">
                    <span className="stat-item text-sm text-gray-400">共 {(postComments[selectedPost.id] || []).length} 条评论</span>
                  </div>

                  <div className="comments-section flex flex-col gap-5">
                    {(postComments[selectedPost.id] || []).map((comment) => {
                      const isReply = comment.content.startsWith('@')
                      const replyOffset = isReply ? 'ml-10' : ''
                      return (
                        <div key={comment.id} className={`comment flex flex-col gap-2 ${replyOffset}`}>
                          <div className="comment-author flex items-center gap-2">
                            <div 
                              className="comment-avatar w-8 h-8 rounded-full overflow-hidden"
                              style={{
                                background: comment.avatarUrl
                                  ? `url(${API_BASE_URL}${comment.avatarUrl})`
                                  : 'linear-gradient(to-r, #0F9AFF, #0010B3)',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                              }}
                            />
                            <span className="comment-name text-xs font-semibold text-gray-800">
                              {comment.nickname || comment.username}
                            </span>
                          </div>
                          <p className="comment-text text-sm text-gray-800 leading-relaxed ml-10">{comment.content}</p>
                          <div className="comment-actions flex gap-4 ml-10">
                            <button 
                              className="comment-action reply text-xs text-gray-500 cursor-pointer hover:text-[#0F9AFF] transition-colors border-none bg-none"
                              onClick={() => handleReply(comment.id)}
                            >
                              回复
                            </button>
                          </div>
                          {replyingTo === comment.id && (
                            <motion.div 
                              className="reply-input-container flex gap-2 ml-10 mt-2"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                            >
                              <input
                                type="text"
                                className="reply-input flex-1 px-3 py-2 bg-gray-50 border-none rounded-[16px] text-sm outline-none transition-all duration-300 focus:bg-white focus:shadow-[0_0_0_2px_rgba(15,154,255,0.2)] placeholder:text-gray-400"
                                placeholder={`回复 @${comment.nickname || comment.username}...`}
                                value={replyInput}
                                onChange={(e) => setReplyInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmitReply())}
                              />
                              <button
                                className="reply-submit w-8 h-8 bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] text-white border-none rounded-full cursor-pointer flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-[0_4px_16px_rgba(15,154,255,0.4)]"
                                onClick={handleSubmitReply}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="22" y1="2" x2="11" y2="13"/>
                                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                                </svg>
                              </button>
                            </motion.div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl w-[90%] max-w-[500px] max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">编辑个人资料</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
            
            <form className="p-5">
              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 mb-2">头像</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full border-2 border-slate-200 overflow-hidden">
                    <img src={avatarUrl} alt="头像预览" className="w-full h-full object-cover" />
                  </div>
                  <input 
                    type="file" 
                    id="avatarInput" 
                    accept="image/jpeg,image/png" 
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <button 
                    type="button"
                    onClick={() => document.getElementById('avatarInput')?.click()}
                    className="flex items-center gap-2 px-4 py-2 border border-[#0F9AFF] rounded-lg text-[#0F9AFF] text-sm hover:bg-[rgba(15,154,255,0.05)] transition-colors"
                  >
                    <Camera className="h-4 w-4" strokeWidth={2} />
                    {uploading ? '上传中...' : '上传头像'}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2">支持JPG、PNG格式，尺寸180*180像素，大小不超过2M</p>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 mb-2">用户名</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-400 cursor-not-allowed" 
                  value={userInfo.username}
                  disabled
                />
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 mb-2">昵称</label>
                <input 
                  type="text" 
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleInputChange}
                  placeholder="请输入昵称"
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0F9AFF] transition-colors" 
                />
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 mb-2">性别</label>
                <div className="flex gap-6">
                  {['男', '女', '保密~'].map((gender) => (
                    <label key={gender} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="gender" 
                        value={gender}
                        checked={formData.gender === gender}
                        onChange={handleInputChange}
                        className="w-4 h-4 accent-[#0F9AFF]"
                      />
                      <span className="text-sm text-slate-700">{gender}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 mb-2">出生日期</label>
                <input 
                  type="date" 
                  name="birthday"
                  value={formData.birthday}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0F9AFF] transition-colors" 
                />
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 mb-2">手机号</label>
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="请输入手机号"
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0F9AFF] transition-colors" 
                />
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 mb-2">邮箱</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email || userInfo.email}
                  onChange={handleInputChange}
                  placeholder="请输入邮箱"
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0F9AFF] transition-colors" 
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">个人简介</label>
                <textarea 
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="介绍一下自己..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm min-h-[100px] resize-vertical focus:outline-none focus:border-[#0F9AFF] transition-colors" 
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                >
                  取消
                </button>
                <button 
                  type="button"
                  onClick={handleSubmit}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  保存修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <TabBar />
    </div>
  )
}