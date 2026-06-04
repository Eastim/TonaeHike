import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import AnimationCharacters from '../../components/AnimationCharacters/AnimationCharacters';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:3000/api/auth';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setHasError(false);

    if (!username) {
      setError('请输入用户名');
      setHasError(true);
      setTimeout(() => setHasError(false), 2500);
      return;
    }

    if (!password || password.length < 6) {
      setError('密码至少需要6个字符');
      setHasError(true);
      setTimeout(() => setHasError(false), 2500);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.msg || '登录失败，请稍后重试');
      }

      if (data.code === 200) {
        const token = data.data?.token || '';
        console.log('Login: response data:', data);
        console.log('Login: avatarUrl from API:', data.data?.user?.avatarUrl);
        
        const userInfo = {
          id: data.data?.user?.id,
          username: data.data?.user?.username || username,
          email: data.data?.user?.email,
          avatar_url: data.data?.user?.avatarUrl || '/avatar/default.png',
          nickname: data.data?.user?.nickname,
        };
        
        console.log('Login: userInfo to save:', userInfo);

        // 保存到localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        
        // 验证保存
        const savedUserInfo = localStorage.getItem('userInfo');
        console.log('Login: userInfo saved to localStorage:', savedUserInfo);
        
        // 强制同步写入（某些浏览器可能异步写入）
        if (navigator.storage && navigator.storage.persist) {
          await navigator.storage.persist();
        }
        
        // 导航到主页
        navigate('/main');
        
        // 在导航后触发事件，确保Header组件已挂载
        setTimeout(() => {
          console.log('Login: dispatching userInfoUpdated event');
          window.dispatchEvent(new Event('userInfoUpdated'));
        }, 500);
      } else {
        setError(data.msg || '登录失败');
        setHasError(true);
        setTimeout(() => setHasError(false), 2500);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '网络错误，请稍后重试';
      setError(message);
      setHasError(true);
      setTimeout(() => setHasError(false), 2500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      className="login-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="left-panel"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="logo">
          <svg width="32" height="32" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid meet">
            <g transform="translate(0.000000,800.000000) scale(0.100000,-0.100000)" fill="#ffffff" stroke="none">
              <path d="M3558 6189 l-31 -30 5 -122 c9 -206 84 -457 189 -640 55 -95 176 -264 202 -282 31 -22 61 -18 96 11 46 39 42 76 -15 150 -116 147 -200 306 -253 479 -34 112 -62 273 -49 281 12 8 71 -3 213 -38 209 -51 388 -122 559 -222 112 -65 120 -68 153 -55 37 14 52 38 53 81 0 28 -6 41 -27 58 -40 31 -42 30 192 91 165 43 616 102 658 86 14 -5 11 -19 -19 -94 -43 -106 -134 -283 -146 -283 -5 0 -25 11 -46 24 -79 50 -183 96 -215 96 -45 0 -77 -34 -77 -82 0 -44 15 -57 121 -111 217 -109 380 -264 492 -467 46 -83 113 -284 125 -375 10 -67 9 -71 -14 -93 -27 -26 -39 -61 -29 -92 10 -30 45 -60 72 -60 36 0 38 -24 6 -81 -19 -36 -44 -63 -82 -88 -49 -32 -61 -36 -120 -36 -48 0 -78 6 -110 23 -93 46 -165 19 -159 -61 2 -34 9 -45 37 -64 61 -41 161 -65 254 -62 68 3 94 9 148 36 126 62 218 194 239 341 12 84 0 134 -39 163 -24 18 -30 32 -41 95 -44 275 -164 524 -341 709 l-77 80 74 149 c73 148 139 327 150 409 5 36 2 46 -21 71 l-26 29 -147 -7 c-399 -18 -728 -77 -981 -176 l-101 -39 -82 38 c-94 44 -256 100 -376 130 -75 20 -324 61 -365 61 -10 0 -32 -14 -49 -31z"/>
              <path d="M3497 5209 c-30 -18 -111 -196 -142 -315 -53 -203 -48 -407 13 -584 87 -250 295 -480 558 -614 78 -41 125 -45 154 -16 53 53 34 108 -52 151 -100 50 -189 111 -263 180 -231 216 -325 489 -265 769 22 106 59 211 106 300 29 56 27 87 -8 120 -23 22 -72 26 -101 9z"/>
              <path d="M4805 4855 c-80 -18 -151 -50 -203 -93 -52 -42 -65 -70 -51 -112 21 -59 85 -67 156 -18 160 109 375 95 532 -36 24 -20 51 -36 61 -36 51 0 90 41 90 94 0 35 -83 110 -164 150 -132 64 -282 82 -421 51z"/>
              <path d="M2455 4035 c-169 -47 -360 -191 -529 -400 -335 -412 -473 -951 -342 -1334 88 -254 278 -420 546 -475 199 -40 224 -41 1235 -41 955 0 981 1 1034 20 207 76 193 361 -23 461 -71 33 -128 32 -155 -2 -43 -55 -14 -121 64 -142 78 -22 123 -97 87 -143 l-20 -24 -597 -3 c-568 -2 -597 -2 -590 15 32 83 19 200 -29 273 -29 45 -100 95 -156 110 -19 5 -107 10 -195 10 -378 0 -465 44 -465 231 0 195 115 456 342 776 147 207 195 368 152 512 -20 69 -80 134 -141 155 -56 19 -150 19 -218 1z m165 -160 c45 -23 55 -70 36 -159 -18 -79 -57 -152 -154 -286 -195 -270 -320 -552 -342 -769 -17 -158 7 -254 85 -340 84 -93 195 -121 476 -121 199 0 235 -6 272 -47 45 -51 25 -144 -39 -184 -34 -21 -42 -21 -332 -16 -399 6 -532 31 -674 126 -246 165 -314 522 -178 932 118 358 381 694 648 828 98 49 156 60 202 36z"/>
              <path d="M3153 3671 c-307 -237 -501 -568 -554 -940 -12 -87 -12 -92 7 -118 26 -34 62 -44 102 -27 34 14 40 30 61 164 14 90 68 255 112 342 84 168 234 344 394 463 72 54 80 64 83 97 4 50 -31 88 -82 88 -27 0 -52 -14 -123 -69z"/>
              <path d="M5007 3553 c-4 -3 -7 -42 -7 -85 l0 -78 600 0 c582 0 600 -1 600 -19 0 -10 -11 -101 -25 -202 -47 -349 -104 -785 -130 -984 -15 -110 -28 -208 -31 -217 -5 -17 -39 -18 -525 -18 -285 0 -519 3 -519 8 0 4 -18 138 -40 297 -22 160 -56 405 -76 545 -19 140 -48 354 -65 475 -34 251 -41 268 -106 273 -34 3 -44 -1 -62 -24 -11 -15 -21 -37 -21 -50 0 -22 32 -262 115 -869 36 -260 78 -579 95 -709 15 -122 -51 -111 678 -111 l627 -1 28 27 c17 18 27 38 27 58 0 16 9 90 19 163 11 73 36 257 55 408 20 151 40 309 46 350 25 183 90 684 90 697 0 8 -13 28 -29 44 l-29 29 -655 0 c-359 0 -657 -3 -660 -7z"/>
              <path d="M5138 2866 c-24 -18 -39 -63 -32 -92 13 -50 32 -54 257 -54 207 0 208 0 232 25 16 15 25 36 25 55 0 19 -9 40 -25 55 -24 25 -24 25 -232 25 -155 -1 -212 -4 -225 -14z"/>
            </g>
          </svg>
          <span>TonaeHike</span>
        </div>

        <div className="characters-wrapper">
          <AnimationCharacters
            isTyping={isTyping}
            isPasswordFocused={isPasswordFocused}
            showPassword={showPassword}
            passwordLength={password.length}
            hasError={hasError}
          />
        </div>

        <div className="footer-links">
          <a href="#">隐私政策</a>
          <a href="#">服务条款</a>
          <a href="#">联系我们</a>
        </div>
      </motion.div>

      <motion.div 
        className="right-panel"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <motion.div
          className="form-container"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <a href="/" className="back-btn">
            <ArrowLeft className="w-5 h-5" />
            <span>返回主页</span>
          </a>

          <motion.div 
            className="sparkle-icon"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 300, delay: 0.4 }}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L13.5 9H10.5L12 2Z" fill="#2A7B97" />
              <path d="M12 22L10.5 15H13.5L12 22Z" fill="#2A7B97" />
              <path d="M2 12L9 10.5V13.5L2 12Z" fill="#2A7B97" />
              <path d="M22 12L15 13.5V10.5L22 12Z" fill="#2A7B97" />
            </svg>
          </motion.div>

          <motion.div 
            className="form-header"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <h1>用户登录</h1>
            <p>欢迎回来，继续您的旅程</p>
          </motion.div>

          <motion.form 
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="form-group">
              <label htmlFor="username">用户名</label>
              <div className="input-wrapper">
                <motion.input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                  placeholder="请输入用户名或手机号"
                  className={error && !username ? 'error' : ''}
                  whileFocus={{ scale: 1.02 }}
                  transition={{ type: 'spring', damping: 20 }}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">密码</label>
              <div className="input-wrapper">
                <motion.input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  placeholder="请输入密码"
                  className={error && (!password || password.length < 6) ? 'error' : ''}
                  whileFocus={{ scale: 1.02 }}
                  transition={{ type: 'spring', damping: 20 }}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                记住我
              </label>
              <a href="/forget-password" className="forgot-link">忘记密码？</a>
            </div>

            {error && (
              <motion.div
                className="error-msg"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {error}
              </motion.div>
            )}

            <motion.button 
              type="submit" 
              className="btn-login" 
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <span className="btn-text">{isLoading ? '登录中...' : '登 录'}</span>
              <div className="btn-hover-content">
                <span>登 录</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </motion.button>
          </motion.form>

          <motion.div 
            className="signup-link"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            还没有账号？<a href="/register">立即注册</a>
          </motion.div>
        </motion.div>
      </motion.div>

      <style>{`
        .login-page {
          display: grid;
          grid-template-columns: 1fr 1fr;
          height: 100vh;
        }

        .left-panel {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: linear-gradient(135deg, #d4d0dc 0%, #c8c4d0 50%, #bbb7c5 100%);
          padding: 40px 48px;
          overflow: hidden;
        }

        .left-panel::after {
          content: "";
          position: absolute;
          top: 20%;
          right: 15%;
          width: 260px;
          height: 260px;
          background: rgba(180, 170, 200, 0.25);
          border-radius: 50%;
          filter: blur(80px);
        }

        .left-panel::before {
          content: "";
          position: absolute;
          bottom: 15%;
          left: 10%;
          width: 350px;
          height: 350px;
          background: rgba(200, 195, 210, 0.2);
          border-radius: 50%;
          filter: blur(100px);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 16px;
          font-weight: 600;
          color: #fff;
          z-index: 10;
          position: relative;
        }

        .logo svg {
          width: 28px;
          height: 28px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
          padding: 4px;
          border-radius: 6px;
        }

        .characters-wrapper {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          height: 420px;
        }

        .footer-links {
          display: flex;
          gap: 28px;
          font-size: 13px;
          color: rgba(80, 70, 90, 0.7);
          z-index: 10;
          position: relative;
        }

        .footer-links a {
          color: inherit;
          text-decoration: none;
          transition: color 0.2s;
        }

        .footer-links a:hover {
          color: #333;
        }

        .right-panel {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          padding: 40px;
        }

        .form-container {
          width: 100%;
          max-width: 400px;
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #666;
          font-size: 13px;
          text-decoration: none;
          margin-bottom: 16px;
          transition: all 0.3s ease;
        }

        .back-btn:hover {
          color: #2A7B97;
          transform: translateX(-4px);
        }

        .sparkle-icon {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
        }

        .sparkle-icon svg {
          width: 32px;
          height: 32px;
        }

        .form-header {
          text-align: center;
          margin-bottom: 36px;
        }

        .form-header h1 {
          font-size: 28px;
          font-weight: 700;
          color: #1F1F1F;
          letter-spacing: -0.5px;
          margin-bottom: 6px;
        }

        .form-header p {
          font-size: 14px;
          color: #888;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #333;
          margin-bottom: 8px;
        }

        .input-wrapper {
          position: relative;
        }

        .form-group input {
          width: 100%;
          height: 48px;
          border: none;
          border-bottom: 1.5px solid #e0e0e0;
          padding: 0 40px 0 0;
          font-size: 15px;
          font-family: inherit;
          color: #1F1F1F;
          background: transparent;
          outline: none;
          transition: border-color 0.3s;
        }

        .form-group input:focus {
          border-bottom-color: #2A7B97;
        }

        .form-group input::placeholder {
          color: #ccc;
        }

        .form-group input.error {
          border-bottom-color: #dc2626;
        }

        .toggle-password {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #666;
          padding: 6px;
          transition: color 0.2s;
        }

        .toggle-password:hover {
          color: #333;
        }

        .form-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .remember-me {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #555;
          cursor: pointer;
        }

        .remember-me input[type="checkbox"] {
          width: 16px;
          height: 16px;
          accent-color: #2A7B97;
          cursor: pointer;
        }

        .forgot-link {
          font-size: 13px;
          color: #2A7B97;
          text-decoration: none;
          font-weight: 500;
          transition: opacity 0.2s;
        }

        .forgot-link:hover {
          opacity: 0.8;
        }

        .btn-login {
          position: relative;
          width: 100%;
          height: 50px;
          border-radius: 25px;
          border: 1.5px solid #1F1F1F;
          background: #2A7B97;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          overflow: hidden;
          margin-bottom: 14px;
          transition: all 0.3s;
        }

        .btn-login:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-text {
          display: inline-block;
          transition: all 0.3s;
        }

        .btn-hover-content {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #236A82;
          color: #fff;
          opacity: 0;
          transition: all 0.3s;
          border-radius: 25px;
        }

        .btn-login:hover:not(:disabled) .btn-text {
          transform: translateX(40px);
          opacity: 0;
        }

        .btn-login:hover:not(:disabled) .btn-hover-content {
          opacity: 1;
        }

        .error-msg {
          padding: 10px 14px;
          font-size: 13px;
          color: #dc2626;
          background: rgba(220, 38, 38, 0.08);
          border: 1px solid rgba(220, 38, 38, 0.2);
          border-radius: 10px;
          margin-bottom: 16px;
        }

        .signup-link {
          text-align: center;
          font-size: 13px;
          color: #888;
          margin-top: 32px;
        }

        .signup-link a {
          color: #2A7B97;
          font-weight: 600;
          text-decoration: none;
        }

        .signup-link a:hover {
          text-decoration: underline;
        }

        @media (max-width: 900px) {
          .login-page {
            grid-template-columns: 1fr;
          }

          .left-panel {
            display: none;
          }

          .form-container {
            max-width: 340px;
          }

          .form-header h1 {
            font-size: 24px;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default LoginPage;



