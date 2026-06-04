import { Bell, User, LogOut, Search, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

interface HeaderProps {
  showSearch?: boolean
  searchQuery?: string
  onSearchChange?: (query: string) => void
  onAskAI?: () => void
}

export function Header({ 
  showSearch = false, 
  searchQuery = '', 
  onSearchChange, 
  onAskAI 
}: HeaderProps = {}) {
  const API_BASE_URL = 'http://localhost:3000'
  const [showDropdown, setShowDropdown] = useState(false)
  const [inputValue, setInputValue] = useState(searchQuery)
  const [avatarUrl, setAvatarUrl] = useState(`${API_BASE_URL}/avatar/default.png`)
  const [userInfo, setUserInfo] = useState<any>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const navigate = useNavigate()

  // 加载用户信息
  const loadUserInfo = useCallback((retryCount = 0) => {
    const userInfoStr = localStorage.getItem('userInfo')
    console.log('Header: loadUserInfo called, retryCount:', retryCount)
    console.log('Header: userInfoStr from localStorage:', userInfoStr)
    
    if (userInfoStr) {
      try {
        const info = JSON.parse(userInfoStr)
        console.log('Header: parsed userInfo:', info)
        console.log('Header: avatar_url:', info.avatar_url)
        setUserInfo(info)
        const avatarPath = info.avatar_url || '/avatar/default.png';
        const url = avatarPath.startsWith('http') 
          ? avatarPath 
          : `${API_BASE_URL}${avatarPath}`
        console.log('Header: final avatarUrl:', url)
        setAvatarUrl(url)
      } catch (e) {
        console.error('解析用户信息失败:', e)
      }
    } else if (retryCount < 3) {
      // 如果没有找到用户信息，重试几次
      console.log('Header: userInfo not found, retrying...')
      setTimeout(() => loadUserInfo(retryCount + 1), 200)
    } else {
      console.log('Header: userInfo not found after retries')
    }
  }, [])

  // 组件挂载时立即加载用户信息
  useEffect(() => {
    loadUserInfo()
  }, [loadUserInfo])

  // 监听全局事件来刷新用户信息
  useEffect(() => {
    const handleUserInfoUpdate = () => {
      loadUserInfo()
    }

    window.addEventListener('userInfoUpdated', handleUserInfoUpdate)
    return () => {
      window.removeEventListener('userInfoUpdated', handleUserInfoUpdate)
    }
  }, [loadUserInfo])

  const handleSearch = () => {
    if (inputValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(inputValue.trim())}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const handleLogout = () => {
    setShowDropdown(false)
    localStorage.removeItem('userInfo')
    localStorage.removeItem('token')
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-[100] border-b border-cyan-500/8 bg-white/85 shadow-[0_2px_20px_rgba(15,154,255,0.08)] backdrop-blur-[20px]">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-8 px-6 py-3.5">
        <Link to="/main" className="flex shrink-0 items-center gap-1.5 no-underline">
          <svg width="50" height="50" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid meet">
            <g transform="translate(0.000000,800.000000) scale(0.100000,-0.100000)" fill="#0F9AFF" stroke="none">
              <path d="M3558 6189 l-31 -30 5 -122 c9 -206 84 -457 189 -640 55 -95 176 -264 202 -282 31 -22 61 -18 96 11 46 39 42 76 -15 150 -116 147 -200 306 -253 479 -34 112 -62 273 -49 281 12 8 71 -3 213 -38 209 -51 388 -122 559 -222 112 -65 120 -68 153 -55 37 14 52 38 53 81 0 28 -6 41 -27 58 -40 31 -42 30 192 91 165 43 616 102 658 86 14 -5 11 -19 -19 -94 -43 -106 -134 -283 -146 -283 -5 0 -25 11 -46 24 -79 50 -183 96 -215 96 -45 0 -77 -34 -77 -82 0 -44 15 -57 121 -111 217 -109 380 -264 492 -467 46 -83 113 -284 125 -375 10 -67 9 -71 -14 -93 -27 -26 -39 -61 -29 -92 10 -30 45 -60 72 -60 36 0 38 -24 6 -81 -19 -36 -44 -63 -82 -88 -49 -32 -61 -36 -120 -36 -48 0 -78 6 -110 23 -93 46 -165 19 -159 -61 2 -34 9 -45 37 -64 61 -41 161 -65 254 -62 68 3 94 9 148 36 126 62 218 194 239 341 12 84 0 134 -39 163 -24 18 -30 32 -41 95 -44 275 -164 524 -341 709 l-77 80 74 149 c73 148 139 327 150 409 5 36 2 46 -21 71 l-26 29 -147 -7 c-399 -18 -728 -77 -981 -176 l-101 -39 -82 38 c-94 44 -256 100 -376 130 -75 20 -324 61 -365 61 -10 0 -32 -14 -49 -31z"/>
              <path d="M3497 5209 c-30 -18 -111 -196 -142 -315 -53 -203 -48 -407 13 -584 87 -250 295 -480 558 -614 78 -41 125 -45 154 -16 53 53 34 108 -52 151 -100 50 -189 111 -263 180 -231 216 -325 489 -265 769 22 106 59 211 106 300 29 56 27 87 -8 120 -23 22 -72 26 -101 9z"/>
              <path d="M4805 4855 c-80 -18 -151 -50 -203 -93 -52 -42 -65 -70 -51 -112 21 -59 85 -67 156 -18 160 109 375 95 532 -36 24 -20 51 -36 61 -36 51 0 90 41 90 94 0 35 -83 110 -164 150 -132 64 -282 82 -421 51z"/>
              <path d="M2455 4035 c-169 -47 -360 -191 -529 -400 -335 -412 -473 -951 -342 -1334 88 -254 278 -420 546 -475 199 -40 224 -41 1235 -41 955 0 981 1 1034 20 207 76 193 361 -23 461 -71 33 -128 32 -155 -2 -43 -55 -14 -121 64 -142 78 -22 123 -97 87 -143 l-20 -24 -597 -3 c-568 -2 -597 -2 -590 15 32 83 19 200 -29 273 -29 45 -100 95 -156 110 -19 5 -107 10 -195 10 -378 0 -465 44 -465 231 0 195 115 456 342 776 147 207 195 368 152 512 -20 69 -80 134 -141 155 -56 19 -150 19 -218 1z m165 -160 c45 -23 55 -70 36 -159 -18 -79 -57 -152 -154 -286 -195 -270 -320 -552 -342 -769 -17 -158 7 -254 85 -340 84 -93 195 -121 476 -121 199 0 235 -6 272 -47 45 -51 25 -144 -39 -184 -34 -21 -42 -21 -332 -16 -399 6 -532 31 -674 126 -246 165 -314 522 -178 932 118 358 381 694 648 828 98 49 156 60 202 36z"/>
              <path d="M3153 3671 c-307 -237 -501 -568 -554 -940 -12 -87 -12 -92 7 -118 26 -34 62 -44 102 -27 34 14 40 30 61 164 14 90 68 255 112 342 84 168 234 344 394 463 72 54 80 64 83 97 4 50 -31 88 -82 88 -27 0 -52 -14 -123 -69z"/>
              <path d="M5007 3553 c-4 -3 -7 -42 -7 -85 l0 -78 600 0 c582 0 600 -1 600 -19 0 -10 -11 -101 -25 -202 -47 -349 -104 -785 -130 -984 -15 -110 -28 -208 -31 -217 -5 -17 -39 -18 -525 -18 -285 0 -519 3 -519 8 0 4 -18 138 -40 297 -22 160 -56 405 -76 545 -19 140 -48 354 -65 475 -34 251 -41 268 -106 273 -34 3 -44 -1 -62 -24 -11 -15 -21 -37 -21 -50 0 -22 32 -262 115 -869 36 -260 78 -579 95 -709 15 -122 -51 -111 678 -111 l627 -1 28 27 c17 18 27 38 27 58 0 16 9 90 19 163 11 73 36 257 55 408 20 151 40 309 46 350 25 183 90 684 90 697 0 8 -13 28 -29 44 l-29 29 -655 0 c-359 0 -657 -3 -660 -7z"/>
              <path d="M5138 2866 c-24 -18 -39 -63 -32 -92 13 -50 32 -54 257 -54 207 0 208 0 232 25 16 15 25 36 25 55 0 19 -9 40 -25 55 -24 25 -24 25 -232 25 -155 -1 -212 -4 -225 -14z"/>
            </g>
          </svg>
          <span className="bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] bg-clip-text text-xl font-bold text-transparent">
            TonaeHike
          </span>
        </Link>

        {showSearch && (
          <div className="flex-1 max-w-[640px]">
            <div className="flex items-center bg-[rgba(247,248,250,0.9)] backdrop-blur-[10px] rounded-[48px] px-3 py-2 border border-[rgba(15,154,255,0.1)] transition-all duration-300 hover:bg-[rgba(240,243,247,0.95)] hover:border-[rgba(15,154,255,0.2)] focus-within:bg-white focus-within:border-[#0F9AFF] focus-within:shadow-[0_0_0_4px_rgba(15,154,255,0.08)]">
              <button 
                type="button"
                onClick={handleSearch}
                className="w-[38px] h-[38px] flex items-center justify-center bg-[rgba(15,154,255,0.1)] rounded-full text-[#0F9AFF] cursor-pointer transition-all duration-200 hover:bg-[rgba(15,154,255,0.2)] active:scale-95"
              >
                <Search className="h-[18px] w-[18px]" strokeWidth={2} />
              </button>
              <input
                type="text"
                placeholder="搜索目的地、攻略或话题"
                className="flex-1 border-none bg-transparent outline-none px-4 py-2.5 text-base text-gray-800 placeholder:text-gray-400"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value)
                  onSearchChange?.(e.target.value)
                }}
                onKeyDown={handleKeyDown}
              />
              <div className="w-px h-6 bg-[rgba(15,154,255,0.12)] mx-2" />
              <button
                type="button"
                className="flex items-center gap-1.5 bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] text-white border-none px-4 py-2.5 rounded-[24px] text-sm font-medium cursor-pointer transition-all duration-300 shadow-[0_4px_16px_rgba(15,154,255,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,154,255,0.45)]"
                onClick={onAskAI}
              >
                <Sparkles className="h-[18px] w-[18px]" strokeWidth={2} />
                问AI
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Link
            to="/notification"
            className="flex items-center gap-2 rounded-3xl border border-cyan-500/10 bg-slate-50/80 px-4 py-2.5 text-sm text-slate-600 backdrop-blur-[10px] transition-all hover:border-cyan-500/20 hover:bg-cyan-50/90 hover:text-cyan-500 no-underline"
          >
            <Bell className="h-4 w-4" />
            消息与通知
          </Link>

          <div
            ref={menuRef}
            className="relative"
          >
            <button
              type="button"
              onClick={() => setShowDropdown((value) => !value)}
              aria-expanded={showDropdown}
              aria-haspopup="menu"
              className="h-10 w-10 cursor-pointer overflow-hidden rounded-full border-2 border-cyan-500 transition-all hover:scale-105 hover:border-[#0077FF]"
            >
              <img
                src={avatarUrl}
                alt="用户头像"
                className="h-full w-full object-cover"
              />
            </button>

            {showDropdown ? (
              <div className="absolute right-0 top-[calc(100%+4px)] z-[1000] min-w-[180px] rounded-xl bg-white opacity-100 shadow-[0_4px_20px_rgba(0,0,0,0.12)] transition-all">
                <Link
                  to="/profile"
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-800 no-underline transition-colors hover:bg-cyan-500/8"
                >
                  <User className="h-4 w-4" strokeWidth={2} />
                  个人中心
                </Link>
                <div className="mx-0 my-1 h-px bg-slate-100" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 border-none bg-transparent px-4 py-3 text-left text-sm text-slate-800 transition-colors hover:bg-rose-500/8 hover:text-rose-600"
                >
                  <LogOut className="h-4 w-4" strokeWidth={2} />
                  退出登录
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}