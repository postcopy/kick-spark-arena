import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Volume2, Loader2, Download, Zap, Play, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo-desafio-relampago.png';

interface SoundConfig {
  name: string;
  filename: string;
  prompt: string;
  duration: number;
  description: string;
}

const SOUND_CONFIGS: SoundConfig[] = [
  {
    name: 'Hit (Normal)',
    filename: 'hit.mp3',
    prompt: 'Quick arcade fighting game punch impact, 8-bit retro style, crisp hit sound effect',
    duration: 0.5,
    description: 'Som de impacto normal de chute',
  },
  {
    name: 'Hit (Heavy)',
    filename: 'hit-heavy.mp3',
    prompt: 'Heavy powerful punch impact, arcade fighting game, bass-heavy smash, retro game style',
    duration: 0.8,
    description: 'Som de impacto forte/crítico',
  },
  {
    name: 'Combo',
    filename: 'combo.mp3',
    prompt: 'Arcade combo multiplier sound, rising pitch chime, 16-bit game style, rewarding achievement',
    duration: 0.6,
    description: 'Som de combo atingido',
  },
  {
    name: 'Special Ready',
    filename: 'special-ready.mp3',
    prompt: 'Power up ready sound, arcade fighting game, energy charging complete, dramatic whoosh',
    duration: 1.0,
    description: 'Golpe especial carregado',
  },
  {
    name: 'Special Attack',
    filename: 'special-attack.mp3',
    prompt: 'Super move attack sound, arcade fighting game, explosive energy blast, dramatic impact',
    duration: 1.2,
    description: 'Golpe especial executado',
  },
  {
    name: 'K.O.',
    filename: 'ko.mp3',
    prompt: 'K.O. knockout announcement sound, arcade fighting game, dramatic finish, heavy impact boom',
    duration: 1.5,
    description: 'Nocaute do oponente',
  },
  {
    name: 'Countdown 3',
    filename: 'countdown-3.mp3',
    prompt: 'Arcade countdown beep, number three, retro game, electronic tone, anticipation',
    duration: 0.5,
    description: 'Contagem regressiva - 3',
  },
  {
    name: 'Countdown 2',
    filename: 'countdown-2.mp3',
    prompt: 'Arcade countdown beep, number two, retro game, electronic tone, building tension',
    duration: 0.5,
    description: 'Contagem regressiva - 2',
  },
  {
    name: 'Countdown 1',
    filename: 'countdown-1.mp3',
    prompt: 'Arcade countdown beep, number one, retro game, electronic tone, urgent final beep',
    duration: 0.5,
    description: 'Contagem regressiva - 1',
  },
  {
    name: 'Countdown GO!',
    filename: 'countdown-go.mp3',
    prompt: 'Fight start sound, arcade game round begin, gong bell hit, dramatic start signal',
    duration: 1.0,
    description: 'Início da luta - GO!',
  },
  {
    name: 'Time Up',
    filename: 'time-up.mp3',
    prompt: 'Time over buzzer, arcade game round end, dramatic timeout alarm, retro style',
    duration: 1.2,
    description: 'Tempo esgotado',
  },
  {
    name: 'Victory',
    filename: 'victory.mp3',
    prompt: 'Victory fanfare, arcade fighting game win, triumphant celebration melody, 16-bit style jingle',
    duration: 2.5,
    description: 'Vitória/fim de jogo',
  },
];

interface GeneratedSound {
  filename: string;
  blob: Blob;
  url: string;
}

export default function AdminSounds() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [generatingSounds, setGeneratingSounds] = useState<Set<string>>(new Set());
  const [generatedSounds, setGeneratedSounds] = useState<Map<string, GeneratedSound>>(new Map());
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);

  const generateSound = async (config: SoundConfig) => {
    setGeneratingSounds((prev) => new Set(prev).add(config.filename));

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-sound-effect`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            prompt: config.prompt,
            duration: config.duration,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      setGeneratedSounds((prev) => {
        const newMap = new Map(prev);
        // Revoke previous URL if exists
        const existing = prev.get(config.filename);
        if (existing) {
          URL.revokeObjectURL(existing.url);
        }
        newMap.set(config.filename, { filename: config.filename, blob, url });
        return newMap;
      });

      toast({
        title: 'Som gerado!',
        description: `${config.name} gerado com sucesso.`,
      });
    } catch (error) {
      console.error('Error generating sound:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao gerar som',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setGeneratingSounds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(config.filename);
        return newSet;
      });
    }
  };

  const generateAllSounds = async () => {
    setGeneratingAll(true);
    for (const config of SOUND_CONFIGS) {
      if (!generatedSounds.has(config.filename)) {
        await generateSound(config);
        // Small delay between requests to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    setGeneratingAll(false);
    toast({
      title: 'Geração completa!',
      description: 'Todos os sons foram gerados.',
    });
  };

  const playSound = (filename: string) => {
    const sound = generatedSounds.get(filename);
    if (!sound) return;

    setPlayingSound(filename);
    const audio = new Audio(sound.url);
    audio.onended = () => setPlayingSound(null);
    audio.onerror = () => setPlayingSound(null);
    audio.play().catch(() => setPlayingSound(null));
  };

  const downloadSound = (filename: string) => {
    const sound = generatedSounds.get(filename);
    if (!sound) return;

    const link = document.createElement('a');
    link.href = sound.url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllSounds = () => {
    generatedSounds.forEach((sound, filename) => {
      const link = document.createElement('a');
      link.href = sound.url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-game-yellow" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const generatedCount = generatedSounds.size;
  const totalCount = SOUND_CONFIGS.length;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <img src={logo} alt="Desafio Relâmpago" className="h-10 w-auto" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Gerador de Sons</h1>
              <p className="text-sm text-muted-foreground">
                ElevenLabs Sound Effects • {generatedCount}/{totalCount} gerados
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {generatedCount > 0 && (
              <Button onClick={downloadAllSounds} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Baixar Todos
              </Button>
            )}
            <Button
              onClick={generateAllSounds}
              disabled={generatingAll || generatingSounds.size > 0}
              size="sm"
              className="bg-game-yellow text-game-dark hover:bg-game-yellow/90"
            >
              {generatingAll ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Gerar Todos
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="bg-game-yellow/10 border border-game-yellow/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-game-yellow mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-game-yellow">Instruções</p>
              <p className="text-muted-foreground mt-1">
                1. Clique em "Gerar" para criar cada som usando IA do ElevenLabs
                <br />
                2. Use "Preview" para ouvir o som gerado
                <br />
                3. Baixe os arquivos e substitua em <code className="bg-secondary px-1 rounded">public/sounds/</code>
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {SOUND_CONFIGS.map((config) => {
            const isGenerating = generatingSounds.has(config.filename);
            const isGenerated = generatedSounds.has(config.filename);
            const isPlaying = playingSound === config.filename;

            return (
              <div
                key={config.filename}
                className={`p-4 rounded-lg border transition-colors ${
                  isGenerated
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-game-surface border-border'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isGenerated ? 'bg-green-500/20' : 'bg-secondary'
                      }`}
                    >
                      {isGenerated ? (
                        <Check className="w-5 h-5 text-green-400" />
                      ) : (
                        <Volume2 className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{config.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {config.filename} • {config.duration}s • {config.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isGenerated && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => playSound(config.filename)}
                          disabled={isPlaying}
                        >
                          {isPlaying ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadSound(config.filename)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      onClick={() => generateSound(config)}
                      disabled={isGenerating || generatingAll}
                      size="sm"
                      variant={isGenerated ? 'outline' : 'default'}
                      className={!isGenerated ? 'bg-game-yellow text-game-dark hover:bg-game-yellow/90' : ''}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          {isGenerated ? 'Regenerar' : 'Gerar'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Show prompt on hover/expand */}
                <details className="mt-2">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                    Ver prompt
                  </summary>
                  <p className="text-xs text-muted-foreground mt-1 bg-secondary/50 p-2 rounded">
                    {config.prompt}
                  </p>
                </details>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
