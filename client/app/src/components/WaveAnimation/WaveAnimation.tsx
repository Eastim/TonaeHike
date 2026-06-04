import { motion } from 'framer-motion';

const API_BASE_URL = 'http://localhost:3000';

interface WaveAnimationProps {
  onComplete?: () => void;
}

const WaveAnimation = ({ onComplete }: WaveAnimationProps) => {
  return (
    <motion.div
      className="fixed flex justify-center h-[120vh] w-full bg-[#469ce5] z-50"
      style={{ transform: 'translateY(-10vh)' }}
      initial={{ y: '-10vh' }}
      animate={{ y: '110vh' }}
      transition={{
        duration: 3,
        delay: 1,
        ease: 'easeOut',
      }}
      onAnimationComplete={onComplete}
    >
      <div className="absolute bottom-[120vh] left-0 right-0">
        <motion.img
          src={`${API_BASE_URL}/img/waves/wave-1.svg`}
          alt="wave"
          className="absolute bottom-[-0.1vw] left-0 w-full opacity-8"
          animate={{ y: [0, 35, 0] }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.img
          src={`${API_BASE_URL}/img/waves/wave-2.svg`}
          alt="wave"
          className="absolute bottom-[0.5vw] left-0 w-full opacity-7"
          animate={{ y: [0, 25, 0] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.img
          src={`${API_BASE_URL}/img/waves/wave-3.svg`}
          alt="wave"
          className="absolute bottom-[0.3vw] left-0 w-full opacity-6"
          animate={{ y: [0, 20, 0] }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.img
          src={`${API_BASE_URL}/img/waves/wave-4.svg`}
          alt="wave"
          className="absolute bottom-[0.1vw] left-0 w-full opacity-5"
          animate={{ y: [0, 20, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <img
          src={`${API_BASE_URL}/img/waves/wave-5.svg`}
          alt="wave"
          className="absolute bottom-[-1vw] left-0 w-full"
          id="shape"
        />
      </div>
    </motion.div>
  );
};

export default WaveAnimation;
