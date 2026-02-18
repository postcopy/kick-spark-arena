import { useState, useEffect, useRef } from 'react';

interface MissionBriefingProps {
  text: string;
}

export function MissionBriefing({ text }: MissionBriefingProps) {
  const [displayed, setDisplayed] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fallback = 'SELECIONE UM PROTOCOLO PARA INICIAR A ANÁLISE...';
  const target = text || fallback;

  useEffect(() => {
    setDisplayed('');
    if (intervalRef.current) clearInterval(intervalRef.current);

    let i = 0;
    intervalRef.current = setInterval(() => {
      i++;
      setDisplayed(target.slice(0, i));
      if (i >= target.length && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }, 18);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [target]);

  return (
    <div className="border-l-2 border-cyan-500/30 pl-4 py-2 bg-black/20 min-h-[48px] flex flex-col justify-center">
      <h4 className="font-mono text-[0.65rem] text-cyan-500/60 uppercase tracking-widest mb-1">
        MISSION BRIEFING
      </h4>
      <p className="font-mono text-sm text-white/60">
        {displayed}
        <span className="inline-block w-[2px] h-[1em] bg-cyan-500/60 animate-pulse ml-0.5 align-text-bottom" />
      </p>
    </div>
  );
}
