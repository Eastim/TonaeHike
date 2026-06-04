import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { deepseekAIService } from '../../services/deepseekAI';
import { TabBar } from '../../components/TabBar/TabBar';
import { Header } from '../../components/Header/Header';
import { PlanCard } from '../../components/PlanCard/PlanCard';
import { ShowSuccessModal } from '../../components/showSuccessModal/showSuccessmodal';
import { useNavigate } from 'react-router-dom';

interface UserInfo {
  id?: string;
  username: string;
  nickname?: string;
  avatar?: string;
}

interface PostUser {
  id: string;
  username: string;
  nickname?: string;
  avatarUrl?: string;
}

interface Comment {
  id: string;
  userId: string;
  username: string;
  nickname?: string;
  content: string;
  avatarUrl?: string;
  likesCount: number;
  createdAt: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  category?: string;
  destination?: string;
  coverImage?: string;
  images?: string[];
  tags?: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  user: PostUser;
}

const feedTabs = ['推荐', '旅行分享', '美食推荐', '酒店民宿', '当地活动', '实用贴士', '摄影大佬', '行程攻略'];

const categoryMap: Record<string, string> = {
  travel: '旅行分享',
  food: '美食推荐',
  hotel: '酒店民宿',
  activity: '当地活动',
  tips: '实用贴士',
  photo: '摄影大佬',
  guide: '行程攻略',
};

const getGradient = (index: number) => {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #434343 0%, #000000 100%)',
  ];
  return gradients[index % gradients.length];
};

const LazyImage = ({ 
  src, 
  fallback, 
  className,
  children
}: { 
  src: string; 
  fallback: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) => {
  const [isInView, setIsInView] = useState(false);
  const [imgError, setImgError] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  const showFallback = !src || imgError;

  return (
    <div ref={wrapperRef} className={`relative w-full ${className ?? ''}`}>
      {showFallback ? (
        <div className="w-full aspect-[4/3]" style={{ background: fallback }} />
      ) : isInView ? (
        <img
          src={src}
          alt=""
          className="w-full h-auto block"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full aspect-[4/3] bg-slate-100 animate-pulse" />
      )}
      {children && <div className="absolute top-0 left-0 w-full h-full pointer-events-none">{children}</div>}
    </div>
  );
};

export default function MainPage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set()); // 记录用户已点赞的帖子
  const [floatingHearts, setFloatingHearts] = useState<{id: number, x: number, y: number}[]>([]); // 浮动爱心动画
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('推荐'); // 默认选中推荐
  const [commentInput, setCommentInput] = useState('');
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [publishedPlans, setPublishedPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [followingUser, setFollowingUser] = useState<string | null>(null);
  const [showFollowSuccess, setShowFollowSuccess] = useState(false);
  const [followErrorMsg, setFollowErrorMsg] = useState('');
  const [showUnfollowConfirm, setShowUnfollowConfirm] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const savedUserInfo = localStorage.getItem('userInfo');
    console.log('MainPage: savedUserInfo from localStorage:', savedUserInfo);
    if (savedUserInfo) {
      const parsed = JSON.parse(savedUserInfo);
      console.log('MainPage: parsed userInfo:', parsed);
      console.log('MainPage: avatar_url:', parsed.avatar_url);
      setUserInfo({
        id: parsed.id,
        username: parsed.username || parsed.user?.username || '用户',
        nickname: parsed.nickname,
        avatar: parsed.avatar_url || parsed.user?.avatar,
      });
    }
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3000/api/posts');
        const data = await response.json();
        
        if (data.code === 200) {
          setPosts(data.data);
        }
      } catch (error) {
        console.error('获取帖子失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  useEffect(() => {
    const fetchPublishedPlans = async () => {
      try {
        setPlansLoading(true);
        const response = await fetch('http://localhost:3000/api/trips/published', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        if (Array.isArray(data)) {
          const formatted = data.map((item: any) => ({
            id: item.id,
            name: item.name,
            destination: item.destination,
            startDate: item.startDate.split('T')[0],
            endDate: item.endDate.split('T')[0],
            published: true,
            synced: true,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            authorAvatar: item.user?.avatarUrl || '/avatar/default.png',
            authorNickname: item.user?.nickname || item.user?.username || '用户',
            days: (item.tripDays || []).map((day: any) => ({
              index: day.dayIndex,
              label: day.label,
              date: day.date?.split('T')[0],
              spots: (day.spots || []).map((spot: any) => ({
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
          }));
          setPublishedPlans(formatted);
        }
      } catch (error) {
        console.error('获取已发布行程失败:', error);
      } finally {
        setPlansLoading(false);
      }
    };

    fetchPublishedPlans();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-menu')) {
        // Nothing to close currently
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    setUserInfo(null);
    window.location.href = '/';
  }, []);

  const handleAskAI = useCallback(async () => {
    if (!aiInput.trim()) return;

    setIsAiLoading(true);
    setAiResponse('');

    try {
      const systemPrompt = `你是一个专业的旅行顾问AI助手。请使用简洁、友好的中文回答用户关于旅行的问题。

回答要求：
1. 使用自然、口语化的表达，避免生硬的格式
2. 分点说明时使用数字序号
3. 提供实用、可操作的建议
4. 保持回答简洁，重点突出

你可以回答以下类型的问题：
- 目的地推荐
- 行程规划建议
- 美食推荐
- 住宿建议
- 旅行小贴士`;

      const response = await deepseekAIService.chat(aiInput, systemPrompt);
      setAiResponse(response);
    } catch (error) {
      setAiResponse('抱歉，AI服务暂时不可用，请稍后重试。');
    } finally {
      setIsAiLoading(false);
    }
  }, [aiInput]);

  const getAllImages = (post: Post | null): string[] => {
    if (!post) return [];
    
    // 尝试处理 images 字段
    let imagesArray: string[] = [];
    
    // 如果是数组，直接使用
    if (post.images && Array.isArray(post.images)) {
      imagesArray = post.images;
    } 
    // 如果是字符串，尝试解析为 JSON
    else if (typeof post.images === 'string') {
      try {
        const parsed = JSON.parse(post.images);
        if (Array.isArray(parsed)) {
          imagesArray = parsed;
        }
      } catch (e) {
        console.error('Failed to parse images:', e);
      }
    }
    
    // 如果有图片，返回图片数组
    if (imagesArray.length > 0) {
      return imagesArray;
    }
    
    // 如果没有正文图片但有封面图
    if (post.coverImage) {
      return [post.coverImage];
    }
    
    return [''];
  };

  const handleLike = useCallback(async () => {
    if (!selectedPost) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const isLiked = likedPosts.has(selectedPost.id);
    
    try {
      const response = await fetch(`http://localhost:3000/api/posts/${selectedPost.id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ like: !isLiked })
      });
      
      const data = await response.json();
      if (data.code === 200) {
        // 更新本地状态
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          if (isLiked) {
            newSet.delete(selectedPost.id);
          } else {
            newSet.add(selectedPost.id);
          }
          return newSet;
        });
        
        // 更新帖子的点赞数
        setSelectedPost(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            likesCount: isLiked ? prev.likesCount - 1 : prev.likesCount + 1
          };
        });
        
        // 更新帖子列表中的点赞数
        setPosts(prev => prev.map(post => 
          post.id === selectedPost.id 
            ? { ...post, likesCount: isLiked ? post.likesCount - 1 : post.likesCount + 1 }
            : post
        ));
      }
    } catch (error) {
      console.error('点赞失败:', error);
    }
  }, [selectedPost, likedPosts]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!selectedPost) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 添加浮动爱心
    const heartId = Date.now();
    setFloatingHearts(prev => [...prev, { id: heartId, x, y }]);
    
    // 1秒后移除爱心
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== heartId));
    }, 1000);
    
    // 如果还没点赞过，触发点赞
    if (!likedPosts.has(selectedPost.id)) {
      handleLike();
    }
  }, [selectedPost, likedPosts, handleLike]);

  const handlePostClick = useCallback(async (post: Post) => {
    setSelectedPost(post);
    setCurrentImageIndex(0);
    
    // 获取帖子详情（包含评论）
    try {
      const response = await fetch(`http://localhost:3000/api/posts/${post.id}`);
      const data = await response.json();
      
      if (data.code === 200 && data.data.comments) {
        setPostComments(prev => ({
          ...prev,
          [post.id]: data.data.comments
        }));
      }
    } catch (error) {
      console.error('获取帖子详情失败:', error);
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedPost(null);
  }, []);

  const handleCloseAiModal = useCallback(() => {
    setShowAiModal(false);
    setAiResponse('');
    setAiInput('');
    deepseekAIService.resetConversation();
  }, []);

  const handleSubmitComment = useCallback(async () => {
    if (!commentInput.trim() || !selectedPost) return;
    if (!userInfo) {
      alert('请先登录');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('请先登录');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/comments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          postId: selectedPost.id,
          content: commentInput
        })
      });

      const data = await response.json();

      if (data.code === 200) {
        const newComment: Comment = {
          id: data.data.id,
          userId: userInfo.username,
          username: userInfo.nickname || userInfo.username,
          content: commentInput,
          avatarUrl: userInfo.avatar,
          likesCount: 0,
          createdAt: new Date().toISOString()
        };

        setPostComments(prev => ({
          ...prev,
          [selectedPost.id]: [...(prev[selectedPost.id] || []), newComment],
        }));
        setCommentInput('');
      } else {
        alert(data.msg || '评论失败');
      }
    } catch (error) {
      console.error('评论失败:', error);
      alert('评论失败，请稍后重试');
    }
  }, [commentInput, selectedPost, userInfo]);

  const handleCommentLike = useCallback(async (commentId: string) => {
    if (!userInfo) {
      alert('请先登录');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('请先登录');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.code === 200 && selectedPost) {
        setPostComments(prev => {
          const comments = prev[selectedPost.id] || [];
          return {
            ...prev,
            [selectedPost.id]: comments.map(comment =>
              comment.id === commentId
                ? { ...comment, likesCount: data.data.likesCount }
                : comment
            )
          };
        });
      } else {
        alert(data.msg || '点赞失败');
      }
    } catch (error) {
      console.error('评论点赞失败:', error);
      alert('点赞失败，请稍后重试');
    }
  }, [selectedPost, userInfo]);

  const handleReply = useCallback((commentId: string) => {
    setReplyingTo(replyingTo === commentId ? null : commentId);
    setReplyInput('');
  }, [replyingTo]);

  const handleSubmitReply = useCallback(async () => {
    if (!replyInput.trim() || !selectedPost || !replyingTo) return;
    if (!userInfo) {
      alert('请先登录');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('请先登录');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/comments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          postId: selectedPost.id,
          content: `@${postComments[selectedPost.id]?.find(c => c.id === replyingTo)?.username || '用户'} ${replyInput}`
        })
      });

      const data = await response.json();

      if (data.code === 200) {
        const newComment: Comment = {
          id: data.data.id,
          userId: userInfo.username,
          username: userInfo.nickname || userInfo.username,
          content: `@${postComments[selectedPost.id]?.find(c => c.id === replyingTo)?.username || '用户'} ${replyInput}`,
          avatarUrl: userInfo.avatar,
          likesCount: 0,
          createdAt: new Date().toISOString()
        };

        setPostComments(prev => {
          const comments = prev[selectedPost.id] || [];
          const targetIndex = comments.findIndex(c => c.id === replyingTo);
          if (targetIndex !== -1) {
            // 将回复插入到被回复评论的下方（下一个位置）
            const newComments = [...comments];
            newComments.splice(targetIndex + 1, 0, newComment);
            return {
              ...prev,
              [selectedPost.id]: newComments,
            };
          }
          return {
            ...prev,
            [selectedPost.id]: [...comments, newComment],
          };
        });
        setReplyInput('');
        setReplyingTo(null);
      } else {
        alert(data.msg || '回复失败');
      }
    } catch (error) {
      console.error('回复失败:', error);
      alert('回复失败，请稍后重试');
    }
  }, [replyInput, selectedPost, replyingTo, userInfo, postComments]);

  const handleFollowClick = useCallback(async (targetUserId: string) => {
    const myId = userInfo?.id;
    if (!myId) return;

    if (myId === targetUserId) {
      setFollowErrorMsg('不能关注自己');
      setTimeout(() => setFollowErrorMsg(''), 1000);
      return;
    }

    const isFollowing = followedUsers.has(targetUserId);

    if (isFollowing) {
      setFollowingUser(targetUserId);
      setShowUnfollowConfirm(true);
    } else {
      try {
        const res = await fetch(`http://localhost:3000/api/users/follow/${targetUserId}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        if (data.code === 200) {
          setFollowedUsers(prev => new Set(prev).add(targetUserId));
          setShowFollowSuccess(true);
          setTimeout(() => setShowFollowSuccess(false), 1500);
        }
      } catch (err) {
        console.error('关注失败:', err);
      }
    }
  }, [userInfo, followedUsers]);

  const handleUnfollowConfirm = useCallback(async () => {
    if (!followingUser) return;
    try {
      const res = await fetch(`http://localhost:3000/api/users/follow/${followingUser}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.code === 200) {
        setFollowedUsers(prev => {
          const next = new Set(prev);
          next.delete(followingUser);
          return next;
        });
      }
    } catch (err) {
      console.error('取关失败:', err);
    } finally {
      setShowUnfollowConfirm(false);
      setFollowingUser(null);
    }
  }, [followingUser]);

  const getFilteredPosts = () => {
    if (activeTab === '推荐') return posts;
    
    const categoryKey = activeTab === '旅行分享' ? 'travel' : 
                        activeTab === '美食推荐' ? 'food' :
                        activeTab === '酒店民宿' ? 'hotel' :
                        activeTab === '当地活动' ? 'activity' :
                        activeTab === '实用贴士' ? 'tips' :
                        activeTab === '摄影大佬' ? 'photo' : '';
    
    return posts.filter(post => post.category === categoryKey);
  };

  // 获取缩略图URL（用于首页展示）
  const getThumbnailUrl = (imageUrl: string | undefined, postId: string): string | null => {
    if (!imageUrl) return null;
    
    // 从图片URL中提取文件名
    // 例如: /posts/123/cover.jpg -> /posts/123/thumb_cover.jpg
    // 例如: /posts/123/abc.jpg -> /posts/123/thumb_abc.jpg
    const parts = imageUrl.split('/');
    const filename = parts[parts.length - 1];
    const thumbFilename = `thumb_${filename}`;
    
    return `http://localhost:3000/posts/${postId}/${thumbFilename}`;
  };

  const filteredPosts = getFilteredPosts();

  return (
    <div className="app-container min-h-screen bg-white">
      <Header 
        showSearch={true}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAskAI={() => setShowAiModal(true)}
      />

      <main className="main-content max-w-[1400px] mx-auto px-6 py-6 pb-24">
        <section className="feed-container flex flex-col gap-5">
          <div className="feed-tabs bg-white/70 backdrop-blur-[20px] rounded-xl px-5 py-3 flex gap-2 overflow-x-auto shadow-[0_4px_24px_rgba(15,154,255,0.06)] border border-[rgba(15,154,255,0.08)]">
            {feedTabs.map((tab) => (
              <button
                key={tab}
                className={`tab-btn px-5 py-2.5 border-none rounded-[24px] text-sm font-medium cursor-pointer whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] text-white shadow-[0_4px_16px_rgba(15,154,255,0.35)]'
                    : 'bg-[rgba(247,248,250,0.6)] backdrop-blur-[10px] text-gray-500 hover:bg-[rgba(15,154,255,0.08)] hover:text-[#0F9AFF]'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F9AFF]"></div>
            </div>
          ) : activeTab === '行程攻略' ? (
            plansLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F9AFF]"></div>
              </div>
            ) : publishedPlans.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M1 6h22M5 6V3h14v3M5 6v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6"/>
                  <path d="M9 10h6"/>
                </svg>
                <p className="mt-4">还没有用户发布行程攻略呢~</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publishedPlans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    userAvatar={plan.authorAvatar}
                    userNickname={plan.authorNickname}
                    onViewDetail={() => {
                      navigate(`/trip-planner?id=${plan.id}`)
                    }}
                  />
                ))}
              </div>
            )
          ) : filteredPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <p className="mt-4">还没有用户发布这类帖子呢~</p>
            </div>
          ) : (
            <div className="cards-grid columns-3 gap-4">
              {filteredPosts.map((post, index) => (
                <article
                  key={post.id}
                  className="card break-inside-avoid mb-4 bg-white/85 backdrop-blur-[20px] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 shadow-[0_2px_12px_rgba(15,154,255,0.04)] border border-[rgba(15,154,255,0.06)] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(15,154,255,0.1)]"
                  onClick={() => handlePostClick(post)}
                >
                  <LazyImage
                    src={(() => {
                      const originalImage = post.images && post.images.length > 0 ? post.images[0] : post.coverImage;
                      if (originalImage) {
                        return getThumbnailUrl(originalImage, post.id) || '';
                      }
                      return '';
                    })()}
                    fallback={getGradient(index)}
                    className="rounded-t-xl overflow-hidden"
                  >
                    {(post as any).badge && (
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] text-white px-3 py-1 rounded-xl text-xs font-semibold shadow-[0_4px_12px_rgba(15,154,255,0.4)] pointer-events-auto">
                        {(post as any).badge}
                      </div>
                    )}
                  </LazyImage>
                  <div className="card-content p-4">
                    <h3 className="card-title text-sm font-semibold text-gray-800 leading-relaxed line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="card-text text-xs text-gray-400 mt-2 line-clamp-2">
                      {post.content.substring(0, 80)}...
                    </p>
                    <div className="card-footer flex items-center justify-between mt-3.5">
                      <div className="author flex items-center gap-2">
                        <div 
                          className="author-avatar w-7 h-7 rounded-full overflow-hidden"
                          style={{
                            background: post.user.avatarUrl 
                              ? `url(http://localhost:3000${post.user.avatarUrl})`
                              : 'linear-gradient(to-r, #0F9AFF, #0010B3)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                        />
                        <span className="author-name text-xs text-gray-500">
                          {post.user.nickname || post.user.username}
                        </span>
                      </div>
                      <div className="card-stats flex gap-3">
                        <span className="stat flex items-center gap-1 text-xs text-gray-400">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                          </svg>
                          {post.likesCount}
                        </span>
                        <span className="stat flex items-center gap-1 text-xs text-gray-400">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                          </svg>
                          {post.commentsCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <AnimatePresence>
        {selectedPost && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
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
                className="modal-close absolute top-5 left-5 w-12 h-12 bg-[rgba(15,154,255,0.25)] backdrop-blur-[20px] border border-[rgba(15,154,255,0.3)] rounded-full text-[#0F9AFF] cursor-pointer flex items-center justify-center z-[300] transition-all duration-300 hover:bg-[rgba(15,154,255,0.4)] hover:border-[rgba(15,154,255,0.5)] hover:scale-105"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseModal();
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </motion.button>

              <div className="modal-content flex h-[90vh]">
                <div className="modal-left w-3/5 h-full bg-gray-900 relative" onDoubleClick={handleDoubleClick}>
                  <div className="image-carousel w-full h-full relative">
                    {/* 点击左半部分切换上一张 */}
                    <div 
                      className="absolute left-0 top-0 w-1/2 h-full cursor-pointer z-10"
                      onClick={() => {
                        if (currentImageIndex > 0) {
                          setCurrentImageIndex(prev => prev - 1);
                        }
                      }}
                    />
                    {/* 点击右半部分切换下一张 */}
                    <div 
                      className="absolute right-0 top-0 w-1/2 h-full cursor-pointer z-10"
                      onClick={() => {
                        if (currentImageIndex < getAllImages(selectedPost).length - 1) {
                          setCurrentImageIndex(prev => prev + 1);
                        }
                      }}
                    />
                    {/* 浮动爱心 */}
                    {floatingHearts.map(heart => (
                      <motion.div
                        key={heart.id}
                        initial={{ opacity: 1, scale: 0.5, y: 0 }}
                        animate={{ opacity: 0, scale: 1.5, y: -100 }}
                        transition={{ duration: 1 }}
                        className="absolute pointer-events-none z-30"
                        style={{ left: heart.x, top: heart.y, transform: 'translate(-50%, -50%)' }}
                      >
                        <svg  viewBox="0 0 1396 1024" width="48" height="48">
                          <path d="M1321.396023 350.479467a261.579628 261.579628 0 0 0-361.184682 0 261.579628 261.579628 0 0 0-361.184683 0 242.030973 242.030973 0 0 0 0 349.548578l316.036597 305.796825a65.162185 65.162185 0 0 0 90.296171 0L1321.396023 698.166268a241.100085 241.100085 0 0 0 0-347.686801z" fill="#FD140B"/>
                          <path d="M558.533014 738.194467a294.626165 294.626165 0 0 1 0-425.881423A319.294707 319.294707 0 0 1 960.211341 279.266507a314.174821 314.174821 0 0 1 118.688265-46.544418 304.400493 304.400493 0 0 0-82.383619-139.633253 325.810925 325.810925 0 0 0-451.480854 0 325.810925 325.810925 0 0 0-451.480853 0 302.073272 302.073272 0 0 0 0 437.052084l406.332768 393.300331a65.162185 65.162185 0 0 0 90.296171 0l79.12551-76.332846z" fill="#FD140B"/>
                        </svg>
                      </motion.div>
                    ))}
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
                              ? `url(http://localhost:3000${imageUrl})`
                              : getGradient(index),
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
                            : `http://localhost:3000${images[currentImageIndex]}`;
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
                      <div 
                        className="author-avatar-lg w-12 h-12 rounded-full overflow-hidden"
                        style={{
                          background: selectedPost.user.avatarUrl
                            ? `url(http://localhost:3000${selectedPost.user.avatarUrl})`
                            : 'linear-gradient(to-r, #0F9AFF, #0010B3)',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      />
                      <div className="author-info flex flex-col">
                        <span className="author-name-lg text-sm font-semibold text-gray-800">
                          {selectedPost.user.nickname || selectedPost.user.username}
                        </span>
                        <span className="author-location text-xs text-gray-400 mt-0.5">
                          {selectedPost.destination || '未知地点'}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleFollowClick(selectedPost.user.id)}
                      className={`follow-btn-lg px-6 py-2 border-none rounded-[24px] text-sm font-medium cursor-pointer transition-all duration-300 hover:scale-105 ${
                        followedUsers.has(selectedPost.user.id)
                          ? 'bg-green-500 text-white hover:shadow-[0_4px_16px_rgba(34,197,94,0.4)]'
                          : 'bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] text-white hover:shadow-[0_4px_16px_rgba(15,154,255,0.4)]'
                      }`}
                    >
                      {followedUsers.has(selectedPost.user.id) ? '已关注' : '关注'}
                    </button>
                  </div>
                  
                  {/* 错误提示（不能关注自己） */}
                  <AnimatePresence>
                    {followErrorMsg && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="px-5 py-2 bg-red-50 border-b border-red-100"
                      >
                        <p className="text-sm text-red-500 text-center">{followErrorMsg}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

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
                        const isReply = comment.content.startsWith('@');
                        const replyOffset = isReply ? 'ml-10' : '';
                        return (
                        <div key={comment.id} className={`comment flex flex-col gap-2 ${replyOffset}`}>
                          <div className="comment-author flex items-center gap-2">
                            <div 
                              className="comment-avatar w-8 h-8 rounded-full overflow-hidden"
                              style={{
                                background: comment.avatarUrl
                                  ? `url(http://localhost:3000${comment.avatarUrl})`
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
                        )})}
                    </div>
                  </div>

                  <div className="post-actions-bar px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-4">
                    <div className="comment-input-container flex-1 flex gap-2.5">
                      <input
                        type="text"
                        className="comment-input flex-1 px-4 py-2.5 bg-gray-50 border-none rounded-[20px] text-sm outline-none transition-all duration-300 focus:bg-white focus:shadow-[0_0_0_2px_rgba(15,154,255,0.2)] placeholder:text-gray-400"
                        placeholder="写下你的评论..."
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmitComment())}
                      />
                      <button
                        className="comment-submit w-10 h-10 bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] text-white border-none rounded-full cursor-pointer flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-[0_4px_16px_rgba(15,154,255,0.4)]"
                        onClick={handleSubmitComment}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="22" y1="2" x2="11" y2="13"/>
                          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                        </svg>
                      </button>
                    </div>

                    <div className="action-icons flex items-center gap-5">
                      <button 
                        className={`action-icon-btn flex flex-col items-center gap-1 bg-none border-none cursor-pointer transition-all duration-200 hover:scale-105 ${likedPosts.has(selectedPost.id) ? 'text-red-500' : 'text-gray-500 hover:text-red-400'}`}
                        onClick={handleLike}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill={likedPosts.has(selectedPost.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                        <span className="text-xs text-gray-400">{selectedPost.likesCount}</span>
                      </button>
                      <button className="action-icon-btn flex flex-col items-center gap-1 bg-none border-none text-gray-500 cursor-pointer transition-all duration-200 hover:scale-105 hover:text-[#0F9AFF]">
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

      <AnimatePresence>
        {showAiModal && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseAiModal}
            />
            <motion.div
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[900px] bg-white rounded-2xl overflow-hidden z-50 shadow-[0_25px_80px_rgba(0,0,0,0.3)]"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ai-modal-header bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] px-6 py-4 flex items-center justify-between">
                <div className="ai-title flex items-center gap-2.5">
                  <div className="ai-icon w-10 h-10 bg-white/20 backdrop-blur-[10px] rounded-xl flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                      <path d="M2 17l10 5 10-5"/>
                      <path d="M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <div className="ai-info">
                    <h3 className="text-white font-semibold">AI 旅行顾问</h3>
                    <p className="text-white/70 text-xs">智能规划您的完美旅程</p>
                  </div>
                </div>
                <button
                  className="ai-close w-10 h-10 bg-white/20 backdrop-blur-[10px] rounded-full flex items-center justify-center text-white cursor-pointer transition-all duration-200 hover:bg-white/30"
                  onClick={handleCloseAiModal}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              <div className="ai-modal-body h-[60vh] overflow-y-auto p-6">
                {aiResponse ? (
                  <div className="ai-response">
                    <div className="response-header flex items-center gap-2.5 mb-3">
                      <div className="ai-avatar w-10 h-10 bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] rounded-xl flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                          <path d="M2 17l10 5 10-5"/>
                          <path d="M2 12l10 5 10-5"/>
                        </svg>
                      </div>
                      <span className="text-sm font-semibold text-gray-800">AI 旅行顾问</span>
                    </div>
                    <div className="response-content bg-[rgba(15,154,255,0.06)] rounded-xl p-4 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {aiResponse}
                    </div>
                  </div>
                ) : isAiLoading ? (
                  <div className="loading-container flex flex-col items-center justify-center h-full">
                    <div className="loading-spinner w-12 h-12 border-4 border-[#0F9AFF]/20 rounded-full border-t-[#0F9AFF] animate-spin"></div>
                    <p className="mt-4 text-gray-500 text-sm">AI 正在为您规划路线...</p>
                  </div>
                ) : (
                  <div className="welcome-content flex flex-col items-center justify-center h-full text-center">
                    <div className="welcome-icon w-20 h-20 bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] rounded-2xl flex items-center justify-center mb-4 shadow-[0_8px_24px_rgba(15,154,255,0.3)]">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                        <path d="M2 17l10 5 10-5"/>
                        <path d="M2 12l10 5 10-5"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">欢迎使用 AI 旅行顾问</h3>
                    <p className="text-gray-500 text-sm mb-6">输入您的旅行需求，我将为您智能规划最佳路线</p>
                    <div className="suggestions flex flex-wrap gap-2 justify-center">
                      {['云南旅行攻略', '三亚5日游', '美食推荐', '酒店推荐'].map((suggestion) => (
                        <button
                          key={suggestion}
                          className="suggest-btn px-4 py-2 bg-[rgba(15,154,255,0.06)] text-[#0F9AFF] rounded-lg text-sm cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-[#0F9AFF] hover:to-[#0010B3] hover:text-white"
                          onClick={() => setAiInput(suggestion)}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="ai-modal-footer px-6 py-4 border-t border-gray-100">
                <div className="ai-input-container flex gap-3">
                  <input
                    type="text"
                    className="ai-modal-input flex-1 px-4 py-3 border border-[rgba(15,154,255,0.2)] rounded-xl text-sm outline-none transition-all duration-300 focus:border-[#0F9AFF] focus:shadow-[0_0_0_3px_rgba(15,154,255,0.1)]"
                    placeholder="输入您的旅行问题..."
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAskAI())}
                  />
                  <button
                    className="ai-submit-btn px-6 py-3 bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] text-white border-none rounded-xl font-medium cursor-pointer transition-all duration-300 shadow-[0_4px_16px_rgba(15,154,255,0.3)] hover:shadow-[0_6px_20px_rgba(15,154,255,0.45)]"
                    onClick={handleAskAI}
                    disabled={isAiLoading}
                  >
                    {isAiLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        思考中...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="22" y1="2" x2="11" y2="13"/>
                          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                        </svg>
                        发送
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 关注成功提示 */}
      <ShowSuccessModal 
        show={showFollowSuccess} 
        title="关注成功" 
        message="您已成功关注该用户" 
      />

      {/* 取关确认对话框 */}
      <AnimatePresence>
        {showUnfollowConfirm && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-[150]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUnfollowConfirm(false)}
            />
            <motion.div
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 z-[151] shadow-2xl w-[400px]"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-2">确定取消关注？</h3>
              <p className="text-sm text-gray-500 mb-6">取消后，您将不再收到该用户的动态更新</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUnfollowConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleUnfollowConfirm}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] text-white rounded-xl hover:shadow-lg transition-shadow"
                >
                  确定
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <TabBar hidden={!!selectedPost || showAiModal} />
    </div>
  );
}
