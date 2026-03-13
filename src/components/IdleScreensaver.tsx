import { useState, useEffect, useRef } from 'react';
import { useIdleAttention } from '@/hooks/useIdleAttention';
import { useScreensaverSettings } from '@/hooks/useScreensaverSettings';
import logoSfighter from '@/assets/logo-sfighter.png';

export function IdleScreensaver() {
  const { enabled, timeoutMinutes } = useScreensaverSettings();
  const timeoutMs = timeoutMinutes * 60 * 1000;
  const isIdle = useIdleAttention(timeoutMs);

  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) {
      setIsVisible(false);
      setIsFadingOut(false);
      return;
    }

    if (isIdle && !isVisible) {
      setIsVisible(true);
      setIsFadingOut(false);
    } else if (!isIdle && isVisible) {
      setIsFadingOut(true);
      fadeTimerRef.current = setTimeout(() => {
        setIsVisible(false);
        setIsFadingOut(false);
      }, 300);
    }

    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [isIdle, enabled, isVisible]);

  if (!enabled || !isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center cursor-none"
      style={{
        backgroundColor: '#000',
        backgroundImage: 'radial-gradient(ellipse at 50% 50%, rgba(225,29,72,0.06) 0%, #0A0A0F 60%, #000 100%)',
        backgroundSize: '200% 200%',
        animation: isFadingOut
          ? 'screensaver-fade-out 300ms ease-out forwards'
          : 'screensaver-fade-in 1s ease-out forwards, screensaver-ambient 8s ease-in-out infinite',
      }}
    >
      <img
        src={logoSfighter}
        alt="S-FIGHT PRO"
        className="w-[clamp(200px,30vw,400px)] select-none pointer-events-none"
        style={{
          animation: 'screensaver-breathe 4s ease-in-out infinite, screensaver-glow 4s ease-in-out infinite',
        }}
        draggable={false}
      />
    </div>
  );
}
