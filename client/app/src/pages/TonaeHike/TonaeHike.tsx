import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WaveAnimation from '../../components/WaveAnimation/WaveAnimation';

const TonaeHike = () => {
  const [showWave, setShowWave] = useState(true);
  const [showText, setShowText] = useState(false);
  const [showVideo1, setShowVideo1] = useState(false);
  const [showVideo2, setShowVideo2] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // 波浪开始时就显示文字
    setShowText(true);
  }, []);

  const handleWaveComplete = () => {
    setShowWave(false);
    // 波浪完成后播放视频1
    setShowVideo1(true);
  };

  // 视频1加载完成后自动播放
  const handleVideo1Loaded = () => {
    if (video1Ref.current && showVideo1) {
      video1Ref.current.play().catch(e => console.log('Video1 play error:', e));
    }
  };

  // 视频2加载完成后自动播放
  const handleVideo2Loaded = () => {
    if (video2Ref.current && showVideo2) {
      video2Ref.current.play().catch(e => console.log('Video2 play error:', e));
    }
  };

  useEffect(() => {
    if (!showVideo1) return;

    // 视频1的定时器
    const video1Timers: NodeJS.Timeout[] = [];

    // 1秒后文字淡出
    const textFadeTimer = setTimeout(() => {
      setShowText(false);
    }, 1000);
    video1Timers.push(textFadeTimer);

    // 3秒后切换到视频2并显示按钮
    const switchToVideo2Timer = setTimeout(() => {
      setShowVideo1(false);
      setShowVideo2(true);
      setShowButton(true);
    }, 3000);
    video1Timers.push(switchToVideo2Timer);

    return () => {
      video1Timers.forEach(timer => clearTimeout(timer));
    };
  }, [showVideo1]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <AnimatePresence>
        {showWave && <WaveAnimation onComplete={handleWaveComplete} />}
      </AnimatePresence>

      <div id="videobg" className="absolute inset-0 w-full h-full">
        <AnimatePresence>
          {showVideo1 && (
            <motion.video
              ref={video1Ref}
              id="video1"
              className="videos absolute inset-0 w-full h-full object-cover"
              muted
              playsInline
              preload="auto"
              onLoadedData={handleVideo1Loaded}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <source src="http://localhost:3000/assset/fv_movie1.mp4" type="video/mp4" />
            </motion.video>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showVideo2 && (
            <motion.video
              ref={video2Ref}
              id="video2"
              className="videos absolute inset-0 w-full h-full object-cover"
              muted
              loop
              playsInline
              preload="auto"
              onLoadedData={handleVideo2Loaded}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <source src="http://localhost:3000/assset/fv_movie2.mp4" type="video/mp4" />
            </motion.video>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showText && (
          <motion.div
            id="centertext"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-black z-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-6xl font-bold mb-4">Tonae Hike</h1>
            <p className="text-xl leading-relaxed">
              We make your trip fascinating.<br />
              To native explorers.<br />
              Let's hike.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showButton && (
          <motion.div
            className="auth-nav z-20"
            initial={{ opacity: 0, pointerEvents: 'none' }}
            animate={{
              opacity: 1,
              pointerEvents: 'auto',
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
          >
            <a
              href="/login"
              className="auth-link"
            >
              由此开始您的旅程
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .videos {
          width: 100%;
          height: 100%;
          object-fit: cover;
          position: absolute;
        }

        .auth-nav {
          position: absolute;
          right: 20%;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .auth-link {
          font-size: 22px;
          font-weight: 600;
          padding: 16px 50px;
          border-radius: 30px;
          background: linear-gradient(135deg, rgba(42, 123, 151, 0.95), rgba(66, 153, 225, 0.95));
          border: 2px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 8px 30px rgba(42, 123, 151, 0.5), 0 0 40px rgba(66, 153, 225, 0.3);
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          color: #ffffff;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .auth-link:hover {
          background: linear-gradient(135deg, rgba(42, 123, 151, 1), rgba(66, 153, 225, 1));
          transform: translateY(-3px);
          box-shadow: 0 12px 35px rgba(42, 123, 151, 0.6);
        }
      `}</style>
    </div>
  );
};

export default TonaeHike;
