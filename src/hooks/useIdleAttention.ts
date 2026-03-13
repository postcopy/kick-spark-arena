import { useState, useEffect, useRef } from 'react';

export function useIdleAttention(timeoutMs = 5000): boolean {
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const reset = () => {
      setIsIdle(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setIsIdle(true), timeoutMs);
    };

    const events = ['mousemove', 'touchstart', 'keydown', 'click'] as const;
    events.forEach((e) => window.addEventListener(e, reset));
    reset(); // start timer

    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeoutMs]);

  return isIdle;
}
