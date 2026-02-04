import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChampionshipSync } from '@/hooks/useChampionshipSync';
import { OperatorPanel } from '@/components/championship/OperatorPanel';
import { ScoreboardMain } from '@/components/championship/ScoreboardMain';
import { ScoringButtons } from '@/components/championship/ScoringButtons';
import { EventLog } from '@/components/championship/EventLog';
import { Trophy, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function ChampionshipMat() {
  const navigate = useNavigate();
  const matId = 1;
  
  const sync = useChampionshipSync({ role: 'master', matId });
  const [isTVOpen, setIsTVOpen] = useState(false);
  const tvWindowRef = useRef<Window | null>(null);
  
  const handleOpenTV = () => {
    tvWindowRef.current = window.open(
      `/championship/tv?mat=${matId}`, 
      `championship-tv-${matId}`,
      'width=1920,height=1080'
    );
    if (tvWindowRef.current) {
      setIsTVOpen(true);
    }
  };
  
  // Polling to detect when TV window is closed
  useEffect(() => {
    if (!isTVOpen || !tvWindowRef.current) return;
    
    const checkClosed = setInterval(() => {
      if (tvWindowRef.current?.closed) {
        setIsTVOpen(false);
        tvWindowRef.current = null;
      }
    }, 1000);
    
    return () => clearInterval(checkClosed);
  }, [isTVOpen]);
  
  // Show setup prompt if no config
  if (!sync.hasConfig) {
    return (
      <div className="h-screen flex flex-col bg-[hsl(var(--sulsport-black))]">
        {/* Header */}
        <header className="h-14 bg-[hsl(var(--sulsport-dark))] border-b border-[hsl(var(--sulsport-gray))] flex items-center px-6 gap-4">
          <Trophy className="w-5 h-5 text-purple-500" />
          <h1 className="text-lg font-bold text-white">MESA DE LUTA • MAT {matId}</h1>
        </header>
        
        {/* Setup Required */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md p-8">
            <AlertTriangle className="w-16 h-16 text-[hsl(var(--sulsport-yellow))] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Configuração Necessária
            </h2>
            <p className="text-zinc-400 mb-6">
              Antes de iniciar uma luta, configure o tempo, regras e atletas.
            </p>
            <Button
              onClick={() => navigate('/championship/setup')}
              className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-6 text-lg rounded-md font-bold uppercase"
            >
              Configurar Luta
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Check for tie at round end
  const isTie = sync.state.status === 'ROUND_END' && 
                sync.state.roundScoreRed === sync.state.roundScoreBlue;
  
  return (
    <div className="h-screen flex bg-[hsl(var(--sulsport-black))]">
      {/* Main Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 bg-[hsl(var(--sulsport-dark))] border-b border-[hsl(var(--sulsport-gray))] flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Trophy className="w-5 h-5 text-purple-500" />
            <h1 className="text-lg font-bold text-white uppercase">
              MESA DE LUTA • MAT {matId}
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className={cn(
              "px-2 py-1 rounded-md font-bold uppercase",
              sync.state.status === 'RUNNING' 
                ? "bg-green-500/20 text-green-500" 
                : sync.state.status === 'MATCH_END'
                ? "bg-purple-500/20 text-purple-500"
                : "bg-zinc-700 text-zinc-400"
            )}>
              {sync.state.status === 'IDLE' && 'PRONTO'}
              {sync.state.status === 'RUNNING' && 'EM ANDAMENTO'}
              {sync.state.status === 'PAUSED' && 'PAUSADO'}
              {sync.state.status === 'MEDICAL' && 'TEMPO MÉDICO'}
              {sync.state.status === 'ROUND_END' && 'FIM DO ROUND'}
              {sync.state.status === 'MATCH_END' && 'FIM DA LUTA'}
            </span>
            <span className="text-zinc-400 font-bold">
              ROUND {sync.state.round}/{sync.state.config.maxRounds}
            </span>
          </div>
        </header>
        
        {/* Scoreboard */}
        <div className="flex-1 min-h-0">
          <ScoreboardMain state={sync.state} />
        </div>
        
        {/* Tie Decision */}
        {isTie && (
          <div className="bg-[hsl(var(--sulsport-yellow))]/10 border-y border-[hsl(var(--sulsport-yellow))]/30 p-4">
            <div className="text-center mb-3">
              <span className="text-lg font-bold text-[hsl(var(--sulsport-yellow))] uppercase">
                EMPATE — Declarar Vencedor do Round
              </span>
            </div>
            <div className="flex justify-center gap-4">
              <Button
                onClick={() => sync.declareRoundWinner('BLUE')}
                className="bg-[hsl(var(--sulsport-blue))] hover:bg-[hsl(var(--sulsport-blue-light))] text-white px-8 py-6 text-lg font-bold uppercase rounded-md"
              >
                VITÓRIA AZUL
              </Button>
              <Button
                onClick={() => sync.declareRoundWinner('RED')}
                className="bg-[hsl(var(--sulsport-red))] hover:bg-[hsl(var(--sulsport-red-light))] text-white px-8 py-6 text-lg font-bold uppercase rounded-md"
              >
                VITÓRIA VERMELHO
              </Button>
            </div>
          </div>
        )}
        
        {/* Scoring Buttons */}
        <ScoringButtons 
          state={sync.state}
          onScore={sync.addScore}
        />
        
        {/* Event Log */}
        <EventLog 
          events={sync.state.events}
          onUndo={sync.undoLast}
          canUndo={sync.canUndo}
        />
      </main>
      
      {/* Operator Panel (Right Sidebar) */}
      <OperatorPanel
        state={sync.state}
        actions={sync}
        onOpenTV={handleOpenTV}
        isTVOpen={isTVOpen}
      />
    </div>
  );
}
