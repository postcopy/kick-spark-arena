import React, { useState, useEffect, useRef, useCallback } from "react";

interface IntroScreenProps {
  onComplete: () => void;
  onUnlockAudio?: () => void;
}

const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: `${10 + Math.random() * 80}%`,
  size: 4 + Math.random() * 2,
  delay: Math.random() * 2,
  duration: 2 + Math.random() * 1,
  startY: Math.random() * 40 - 20,
}));

const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete, onUnlockAudio }) => {
  const [phase, setPhase] = useState(1);
  const [fadingOut, setFadingOut] = useState(false);
  const timersRef = useRef<number[]>([]);

  const addTimer = useCallback((cb: () => void, ms: number) => {
    const id = window.setTimeout(cb, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  useEffect(() => {
    addTimer(() => setPhase(2), 500);
    addTimer(() => setPhase(3), 2500);
    return () => {
      timersRef.current.forEach((id) => clearTimeout(id));
      timersRef.current = [];
    };
  }, [addTimer]);

  const handleTap = useCallback(() => {
    if (fadingOut) return;

    try {
      document.documentElement.requestFullscreen?.();
    } catch (_) {
      /* ignore */
    }

    try {
      const ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (ctx) {
        const ac = new ctx();
        ac.resume().catch(() => {});
      }
    } catch (_) {
      /* ignore */
    }

    try {
      onUnlockAudio?.();
    } catch (_) {
      /* ignore */
    }

    setFadingOut(true);
    addTimer(() => onComplete(), 500);
  }, [fadingOut, onComplete, onUnlockAudio, addTimer]);

  return (
    <>
      <style>{`
        @keyframes intro-logo-in {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes intro-glow-pulse {
          0%, 100% { text-shadow: 0 0 20px rgba(244,63,94,0.4), 0 0 60px rgba(244,63,94,0.15); }
          50% { text-shadow: 0 0 35px rgba(244,63,94,0.7), 0 0 90px rgba(244,63,94,0.3); }
        }
        @keyframes intro-particle-float {
          0% { opacity: 0; transform: translateY(0px); }
          15% { opacity: 0.8; }
          100% { opacity: 0; transform: translateY(-120px); }
        }
        @keyframes intro-tagline-in {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes intro-tap-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.55; }
        }
        @keyframes intro-fade-out {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>

      <div
        onClick={handleTap}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "#000000",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          overflow: "hidden",
          ...(fadingOut
            ? { animation: "intro-fade-out 0.5s ease-out forwards" }
            : {}),
        }}
      >
        {/* Logo block */}
        {phase >= 2 && (
          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              animation: "intro-logo-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
            }}
          >
            {/* Particles */}
            {PARTICLES.map((p) => (
              <div
                key={p.id}
                style={{
                  position: "absolute",
                  left: p.left,
                  top: `calc(50% + ${p.startY}px)`,
                  width: p.size,
                  height: p.size,
                  borderRadius: "50%",
                  background: "rgba(244, 63, 94, 0.7)",
                  boxShadow: "0 0 6px rgba(244, 63, 94, 0.5)",
                  opacity: 0,
                  animation: `intro-particle-float ${p.duration}s ease-out ${p.delay}s infinite`,
                  pointerEvents: "none" as const,
                }}
              />
            ))}

            {/* S-FIGHT text */}
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "0.5rem",
                animation: "intro-glow-pulse 2s ease-in-out infinite",
              }}
            >
              <span
                style={{
                  fontFamily: "system-ui, sans-serif",
                  fontSize: "clamp(3rem, 10vw, 6rem)",
                  fontWeight: 900,
                  color: "#ffffff",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase" as const,
                  lineHeight: 1,
                }}
              >
                S-FIGHT
              </span>
              <span
                style={{
                  fontFamily: "system-ui, sans-serif",
                  fontSize: "clamp(0.9rem, 2.5vw, 1.4rem)",
                  fontWeight: 800,
                  color: "#000",
                  background: "rgb(244, 63, 94)",
                  padding: "0.15em 0.5em",
                  borderRadius: "4px",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase" as const,
                  lineHeight: 1,
                  position: "relative" as const,
                  top: "-0.1em",
                }}
              >
                PRO
              </span>
            </div>

            {/* Tagline */}
            {phase >= 3 && (
              <span
                style={{
                  marginTop: "1.5rem",
                  fontFamily: "system-ui, sans-serif",
                  fontSize: "0.75rem",
                  color: "rgba(255,255,255,0.4)",
                  letterSpacing: "0.25em",
                  textTransform: "uppercase" as const,
                  animation: "intro-tagline-in 0.8s ease-out forwards",
                }}
              >
                POWERED BY SULSPORT
              </span>
            )}
          </div>
        )}

        {/* Tap to start */}
        {phase >= 2 && (
          <span
            style={{
              position: "absolute",
              bottom: "10%",
              left: "50%",
              transform: "translateX(-50%)",
              fontFamily: "system-ui, sans-serif",
              fontSize: "0.65rem",
              color: "rgba(255,255,255,0.3)",
              letterSpacing: "0.3em",
              textTransform: "uppercase" as const,
              animation: "intro-tap-pulse 2s ease-in-out infinite",
              whiteSpace: "nowrap" as const,
            }}
          >
            TOQUE PARA INICIAR
          </span>
        )}
      </div>
    </>
  );
};

export default IntroScreen;
export { IntroScreen };
