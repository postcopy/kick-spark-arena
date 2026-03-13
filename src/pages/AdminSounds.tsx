import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Volume2, Loader2, Download, Zap, Play, Check, AlertCircle, CloudUpload, RefreshCw, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
    filename: 'hit.wav',
    prompt: 'Quick arcade fighting game punch impact, 8-bit retro style, crisp hit sound effect',
    duration: 0.5,
    description: 'Som de impacto normal',
  },
  {
    name: 'Hit (Heavy)',
    filename: 'hit-heavy.wav',
    prompt: 'Heavy powerful punch impact, arcade fighting game, bass-heavy smash, retro game style',
    duration: 0.8,
    description: 'Som de impacto forte',
  },
  {
    name: 'Combo',
    filename: 'combo.wav',
    prompt: 'Arcade combo multiplier sound, rising pitch chime, 16-bit game style, rewarding achievement',
    duration: 0.6,
    description: 'Som de combo',
  },
  {
    name: 'Special Ready',
    filename: 'special-ready.wav',
    prompt: 'Power up ready sound, arcade fighting game, energy charging complete, dramatic whoosh',
    duration: 1.0,
    description: 'Golpe especial pronto',
  },
  {
    name: 'Special Attack',
    filename: 'special-attack.wav',
    prompt: 'Super move attack sound, arcade fighting game, explosive energy blast, dramatic impact',
    duration: 1.2,
    description: 'Golpe especial executado',
  },
  {
    name: 'K.O.',
    filename: 'ko.wav',
    prompt: 'K.O. knockout announcement sound, arcade fighting game, dramatic finish, heavy impact boom',
    duration: 1.5,
    description: 'Nocaute',
  },
  {
    name: 'Countdown 3',
    filename: 'countdown-3.wav',
    prompt: 'Arcade countdown beep, number three, retro game, electronic tone, anticipation',
    duration: 0.5,
    description: 'Contagem - 3',
  },
  {
    name: 'Countdown 2',
    filename: 'countdown-2.wav',
    prompt: 'Arcade countdown beep, number two, retro game, electronic tone, building tension',
    duration: 0.5,
    description: 'Contagem - 2',
  },
  {
    name: 'Countdown 1',
    filename: 'countdown-1.wav',
    prompt: 'Arcade countdown beep, number one, retro game, electronic tone, urgent final beep',
    duration: 0.5,
    description: 'Contagem - 1',
  },
  {
    name: 'GO!',
    filename: 'countdown-go.wav',
    prompt: 'Fight start sound, arcade game round begin, gong bell hit, dramatic start signal',
    duration: 1.0,
    description: 'Inicio - GO!',
  },
  {
    name: 'Time Up',
    filename: 'time-up.wav',
    prompt: 'Time over buzzer, arcade game round end, dramatic timeout alarm, retro style',
    duration: 1.2,
    description: 'Tempo esgotado',
  },
  {
    name: 'Victory',
    filename: 'victory.wav',
    prompt: 'Victory fanfare, arcade fighting game win, triumphant celebration melody, 16-bit style jingle',
    duration: 2.5,
    description: 'Vitoria',
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
  const [loadingStored, setLoadingStored] = useState(true);
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

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
        if (file.name.endsWith('.wav')) {
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
        description: `${config.name} pronto. Clique em "Salvar".`,
      });
    } catch (error) {
      console.error('Error generating sound:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao gerar',
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
      const { error } = await supabase.storage
        .from('sounds')
        .upload(filename, sound.blob, {
          contentType: 'audio/mpeg',
          upsert: true,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from('sounds').getPublicUrl(filename);

      setStoredSounds((prev) => {
        const newMap = new Map(prev);
        newMap.set(filename, { filename, url: urlData.publicUrl });
        return newMap;
      });

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
        title: 'Salvo!',
        description: `${filename} salvo com sucesso.`,
      });
    } catch (error) {
      console.error('Error uploading sound:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
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
      if (!file.type.startsWith('audio/')) {
        throw new Error('Deve ser um arquivo de audio');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Maximo 5MB');
      }

      const { error } = await supabase.storage
        .from('sounds')
        .upload(filename, file, {
          contentType: 'audio/mpeg',
          upsert: true,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from('sounds').getPublicUrl(filename);

      setStoredSounds((prev) => {
        const newMap = new Map(prev);
        newMap.set(filename, { filename, url: urlData.publicUrl });
        return newMap;
      });

      toast({
        title: 'Enviado!',
        description: `${filename} salvo.`,
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
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-[#E11D48]" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const storedCount = storedSounds.size;
  const totalCount = SOUND_CONFIGS.length;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="font-display font-bold text-2xl md:text-3xl text-white">Sons do Jogo</h1>
            <p className="text-sm text-[#94A3B8]">
              <span className="font-mono font-bold text-white">{storedCount}</span>/{totalCount} salvos
            </p>
          </div>
          <Button
            onClick={loadStoredSounds}
            variant="ghost"
            disabled={loadingStored}
            className="h-10 px-3 rounded-xl text-[#94A3B8] hover:text-white hover:bg-[#1E1E2E]"
          >
            <RefreshCw className={`w-5 h-5 ${loadingStored ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Tip */}
        <div className="flex items-start gap-3 p-4 bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-xl">
          <AlertCircle className="w-5 h-5 text-[#F59E0B] mt-0.5 flex-shrink-0" />
          <p className="text-sm text-[#94A3B8]">
            <strong className="text-[#F59E0B]">Dica:</strong> Clique em "Gerar" para criar com IA ou "Upload" para enviar um arquivo.
          </p>
        </div>

        {/* Sound List */}
        <div className="space-y-2">
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
                className={`p-4 rounded-xl border ${
                  isStored
                    ? 'bg-green-500/5 border-green-500/20'
                    : isGenerated
                    ? 'bg-[#F59E0B]/5 border-[#F59E0B]/20'
                    : 'bg-[#141420] border-[#1E1E2E]'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Volume2 className={`w-4 h-4 flex-shrink-0 ${isStored ? 'text-green-400' : 'text-[#64748B]'}`} />
                      <span className="font-semibold text-sm text-white truncate">{config.name}</span>
                      {isStored && <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-[#64748B] truncate ml-6">{config.description}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5 flex-shrink-0">
                    {hasSound && (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => playSound(config.filename)}
                          disabled={isPlaying}
                          className="h-9 w-9 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#1E1E2E]"
                        >
                          <Play className={`w-4 h-4 ${isPlaying ? 'animate-pulse text-[#E11D48]' : ''}`} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => downloadSound(config.filename)}
                          className="h-9 w-9 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#1E1E2E]"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </>
                    )}

                    {isGenerated && !isStored && (
                      <Button
                        size="sm"
                        onClick={() => uploadSound(config.filename)}
                        disabled={isUploading}
                        className="h-9 rounded-lg bg-gradient-to-r from-[#E11D48] to-[#9F1239] text-white text-xs font-bold"
                      >
                        {isUploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CloudUpload className="w-4 h-4" />
                        )}
                      </Button>
                    )}

                    {!isGenerated && (
                      <>
                        <input
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          ref={(el) => {
                            if (el) fileInputRefs.current.set(config.filename, el);
                          }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleManualUpload(config.filename, file);
                          }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => fileInputRefs.current.get(config.filename)?.click()}
                          disabled={isManualUploading}
                          className="h-9 w-9 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#1E1E2E]"
                        >
                          {isManualUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => generateSound(config)}
                          disabled={isGenerating}
                          className="h-9 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#1E1E2E] text-xs font-bold"
                        >
                          {isGenerating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5 mr-1" />
                              Gerar
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
