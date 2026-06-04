import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { TripPlannerPage } from './pages/TripPlanner/TripPlannerPage'
import { TripHomePage } from './pages/TripHome/TripHomePage'
import TonaeHike from './pages/TonaeHike/TonaeHike'
import LoginPage from './pages/login&reg/login'
import RegPage from './pages/login&reg/reg'
import ForgetPwPage from './pages/login&reg/forgetPw'
import MainPage from './pages/main/main'
import { PostPage } from './pages/Post/Post'
import { NotificationPage } from './pages/Notification/notification'
import { ProfilePage } from './pages/Profile/Profile'
import { SettingsPage } from './pages/Settings/Settings'
import { SearchResultPage } from './pages/SearchResult/SearchResult'

const pageVariants = {
  initial: { opacity: 0, x: 300 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -300 }
}

const pageVariantsReverse = {
  initial: { opacity: 0, x: -300 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 300 }
}

const pageVariantsFade = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
}

// 首页到登录页的特殊过渡动画 - 保持与首页动效风格一致
const homeToLoginVariants = {
  initial: { opacity: 0, y: 50, scale: 0.95 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1 
  },
  exit: { 
    opacity: 0, 
    y: -50, 
    scale: 0.95 
  }
}

// 登录页返回首页的过渡动画
const loginToHomeVariants = {
  initial: { opacity: 0, y: -50, scale: 0.95 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1 
  },
  exit: { 
    opacity: 0, 
    y: 50, 
    scale: 0.95 
  }
}

interface AnimatedRouteProps {
  children: React.ReactNode
  path: string
}

function AnimatedRoute({ children, path }: AnimatedRouteProps) {
  const location = useLocation()
  const isMainToTrip = location.pathname === '/trip-home' && document.referrer?.includes('/main')
  const isTripToMain = location.pathname === '/main' && document.referrer?.includes('/trip-home')
  
  // 首页到登录页的特殊过渡
  const isHomeToLogin = location.pathname === '/login' && document.referrer === 'http://localhost:5173/'
  
  // 登录页返回首页的特殊过渡
  const isLoginToHome = location.pathname === '/' && document.referrer?.includes('/login')
  
  if (isHomeToLogin) {
    return (
      <motion.div
        key={location.pathname}
        variants={homeToLoginVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {children}
      </motion.div>
    )
  }
  
  if (isLoginToHome) {
    return (
      <motion.div
        key={location.pathname}
        variants={loginToHomeVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {children}
      </motion.div>
    )
  }
  
  if (path === '/main' && isTripToMain) {
    return (
      <motion.div
        key={location.pathname}
        variants={pageVariantsReverse}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        {children}
      </motion.div>
    )
  }
  
  if (path === '/trip-home' && isMainToTrip) {
    return (
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        {children}
      </motion.div>
    )
  }
  
  return (
    <motion.div
      key={location.pathname}
      variants={pageVariantsFade}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      {children}
    </motion.div>
  )
}

function AppContent() {
  const location = useLocation()
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <AnimatedRoute path="/">
            <TonaeHike />
          </AnimatedRoute>
        } />
        <Route path="/trip-planner" element={
          <AnimatedRoute path="/trip-planner">
            <TripPlannerPage />
          </AnimatedRoute>
        } />
        <Route path="/main" element={
          <AnimatedRoute path="/main">
            <MainPage />
          </AnimatedRoute>
        } />
        <Route path="/trip-home" element={
          <AnimatedRoute path="/trip-home">
            <TripHomePage />
          </AnimatedRoute>
        } />
        <Route path="/post" element={
          <AnimatedRoute path="/post">
            <PostPage />
          </AnimatedRoute>
        } />
        <Route path="/notification" element={
          <AnimatedRoute path="/notification">
            <NotificationPage />
          </AnimatedRoute>
        } />
        <Route path="/profile" element={
          <AnimatedRoute path="/profile">
            <ProfilePage />
          </AnimatedRoute>
        } />
        <Route path="/settings" element={
          <AnimatedRoute path="/settings">
            <SettingsPage />
          </AnimatedRoute>
        } />
        <Route path="/search" element={
          <AnimatedRoute path="/search">
            <SearchResultPage />
          </AnimatedRoute>
        } />
        <Route path="/login" element={
          <AnimatedRoute path="/login">
            <LoginPage />
          </AnimatedRoute>
        } />
        <Route path="/register" element={
          <AnimatedRoute path="/register">
            <RegPage />
          </AnimatedRoute>
        } />
        <Route path="/forget-password" element={
          <AnimatedRoute path="/forget-password">
            <ForgetPwPage />
          </AnimatedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
