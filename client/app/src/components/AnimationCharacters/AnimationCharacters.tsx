import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';

interface AnimationCharactersProps {
  isTyping: boolean;
  isPasswordFocused: boolean;
  showPassword: boolean;
  passwordLength: number;
  hasError: boolean;
}

interface Position {
  faceX: number;
  faceY: number;
  bodySkew: number;
}

interface PupilOffset {
  x: number;
  y: number;
}

const AnimationCharacters = ({
  isTyping,
  isPasswordFocused,
  showPassword,
  passwordLength,
  hasError,
}: AnimationCharactersProps) => {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);
  const [shakeAnimation, setShakeAnimation] = useState(false);

  const purpleEyeRef = useRef<HTMLDivElement>(null);
  const blackEyeRef = useRef<HTMLDivElement>(null);
  const orangePupilRef = useRef<HTMLDivElement>(null);
  const yellowPupilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasError) {
      setShakeAnimation(false);
      const timer = setTimeout(() => {
        setShakeAnimation(true);
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setShakeAnimation(false);
    }
  }, [hasError]);

  const calcPosition = useCallback((el: HTMLElement | null): Position => {
    if (!el) return { faceX: 0, faceY: 0, bodySkew: 0 };
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 3;
    const dx = mouseX - cx;
    const dy = mouseY - cy;
    const faceX = Math.max(-15, Math.min(15, dx / 20));
    const faceY = Math.max(-10, Math.min(10, dy / 30));
    const bodySkew = Math.max(-6, Math.min(6, -dx / 120));
    return { faceX, faceY, bodySkew };
  }, [mouseX, mouseY]);

  const calcPupilOffset = useCallback((el: HTMLElement | null, maxDist: number): PupilOffset => {
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = mouseX - cx;
    const dy = mouseY - cy;
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDist);
    const angle = Math.atan2(dy, dx);
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
  }, [mouseX, mouseY]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (isTyping) {
      setIsLookingAtEachOther(true);
      const timer = setTimeout(() => {
        setIsLookingAtEachOther(false);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setIsLookingAtEachOther(false);
    }
  }, [isTyping]);

  useEffect(() => {
    const scheduleBlink = (setBlinking: (value: boolean) => void) => {
      const timer = setTimeout(() => {
        setBlinking(true);
        setTimeout(() => {
          setBlinking(false);
          scheduleBlink(setBlinking);
        }, 150);
      }, Math.random() * 4000 + 3000);
      return timer;
    };

    const purpleTimer = scheduleBlink(setIsPurpleBlinking);
    const blackTimer = scheduleBlink(setIsBlackBlinking);

    return () => {
      clearTimeout(purpleTimer);
      clearTimeout(blackTimer);
    };
  }, []);

  useEffect(() => {
    if (passwordLength > 0 && showPassword) {
      const peekTimer = setTimeout(() => {
        if (passwordLength > 0 && showPassword) {
          setIsPurplePeeking(true);
          setTimeout(() => {
            setIsPurplePeeking(false);
          }, 800);
        }
      }, Math.random() * 3000 + 2000);
      return () => clearTimeout(peekTimer);
    }
  }, [showPassword, passwordLength]);

  const isShowingPwd = passwordLength > 0 && showPassword;
  const isLookingAway = isPasswordFocused && !showPassword;

  return (
    <div className="characters-scene">
      <motion.div
        className="character char-purple"
        style={{
          transform: hasError
            ? 'skewX(0deg)'
            : isShowingPwd
            ? 'skewX(0deg)'
            : isLookingAway
            ? 'skewX(-14deg) translateX(-20px)'
            : isTyping
            ? `skewX(${(calcPosition(document.getElementById('char-purple'))?.bodySkew || 0) - 12}deg) translateX(40px)`
            : `skewX(${calcPosition(document.getElementById('char-purple'))?.bodySkew || 0}deg)`,
          height: hasError ? '370px' : isLookingAway || isTyping ? '410px' : '370px',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <motion.div
          className={`eyes ${shakeAnimation ? 'shake-head' : ''}`}
          ref={purpleEyeRef}
          style={{
            left: hasError
              ? '30px'
              : isLookingAway
              ? '20px'
              : isShowingPwd
              ? '20px'
              : isLookingAtEachOther
              ? '55px'
              : `${45 + (calcPosition(document.getElementById('char-purple'))?.faceX || 0)}px`,
            top: hasError
              ? '55px'
              : isLookingAway
              ? '25px'
              : isShowingPwd
              ? '35px'
              : isLookingAtEachOther
              ? '65px'
              : `${40 + (calcPosition(document.getElementById('char-purple'))?.faceY || 0)}px`,
            gap: '28px',
          }}
          animate={{
            x: hasError ? 0 : isLookingAtEachOther ? 0 : 0,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <motion.div
            className="eyeball"
            style={{ width: '18px', height: isPurpleBlinking ? '2px' : '18px' }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              className="pupil"
              style={{ width: '7px', height: '7px' }}
              animate={{
                x: hasError
                  ? -3
                  : isLookingAway
                  ? -5
                  : isShowingPwd
                  ? (isPurplePeeking ? 4 : -4)
                  : isLookingAtEachOther
                  ? 3
                  : calcPupilOffset(purpleEyeRef.current, 5).x,
                y: hasError
                  ? 4
                  : isLookingAway
                  ? -5
                  : isShowingPwd
                  ? (isPurplePeeking ? 5 : -4)
                  : isLookingAtEachOther
                  ? 4
                  : calcPupilOffset(purpleEyeRef.current, 5).y,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </motion.div>
          <motion.div
            className="eyeball"
            style={{ width: '18px', height: isPurpleBlinking ? '2px' : '18px' }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              className="pupil"
              style={{ width: '7px', height: '7px' }}
              animate={{
                x: hasError
                  ? -3
                  : isLookingAway
                  ? -5
                  : isShowingPwd
                  ? (isPurplePeeking ? 4 : -4)
                  : isLookingAtEachOther
                  ? 3
                  : calcPupilOffset(purpleEyeRef.current, 5).x,
                y: hasError
                  ? 4
                  : isLookingAway
                  ? -5
                  : isShowingPwd
                  ? (isPurplePeeking ? 5 : -4)
                  : isLookingAtEachOther
                  ? 4
                  : calcPupilOffset(purpleEyeRef.current, 5).y,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div
        className="character char-black"
        style={{
          transform: hasError
            ? 'skewX(0deg)'
            : isShowingPwd
            ? 'skewX(0deg)'
            : isLookingAway
            ? 'skewX(12deg) translateX(-10px)'
            : isLookingAtEachOther
            ? `skewX(${(calcPosition(document.getElementById('char-black'))?.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
            : isTyping
            ? `skewX(${(calcPosition(document.getElementById('char-black'))?.bodySkew || 0) * 1.5}deg)`
            : `skewX(${calcPosition(document.getElementById('char-black'))?.bodySkew || 0}deg)`,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <motion.div
          className={`eyes ${shakeAnimation ? 'shake-head' : ''}`}
          ref={blackEyeRef}
          style={{
            left: hasError
              ? '15px'
              : isLookingAway
              ? '10px'
              : isShowingPwd
              ? '10px'
              : isLookingAtEachOther
              ? '32px'
              : `${26 + (calcPosition(document.getElementById('char-black'))?.faceX || 0)}px`,
            top: hasError
              ? '40px'
              : isLookingAway
              ? '20px'
              : isShowingPwd
              ? '28px'
              : isLookingAtEachOther
              ? '12px'
              : `${32 + (calcPosition(document.getElementById('char-black'))?.faceY || 0)}px`,
            gap: '20px',
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <motion.div
            className="eyeball"
            style={{ width: '16px', height: isBlackBlinking ? '2px' : '16px' }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              className="pupil"
              style={{ width: '6px', height: '6px' }}
              animate={{
                x: hasError
                  ? -3
                  : isLookingAway
                  ? -4
                  : isShowingPwd
                  ? -4
                  : isLookingAtEachOther
                  ? 0
                  : calcPupilOffset(blackEyeRef.current, 4).x,
                y: hasError
                  ? 4
                  : isLookingAway
                  ? -5
                  : isShowingPwd
                  ? -4
                  : isLookingAtEachOther
                  ? -4
                  : calcPupilOffset(blackEyeRef.current, 4).y,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </motion.div>
          <motion.div
            className="eyeball"
            style={{ width: '16px', height: isBlackBlinking ? '2px' : '16px' }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              className="pupil"
              style={{ width: '6px', height: '6px' }}
              animate={{
                x: hasError
                  ? -3
                  : isLookingAway
                  ? -4
                  : isShowingPwd
                  ? -4
                  : isLookingAtEachOther
                  ? 0
                  : calcPupilOffset(blackEyeRef.current, 4).x,
                y: hasError
                  ? 4
                  : isLookingAway
                  ? -5
                  : isShowingPwd
                  ? -4
                  : isLookingAtEachOther
                  ? -4
                  : calcPupilOffset(blackEyeRef.current, 4).y,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div
        className="character char-orange"
        style={{
          transform: hasError
            ? 'skewX(0deg)'
            : isShowingPwd
            ? 'skewX(0deg)'
            : isLookingAway
            ? 'skewX(-10deg) translateX(-15px)'
            : `skewX(${calcPosition(document.getElementById('char-orange'))?.bodySkew || 0}deg)`,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <motion.div
          className={`eyes ${shakeAnimation ? 'shake-head' : ''}`}
          ref={orangePupilRef}
          style={{
            left: hasError
              ? '60px'
              : isLookingAway
              ? '70px'
              : `${82 + (calcPosition(document.getElementById('char-orange'))?.faceX || 0)}px`,
            top: hasError
              ? '95px'
              : isLookingAway
              ? '80px'
              : `${90 + (calcPosition(document.getElementById('char-orange'))?.faceY || 0)}px`,
            gap: '28px',
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <motion.div
            className="bare-pupil"
            animate={{
              x: hasError ? -3 : isLookingAway ? -5 : calcPupilOffset(orangePupilRef.current, 6).x,
              y: hasError ? 4 : isLookingAway ? -5 : calcPupilOffset(orangePupilRef.current, 6).y,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
          <motion.div
            className="bare-pupil"
            animate={{
              x: hasError ? -3 : isLookingAway ? -5 : calcPupilOffset(orangePupilRef.current, 6).x,
              y: hasError ? 4 : isLookingAway ? -5 : calcPupilOffset(orangePupilRef.current, 6).y,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </motion.div>
        <motion.div
          className={`orange-mouth ${hasError ? 'visible' : ''} ${shakeAnimation ? 'shake-head' : ''}`}
          style={{ left: '90px', top: '120px' }}
        />
      </motion.div>

      <motion.div
        className="character char-yellow"
        style={{
          transform: hasError
            ? 'skewX(0deg)'
            : isShowingPwd
            ? 'skewX(0deg)'
            : isLookingAway
            ? 'skewX(10deg) translateX(-15px)'
            : `skewX(${calcPosition(document.getElementById('char-yellow'))?.bodySkew || 0}deg)`,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <motion.div
          className={`eyes ${shakeAnimation ? 'shake-head' : ''}`}
          ref={yellowPupilRef}
          style={{
            left: hasError
              ? '60px'
              : isLookingAway
              ? '40px'
              : `${52 + (calcPosition(document.getElementById('char-yellow'))?.faceX || 0)}px`,
            top: hasError
              ? '70px'
              : isLookingAway
              ? '30px'
              : `${40 + (calcPosition(document.getElementById('char-yellow'))?.faceY || 0)}px`,
            gap: '20px',
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <motion.div
            className="bare-pupil"
            animate={{
              x: hasError ? -3 : isLookingAway ? -4 : calcPupilOffset(yellowPupilRef.current, 5).x,
              y: hasError ? 4 : isLookingAway ? -5 : calcPupilOffset(yellowPupilRef.current, 5).y,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
          <motion.div
            className="bare-pupil"
            animate={{
              x: hasError ? -3 : isLookingAway ? -4 : calcPupilOffset(yellowPupilRef.current, 5).x,
              y: hasError ? 4 : isLookingAway ? -5 : calcPupilOffset(yellowPupilRef.current, 5).y,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </motion.div>
        <motion.div
          className={`yellow-mouth ${shakeAnimation ? 'shake-head' : ''}`}
          style={{
            left: hasError
              ? '40px'
              : isLookingAway
              ? '30px'
              : `${40 + (calcPosition(document.getElementById('char-yellow'))?.faceX || 0)}px`,
            top: hasError
              ? '88px'
              : isLookingAway
              ? '78px'
              : `${88 + (calcPosition(document.getElementById('char-yellow'))?.faceY || 0)}px`,
          }}
        />
      </motion.div>

      <style>{`
        .characters-scene {
          position: relative;
          width: 480px;
          height: 360px;
        }

        .character {
          position: absolute;
          bottom: 0;
          transition: all 0.7s ease-in-out;
          transform-origin: bottom center;
        }

        .char-purple {
          left: 60px;
          width: 170px;
          height: 370px;
          background: #F53838;
          border-radius: 10px 10px 0 0;
          z-index: 1;
        }

        .char-black {
          left: 220px;
          width: 115px;
          height: 290px;
          background: #FFA6C9;
          border-radius: 8px 8px 0 0;
          z-index: 2;
        }

        .char-orange {
          left: 0;
          width: 230px;
          height: 190px;
          background: #FFD32F;
          border-radius: 115px 115px 0 0;
          z-index: 3;
        }

        .char-yellow {
          left: 290px;
          width: 135px;
          height: 215px;
          background: #4799E2;
          border-radius: 68px 68px 0 0;
          z-index: 4;
        }

        .eyes {
          position: absolute;
          display: flex;
        }

        .eyeball {
          border-radius: 50%;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .pupil {
          border-radius: 50%;
          background: #2d2d2d;
        }

        .bare-pupil {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #2d2d2d;
        }

        .yellow-mouth {
          position: absolute;
          width: 50px;
          height: 4px;
          background: #2d2d2d;
          border-radius: 2px;
        }

        .orange-mouth {
          position: absolute;
          width: 28px;
          height: 14px;
          border: 3px solid #2d2d2d;
          border-top: none;
          border-radius: 0 0 14px 14px;
          opacity: 0;
          transition: opacity 0.7s ease-in-out;
        }

        .orange-mouth.visible {
          opacity: 1;
        }

        @keyframes shakeHead {
          0%, 100% {
            transform: translateX(0);
          }
          10% {
            transform: translateX(-9px);
          }
          20% {
            transform: translateX(7px);
          }
          30% {
            transform: translateX(-6px);
          }
          40% {
            transform: translateX(5px);
          }
          50% {
            transform: translateX(-4px);
          }
          60% {
            transform: translateX(3px);
          }
          70% {
            transform: translateX(-2px);
          }
          80% {
            transform: translateX(1px);
          }
          90% {
            transform: translateX(-0.5px);
          }
        }

        .shake-head {
          animation: shakeHead 0.8s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
      `}</style>
    </div>
  );
};

export default AnimationCharacters;
