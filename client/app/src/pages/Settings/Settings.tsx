import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  User, Bell, Shield, Palette, Globe, 
  HelpCircle, Info, ChevronRight, LogOut, Volume2, VolumeX
} from 'lucide-react'
import { Header } from '../../components/Header/Header'
import { TabBar } from '../../components/TabBar/TabBar'

interface SettingsItem {
  id: string
  icon: React.ReactNode
  label: string
  description?: string
  action?: 'toggle' | 'navigate'
  value?: boolean
}

export function SettingsPage() {
  const [notifications, setNotifications] = useState(true)
  const [sound, setSound] = useState(true)
  
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('userInfo')
    navigate('/login')
  }

  const settingsGroups = [
    {
      title: '账户设置',
      items: [
        { 
          id: 'profile', 
          icon: <User className="h-5 w-5" strokeWidth={2} />, 
          label: '个人资料', 
          description: '管理您的个人信息',
          action: 'navigate' as const
        },
      ]
    },
    {
      title: '通知设置',
      items: [
        { 
          id: 'notifications', 
          icon: <Bell className="h-5 w-5" strokeWidth={2} />, 
          label: '消息通知', 
          description: '接收消息和更新通知',
          action: 'toggle' as const,
          value: notifications
        },
        { 
          id: 'sound', 
          icon: sound ? <Volume2 className="h-5 w-5" strokeWidth={2} /> : <VolumeX className="h-5 w-5" strokeWidth={2} />, 
          label: '声音', 
          description: '启用通知声音',
          action: 'toggle' as const,
          value: sound
        },
      ]
    },
    {
      title: '其他设置',
      items: [
        { 
          id: 'privacy', 
          icon: <Shield className="h-5 w-5" strokeWidth={2} />, 
          label: '隐私设置', 
          description: '管理您的隐私偏好',
          action: 'navigate' as const
        },
        { 
          id: 'appearance', 
          icon: <Palette className="h-5 w-5" strokeWidth={2} />, 
          label: '外观设置', 
          description: '自定义应用主题',
          action: 'navigate' as const
        },
        { 
          id: 'language', 
          icon: <Globe className="h-5 w-5" strokeWidth={2} />, 
          label: '语言', 
          description: '简体中文',
          action: 'navigate' as const
        },
      ]
    },
    {
      title: '帮助与支持',
      items: [
        { 
          id: 'help', 
          icon: <HelpCircle className="h-5 w-5" strokeWidth={2} />, 
          label: '帮助中心', 
          description: '获取使用帮助',
          action: 'navigate' as const
        },
        { 
          id: 'about', 
          icon: <Info className="h-5 w-5" strokeWidth={2} />, 
          label: '关于我们', 
          description: '了解更多信息',
          action: 'navigate' as const
        },
      ]
    },
  ]

  const handleToggle = (id: string) => {
    if (id === 'notifications') {
      setNotifications(!notifications)
    } else if (id === 'sound') {
      setSound(!sound)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      <Header showSearch={false} />
      
      <div className="sticky top-[65px] z-[99] bg-white/95 backdrop-blur-[20px] border-b border-cyan-500/8">
        <div className="mx-auto max-w-[600px] px-4">
          <div className="flex items-center gap-4 py-3"> 
            <h1 className="flex-1 text-center text-lg font-semibold text-slate-800">设置</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[600px] px-4 py-6">
        {settingsGroups.map((group) => (
          <div key={group.title} className="bg-white rounded-xl shadow-[0_2px_20px_rgba(15,154,255,0.06)] mb-4 overflow-hidden">
            <div className="px-5 py-3 bg-[#fafafa] border-b border-slate-100">
              <h2 className="text-sm font-medium text-slate-500">{group.title}</h2>
            </div>
            <div>
              {group.items.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => item.action === 'toggle' ? handleToggle(item.id) : navigate('/profile')}
                  className={`flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-[#f8fafc] transition-colors ${
                    item.action === 'navigate' ? 'border-b border-slate-50 last:border-0' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-[rgba(15,154,255,0.08)] flex items-center justify-center text-[#0F9AFF]">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-800">{item.label}</div>
                    {item.description && (
                      <div className="text-sm text-slate-400 mt-0.5">{item.description}</div>
                    )}
                  </div>
                  {item.action === 'toggle' ? (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggle(item.id)
                      }}
                      className={`w-12 h-7 rounded-full transition-colors ${
                        item.value ? 'bg-[#0F9AFF]' : 'bg-slate-200'
                      }`}
                    >
                      <motion.div
                        className="w-5 h-5 bg-white rounded-full shadow-md"
                        animate={{ x: item.value ? 20 : 4 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </button>
                  ) : (
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <button 
          onClick={handleLogout}
          className="w-full mt-6 py-4 bg-white rounded-xl shadow-[0_2px_20px_rgba(15,154,255,0.06)] flex items-center justify-center gap-3 text-[#ff4d4f] font-medium hover:bg-[#fff5f5] transition-colors"
        >
          <LogOut className="h-5 w-5" strokeWidth={2} />
          退出登录
        </button>

        <div className="text-center mt-6 text-sm text-slate-400">
          <div>TonaeHike v1.0.0 BETA</div>
          <div className="mt-1">© 2026 TonaeHike. All rights reserved.</div>
        </div>
      </main>

      <div className="mt-24"></div>
      
      <TabBar />
    </div>
  )
}