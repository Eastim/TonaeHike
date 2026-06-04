import { motion, AnimatePresence } from 'framer-motion';

interface ShowSuccessModalProps {
  show: boolean;
  title?: string;
  message?: string;
}

export function ShowSuccessModal({ 
  show, 
  title = '操作成功', 
  message = '操作已完成' 
}: ShowSuccessModalProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', damping: 15 }}
              className="w-16 h-16 rounded-full bg-gradient-to-r from-[#0F9AFF] to-[#0010B3] flex items-center justify-center"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </motion.div>
            <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
            <p className="text-gray-500 text-sm">{message}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ShowSuccessModal;
