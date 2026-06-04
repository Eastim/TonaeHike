import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  MessageCircle, Bell, Send, Paperclip, MoreHorizontal, 
  User, Check, ArrowLeft, X
} from 'lucide-react'
import { Header } from '../../components/Header/Header'

interface MessageItem {
  id: string
  name: string
  avatar: string
  preview: string
  time: string
  unread: number
  isOnline: boolean
}

interface NotificationItem {
  id: string
  type: 'like' | 'comment' | 'follow' | 'system' | 'system-warning' | 'system-success'
  category: 'like' | 'comment' | 'follow' | 'system'
  content: string
  detail?: string
  time: string
  highlight: string
}

const mockMessages: MessageItem[] = [
  {
    id: '1',
    name: '旅行家小王',
    avatar: '',
    preview: '你的攻略太棒了！我下个月也要去云南...',
    time: '5分钟前',
    unread: 2,
    isOnline: true
  },
  {
    id: '2',
    name: '吃货小分队',
    avatar: '',
    preview: '成都火锅清单已更新，快来看看！',
    time: '1小时前',
    unread: 0,
    isOnline: true
  },
  {
    id: '3',
    name: '云南通',
    avatar: '',
    preview: '丽江的天气最近很不错，适合出行',
    time: '昨天',
    unread: 0,
    isOnline: false
  },
  {
    id: '4',
    name: '摄影大师',
    avatar: '',
    preview: '稻城亚丁的照片我整理好了，发你看看',
    time: '昨天',
    unread: 1,
    isOnline: true
  },
  {
    id: '5',
    name: '民宿达人',
    avatar: '',
    preview: '你预订的杭州民宿已确认，期待你的入住',
    time: '2天前',
    unread: 0,
    isOnline: false
  }
]

const mockNotifications: NotificationItem[] = [
  {
    id: '1',
    type: 'system-warning',
    category: 'system',
    content: '你的帖子「云南旅游攻略」审核未通过',
    detail: '原因：内容包含违规信息，请修改后重新发布',
    time: '3分钟前',
    highlight: '云南旅游攻略'
  },
  {
    id: '2',
    type: 'system-success',
    category: 'system',
    content: '你的帖子「成都美食指南」已通过审核',
    time: '1小时前',
    highlight: '成都美食指南'
  },
  {
    id: '3',
    type: 'like',
    category: 'like',
    content: '背包客阿强 赞了你发布的「云南大理古城深度游攻略」',
    time: '2分钟前',
    highlight: '背包客阿强'
  },
  {
    id: '4',
    type: 'comment',
    category: 'comment',
    content: '海边少女 在你的帖子下评论：「太美了！收藏了」',
    time: '15分钟前',
    highlight: '海边少女'
  },
  {
    id: '5',
    type: 'follow',
    category: 'follow',
    content: '樱花少女 关注了你',
    time: '30分钟前',
    highlight: '樱花少女'
  },
  {
    id: '6',
    type: 'system',
    category: 'system',
    content: '你的行程「日本关西7日游」已更新，新增奈良公园景点推荐',
    time: '1小时前',
    highlight: '日本关西7日游'
  },
  {
    id: '7',
    type: 'like',
    category: 'like',
    content: '火锅控 赞了你发布的「成都必吃美食清单」',
    time: '2小时前',
    highlight: '火锅控'
  },
  {
    id: '8',
    type: 'comment',
    category: 'comment',
    content: '历史迷 回复了你的评论：「好的，下次去试试！」',
    time: '昨天',
    highlight: '历史迷'
  },
  {
    id: '9',
    type: 'follow',
    category: 'follow',
    content: '泰美丽 关注了你',
    time: '2天前',
    highlight: '泰美丽'
  },
  {
    id: '10',
    type: 'system',
    category: 'system',
    content: '本周热门目的地推荐：三亚、云南、西安',
    time: '昨天',
    highlight: '三亚'
  }
]

interface ChatMessage {
  id: string
  type: 'sent' | 'received'
  content: string
  time: string
}

const mockChatMessages: ChatMessage[] = [
  { id: '1', type: 'received', content: '嗨！我看到你发布的云南攻略了，写得好详细啊！', time: '昨天 14:30' },
  { id: '2', type: 'sent', content: '谢谢！花了不少时间整理的，希望对你有帮助', time: '昨天 14:32' },
  { id: '3', type: 'received', content: '肯定有帮助的！我下个月也要去云南，想问问你大理和丽江哪个更值得去？', time: '昨天 14:35' },
  { id: '4', type: 'sent', content: '两个地方风格不太一样。大理比较悠闲，适合慢生活，洱海骑行、古城漫步都很舒服。丽江商业化稍微重一点，但夜景很美，玉龙雪山也值得一去。时间充裕的话建议都去看看！', time: '昨天 14:40' },
  { id: '5', type: 'received', content: '你的攻略太棒了！我下个月也要去云南，有什么需要特别注意的吗？', time: '5分钟前' }
]

export function NotificationPage() {
  const [activeTab, setActiveTab] = useState<'messages' | 'notifications'>('messages')
  const [selectedMessage, setSelectedMessage] = useState<MessageItem | null>(mockMessages[0])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState(mockChatMessages)
  const [showModal, setShowModal] = useState(false)
  const [modalContent, setModalContent] = useState<NotificationItem | null>(null)
  const navigate = useNavigate()

  const filteredNotifications = selectedCategory === 'all' 
    ? mockNotifications 
    : mockNotifications.filter(n => n.category === selectedCategory)

  const handleSendMessage = () => {
    if (chatInput.trim()) {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'sent',
        content: chatInput,
        time: '刚刚'
      }
      setChatMessages([...chatMessages, newMessage])
      setChatInput('')
    }
  }

  const handleNotificationClick = (notification: NotificationItem) => {
    setModalContent(notification)
    setShowModal(true)
  }

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'like':
        return <HeartIcon />
      case 'comment':
        return <MessageCircle className="h-[20px] w-[20px]" strokeWidth={2} />
      case 'follow':
        return <UserIcon />
      case 'system':
        return <Bell className="h-[20px] w-[20px]" strokeWidth={2} />
      case 'system-warning':
        return <Bell className="h-[20px] w-[20px]" strokeWidth={2} />
      case 'system-success':
        return <Check className="h-[20px] w-[20px]" strokeWidth={2} />
    }
  }

  const getNotificationIconClass = (type: NotificationItem['type']) => {
    switch (type) {
      case 'like':
        return 'bg-[rgba(255,71,87,0.1)] text-[#FF4757]'
      case 'comment':
        return 'bg-[rgba(15,154,255,0.1)] text-[#0F9AFF]'
      case 'follow':
        return 'bg-[rgba(46,213,115,0.1)] text-[#2ED573]'
      case 'system':
        return 'bg-[rgba(15,154,255,0.1)] text-[#0F9AFF]'
      case 'system-warning':
        return 'bg-[rgba(255,107,107,0.15)] text-[#FF6B6B]'
      case 'system-success':
        return 'bg-[rgba(46,213,115,0.15)] text-[#2ED573]'
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <Header showSearch={false} />
      
      <div className="sticky top-[65px] z-[99] bg-white/95 backdrop-blur-[20px] border-b border-cyan-500/8">
        <div className="mx-auto max-w-[1000px] px-4">
          <div className="flex items-center gap-4 py-3">
            <button
              onClick={() => navigate('/main')}
              className="flex items-center gap-2 text-slate-600 transition-colors hover:text-cyan-500"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2} />
              <span className="text-sm font-medium">返回主页</span>
            </button>
            <div className="flex-1 flex gap-2">
              <button
                onClick={() => setActiveTab('messages')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'messages' 
                    ? 'bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] text-white shadow-[0_4px_16px_rgba(15,154,255,0.3)]' 
                    : 'bg-slate-50/80 text-slate-600 hover:bg-cyan-50/90 hover:text-cyan-500'
                }`}
              >
                <MessageCircle className="h-4 w-4" strokeWidth={2} />
                消息
                <span className="bg-[rgba(255,71,87,1)] text-white text-xs font-semibold px-2 py-0.5 rounded-full">3</span>
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'notifications' 
                    ? 'bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] text-white shadow-[0_4px_16px_rgba(15,154,255,0.3)]' 
                    : 'bg-slate-50/80 text-slate-600 hover:bg-cyan-50/90 hover:text-cyan-500'
                }`}
              >
                <Bell className="h-4 w-4" strokeWidth={2} />
                通知
                <span className="bg-[rgba(255,71,87,1)] text-white text-xs font-semibold px-2 py-0.5 rounded-full">5</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1000px] px-4 py-6">
        <div className="bg-white rounded-xl shadow-[0_4px_24px_rgba(15,154,255,0.06)] border border-cyan-500/6 overflow-hidden">
          {activeTab === 'messages' && (
            <div className="flex h-[calc(100vh-200px)] min-h-[400px]">
              <div className="w-[320px] min-w-[280px] border-r border-cyan-500/8 overflow-y-auto flex-shrink-0">
                <div className="p-2">
                  {mockMessages.map((message) => (
                    <div
                      key={message.id}
                      onClick={() => setSelectedMessage(message)}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border-b border-cyan-500/4 last:border-0 ${
                        selectedMessage?.id === message.id 
                          ? 'bg-cyan-500/6' 
                          : 'hover:bg-cyan-500/4'
                      }`}
                    >
                      <div className="relative">
                        <div className="w-13 h-13 rounded-full bg-gradient-to-r from-[#0F9AFF] to-[#0010B3]"></div>
                        {message.isOnline && (
                          <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-[#2ED573] border-2 border-white rounded-full"></span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-slate-800">{message.name}</span>
                          <span className="text-xs text-slate-400">{message.time}</span>
                        </div>
                        <p className="text-sm text-slate-500 truncate">{message.preview}</p>
                      </div>
                      {message.unread > 0 && (
                        <span className="bg-gradient-to-r from-[#FF4757] to-[#FF6B81] text-white text-xs font-semibold w-5.5 h-5.5 flex items-center justify-center rounded-full">
                          {message.unread}
                        </span>
                      )}
                      {message.unread === 0 && (
                        <Check className="h-4 w-4 text-cyan-500" strokeWidth={2} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 flex flex-col bg-[#fafbfc]">
                {selectedMessage && (
                  <>
                    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-cyan-500/8">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#0F9AFF] to-[#0010B3]"></div>
                          {selectedMessage.isOnline && (
                            <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-[#2ED573] border-2 border-white rounded-full"></span>
                          )}
                        </div>
                        <div>
                          <span className="block text-sm font-semibold text-slate-800">{selectedMessage.name}</span>
                          <span className="text-xs text-[#2ED573]">在线</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-cyan-100 hover:text-cyan-500 transition-colors">
                          <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
                        </button>
                        <button className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-cyan-100 hover:text-cyan-500 transition-colors">
                          <User className="h-4 w-4" strokeWidth={2} />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4">
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex flex-col max-w-[70%] ${msg.type === 'sent' ? 'self-end items-end' : 'self-start items-start'}`}
                        >
                          <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                            msg.type === 'sent' 
                              ? 'bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] text-white rounded-br-md' 
                              : 'bg-white text-slate-800 rounded-bl-md shadow-[0_2px_8px_rgba(15,154,255,0.06)]'
                          }`}>
                            {msg.content}
                          </div>
                          <span className="text-xs text-slate-400 mt-1 px-1">{msg.time}</span>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-white border-t border-cyan-500/8">
                      <div className="flex items-center gap-3">
                        <button className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-cyan-500 hover:bg-cyan-50 transition-all">
                          <Paperclip className="h-5 w-5" strokeWidth={2} />
                        </button>
                        <input
                          type="text"
                          placeholder="输入消息..."
                          className="flex-1 px-4 py-2.5 rounded-full bg-slate-50 border border-cyan-500/10 text-sm outline-none focus:border-cyan-500/40 focus:bg-white transition-all"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <button
                          onClick={handleSendMessage}
                          className="w-11 h-11 rounded-full bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] flex items-center justify-center text-white shadow-[0_4px_16px_rgba(15,154,255,0.3)] hover:opacity-90 hover:scale-105 active:scale-95 transition-all"
                        >
                          <Send className="h-5 w-5" strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <div className="flex gap-2 p-4 bg-slate-50/50 border-b border-cyan-500/8">
                {['all', 'comment', 'like', 'follow', 'system'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${
                      selectedCategory === cat 
                        ? 'bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] text-white' 
                        : 'bg-transparent text-slate-500 hover:bg-cyan-50 hover:text-cyan-500'
                    }`}
                  >
                    {cat === 'all' ? '全部' : cat === 'comment' ? '评论和@' : cat === 'like' ? '赞和收藏' : cat === 'follow' ? '新增关注' : '系统通知'}
                  </button>
                ))}
              </div>

              {(selectedCategory === 'all' || selectedCategory === 'system') && (
                <div className="px-5 border-b border-cyan-500/8">
                  <div className="flex items-center gap-2 py-4 text-sm font-semibold text-[#FF6B6B]">
                    <Bell className="h-4 w-4" strokeWidth={2} />
                    系统通知
                  </div>
                  {filteredNotifications.filter(n => ['system-warning', 'system-success'].includes(n.type)).map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`flex gap-4 p-4 rounded-xl cursor-pointer transition-all border-l-3 ${
                        notification.type === 'system-warning' 
                          ? 'bg-[rgba(255,107,107,0.05)] border-[#FF6B6B]' 
                          : 'bg-white hover:bg-cyan-500/4'
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${getNotificationIconClass(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-800 leading-relaxed">
                          {notification.content.split(notification.highlight).map((part, i) => (
                            <span key={i}>
                              {part}
                              {i < notification.content.split(notification.highlight).length - 1 && (
                                <span className="text-[#0F9AFF] font-semibold">{notification.highlight}</span>
                              )}
                            </span>
                          ))}
                        </p>
                        {notification.detail && (
                          <p className="text-sm text-[#FF6B6B] mt-1">{notification.detail}</p>
                        )}
                        <span className="text-xs text-slate-400 mt-1 block">{notification.time}</span>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-gradient-to-r from-[#FF4757] to-[#FF6B81] mt-5"></span>
                    </div>
                  ))}
                </div>
              )}

              <div className="px-5">
                <div className="py-4 text-sm font-semibold text-slate-400">互动通知</div>
                <div className="p-2">
                  {filteredNotifications.filter(n => !['system-warning', 'system-success'].includes(n.type)).map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className="flex gap-4 p-4 rounded-xl cursor-pointer transition-all hover:bg-cyan-500/4 border-b border-cyan-500/4 last:border-0"
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${getNotificationIconClass(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-800 leading-relaxed">
                          {notification.content.split(notification.highlight).map((part, i) => (
                            <span key={i}>
                              {part}
                              {i < notification.content.split(notification.highlight).length - 1 && (
                                <span className="text-[#0F9AFF] font-semibold">{notification.highlight}</span>
                              )}
                            </span>
                          ))}
                        </p>
                        <span className="text-xs text-slate-400 mt-1 block">{notification.time}</span>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-gradient-to-r from-[#FF4757] to-[#FF6B81] mt-5"></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {showModal && modalContent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={() => setShowModal(false)}>
          <div 
            className="bg-white rounded-xl w-[90%] max-w-[400px] overflow-hidden" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center p-5 border-b border-cyan-500/8">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getNotificationIconClass(modalContent.type)}`}>
                {getNotificationIcon(modalContent.type)}
              </div>
              <div className="flex-1 ml-3">
                <span className="text-base font-semibold text-slate-800">
                  {modalContent.type === 'like' ? '收到点赞' : 
                   modalContent.type === 'comment' ? '收到评论' : 
                   modalContent.type === 'follow' ? '新增关注' : 
                   modalContent.type === 'system-warning' ? '帖子审核未通过' : 
                   modalContent.type === 'system-success' ? '帖子审核通过' : '系统通知'}
                </span>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-full hover:bg-slate-100 transition-colors">
                <X className="h-5 w-5 text-slate-400" strokeWidth={2} />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-800 leading-relaxed">
                {modalContent.content.split(modalContent.highlight).map((part, i) => (
                  <span key={i}>
                    {part}
                    {i < modalContent.content.split(modalContent.highlight).length - 1 && (
                      <span className="text-[#0F9AFF] font-semibold">{modalContent.highlight}</span>
                    )}
                  </span>
                ))}
              </p>
              {modalContent.detail && (
                <p className="text-sm text-[#FF6B6B] mt-3 p-3 bg-[rgba(255,107,107,0.08)] rounded-lg">{modalContent.detail}</p>
              )}
              <span className="text-xs text-slate-400 mt-3 block">{modalContent.time}</span>
            </div>
            <div className="flex gap-3 p-4 border-t border-cyan-500/8">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-50 text-slate-600 text-sm font-medium hover:bg-cyan-50 transition-colors"
              >
                知道了
              </button>
              <button className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] text-white text-sm font-medium hover:opacity-90 transition-opacity">
                {modalContent.type === 'system-warning' ? '去修改' : '查看详情'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="8.5" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}