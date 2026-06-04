import { motion } from 'framer-motion';
import { Home, Map, Plus, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface TabBarProps {
  hidden?: boolean;
}

const tabs = [
  { id: 'home', label: '首页', icon: Home, path: '/main' },
  { id: 'trip', label: '我的路线', icon: Map, path: '/trip-home' },
  { id: 'post', label: '发帖', icon: Plus, path: '/post' },
  { id: 'settings', label: '设置', icon: Settings, path: '/settings' },
];

export function TabBar({ hidden = false }: TabBarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-50"
      initial={{ y: 0 }}
      animate={{
        y: hidden ? 100 : 0,
      }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      <div className="max-w-[1400px] mx-auto px-6 pb-4">
        <motion.div
          className="bg-white/20 backdrop-blur-[20px] rounded-2xl border border-white/30 shadow-[0_-8px_32px_rgba(15,154,255,0.12)] px-2 py-2 flex items-center justify-around"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: hidden ? 0 : 1, scale: hidden ? 0.9 : 1 }}
          transition={{ duration: 0.2 }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.path);
            
            return (
              <motion.button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={`flex flex-col items-center gap-1 px-8 py-3 rounded-xl transition-all duration-300 ${
                  active
                    ? 'bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] text-white shadow-[0_4px_16px_rgba(15,154,255,0.4)]'
                    : 'text-gray-500 hover:text-[#0F9AFF] hover:bg-white/30'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={{
                    scale: active ? 1.1 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <Icon className="w-6 h-6" strokeWidth={active ? 2.5 : 2} />
                </motion.div>
                <span className="text-xs font-medium">{tab.label}</span>
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
}
