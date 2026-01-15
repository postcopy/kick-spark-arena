import { useState, useEffect, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Volume2, Loader2, Download, Zap, Play, Check, AlertCircle, CloudUpload, RefreshCw, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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

interface StoredSound {
  filename: string;
  url: string;
}

export default function AdminSounds() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [generatingSounds, setGeneratingSounds] = useState<Set<string>>(new Set());
  const [generatedSounds, setGeneratedSounds] = useState<Map<string, GeneratedSound>>(new Map());
  const [storedSounds, setStoredSounds] = useState<Map<string, StoredSound>>(new Map());
  const [uploadingSounds, setUploadingSounds] = useState<Set<string>>(new Set());
  const [manualUploading, setManualUploading] = useState<Set<string>>(new Set());
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [loadingStored, setLoadingStored] = useState(true);
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Load stored sounds from Storage on mount
  useEffect(() => {
    loadStoredSounds();
  }, []);

  const loadStoredSounds = async () => {
    setLoadingStored(true);
    try {
      const { data: files, error } = await supabase.storage.from('sounds').list('', {
        limit: 100,
      });

      if (error) throw error;

      const soundsMap = new Map<string, StoredSound>();
      for (const file of files || []) {
        if (file.name.endsWith('.mp3')) {
          const { data: urlData } = supabase.storage.from('sounds').getPublicUrl(file.name);
          soundsMap.set(file.name, {
            filename: file.name,
            url: urlData.publicUrl,
          });
        }
      }
      setStoredSounds(soundsMap);
    } catch (error) {
      console.error('Error loading stored sounds:', error);
    } finally {
      setLoadingStored(false);
    }
  };

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
        const existing = prev.get(config.filename);
        if (existing) {
          URL.revokeObjectURL(existing.url);
        }
        newMap.set(config.filename, { filename: config.filename, blob, url });
        return newMap;
      });

      toast({
        title: 'Som gerado!',
        description: `${config.name} gerado com sucesso. Clique em "Salvar" para guardar.`,
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

  const uploadSound = async (filename: string) => {
    const sound = generatedSounds.get(filename);
    if (!sound) return;

    setUploadingSounds((prev) => new Set(prev).add(filename));

    try {
      // Upload to Storage (upsert)
      const { error } = await supabase.storage
        .from('sounds')
        .upload(filename, sound.blob, {
          contentType: 'audio/mpeg',
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage.from('sounds').getPublicUrl(filename);

      // Update stored sounds
      setStoredSounds((prev) => {
        const newMap = new Map(prev);
        newMap.set(filename, { filename, url: urlData.publicUrl });
        return newMap;
      });

      // Remove from generated (already saved)
      setGeneratedSounds((prev) => {
        const newMap = new Map(prev);
        const existing = prev.get(filename);
        if (existing) {
          URL.revokeObjectURL(existing.url);
        }
        newMap.delete(filename);
        return newMap;
      });

      toast({
        title: 'Som salvo!',
        description: `${filename} salvo no Storage.`,
      });
    } catch (error) {
      console.error('Error uploading sound:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar som',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setUploadingSounds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(filename);
        return newSet;
      });
    }
  };

  const generateAllSounds = async () => {
    setGeneratingAll(true);
    for (const config of SOUND_CONFIGS) {
      if (!generatedSounds.has(config.filename) && !storedSounds.has(config.filename)) {
        await generateSound(config);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    setGeneratingAll(false);
    toast({
      title: 'Geração completa!',
      description: 'Todos os sons foram gerados. Clique em "Salvar Todos" para guardar.',
    });
  };

  const uploadAllSounds = async () => {
    const soundsToUpload = Array.from(generatedSounds.keys());
    for (const filename of soundsToUpload) {
      await uploadSound(filename);
    }
    toast({
      title: 'Todos salvos!',
      description: 'Todos os sons foram salvos no Storage.',
    });
  };

  const playSound = (filename: string) => {
    const sound = generatedSounds.get(filename) || storedSounds.get(filename);
    if (!sound) return;

    setPlayingSound(filename);
    const audio = new Audio(sound.url);
    audio.onended = () => setPlayingSound(null);
    audio.onerror = () => setPlayingSound(null);
    audio.play().catch(() => setPlayingSound(null));
  };

  const downloadSound = (filename: string) => {
    const sound = generatedSounds.get(filename) || storedSounds.get(filename);
    if (!sound) return;

    const link = document.createElement('a');
    link.href = sound.url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleManualUpload = async (filename: string, file: File) => {
    setManualUploading((prev) => new Set(prev).add(filename));

    try {
      // Validate file type
      if (!file.type.startsWith('audio/')) {
        throw new Error('Arquivo deve ser um áudio (MP3 ou WAV)');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Arquivo muito grande (máximo 5MB)');
      }

      // Upload to Storage (upsert)
      const { error } = await supabase.storage
        .from('sounds')
        .upload(filename, file, {
          contentType: 'audio/mpeg',
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage.from('sounds').getPublicUrl(filename);

      // Update stored sounds
      setStoredSounds((prev) => {
        const newMap = new Map(prev);
        newMap.set(filename, { filename, url: urlData.publicUrl });
        return newMap;
      });

      toast({
        title: 'Som enviado!',
        description: `${filename} salvo no Storage.`,
      });
    } catch (error) {
      console.error('Error uploading manual sound:', error);
      toast({
        variant: 'destructive',
        title: 'Erro no upload',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setManualUploading((prev) => {
        const newSet = new Set(prev);
        newSet.delete(filename);
        return newSet;
      });
    }
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
  const storedCount = storedSounds.size;
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
                ElevenLabs Sound Effects • {storedCount}/{totalCount} salvos no Storage
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadStoredSounds} variant="ghost" size="sm" disabled={loadingStored}>
              <RefreshCw className={`w-4 h-4 ${loadingStored ? 'animate-spin' : ''}`} />
            </Button>
            {generatedCount > 0 && (
              <Button 
                onClick={uploadAllSounds} 
                variant="outline" 
                size="sm"
                disabled={uploadingSounds.size > 0}
              >
                <CloudUpload className="w-4 h-4 mr-2" />
                Salvar Todos ({generatedCount})
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
                  Gerar Faltantes
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="bg-game-yellow/10 border border-game-yellow/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-game-yellow mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-game-yellow">Como funciona</p>
              <p className="text-muted-foreground mt-1">
                <strong>Opção 1:</strong> Clique em "Gerar" para criar cada som usando IA do ElevenLabs
                <br />
                <strong>Opção 2:</strong> Use o botão "Upload" para enviar um arquivo MP3/WAV do seu computador
                <br />
                Os sons salvos são usados automaticamente no jogo.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {SOUND_CONFIGS.map((config) => {
            const isGenerating = generatingSounds.has(config.filename);
            const isGenerated = generatedSounds.has(config.filename);
            const isStored = storedSounds.has(config.filename);
            const isUploading = uploadingSounds.has(config.filename);
            const isManualUploading = manualUploading.has(config.filename);
            const isPlaying = playingSound === config.filename;
            const hasSound = isGenerated || isStored;

            return (
              <div
                key={config.filename}
                className={`p-4 rounded-lg border transition-colors ${
                  isStored
                    ? 'bg-blue-500/10 border-blue-500/30'
                    : isGenerated
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-game-surface border-border'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isStored 
                          ? 'bg-blue-500/20' 
                          : isGenerated 
                          ? 'bg-green-500/20' 
                          : 'bg-secondary'
                      }`}
                    >
                      {isStored ? (
                        <CloudUpload className="w-5 h-5 text-blue-400" />
                      ) : isGenerated ? (
                        <Check className="w-5 h-5 text-green-400" />
                      ) : (
                        <Volume2 className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {config.name}
                        {isStored && <span className="ml-2 text-xs text-blue-400">(Salvo)</span>}
                        {isGenerated && !isStored && <span className="ml-2 text-xs text-green-400">(Gerado)</span>}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {config.filename} • {config.duration}s • {config.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasSound && (
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
                    {isGenerated && !isStored && (
                      <Button
                        onClick={() => uploadSound(config.filename)}
                        disabled={isUploading}
                        size="sm"
                        variant="outline"
                        className="text-blue-400 border-blue-400/50 hover:bg-blue-500/10"
                      >
                        {isUploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CloudUpload className="w-4 h-4 mr-2" />
                            Salvar
                          </>
                        )}
                      </Button>
                    )}
                    
                    {/* Hidden file input for manual upload */}
                    <input
                      type="file"
                      accept="audio/mpeg,audio/wav,.mp3,.wav"
                      className="hidden"
                      ref={(el) => {
                        if (el) fileInputRefs.current.set(config.filename, el);
                      }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleManualUpload(config.filename, file);
                          e.target.value = '';
                        }
                      }}
                    />
                    
                    {/* Manual upload button */}
                    <Button
                      onClick={() => fileInputRefs.current.get(config.filename)?.click()}
                      disabled={isManualUploading}
                      size="sm"
                      variant="outline"
                    >
                      {isManualUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={() => generateSound(config)}
                      disabled={isGenerating || generatingAll}
                      size="sm"
                      variant={hasSound ? 'outline' : 'default'}
                      className={!hasSound ? 'bg-game-yellow text-game-dark hover:bg-game-yellow/90' : ''}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          {hasSound ? 'Regenerar' : 'Gerar'}
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
