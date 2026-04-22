import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, RotateCcw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  MatchConfig,
  DEFAULT_MATCH_CONFIG,
  DEFAULT_SCORE_CONFIG,
  SCORE_LABELS,
} from '@/types/championship';
import {
  WT_RULESET_LABELS,
  getRulesetPreset,
  type WTRulesetVersion,
} from '@/lib/wtRuleset';
import { cn } from '@/lib/utils';

interface MatchConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentConfig: MatchConfig;
  onSave: (config: MatchConfig) => void;
  isLocked?: boolean; // Block editing when RUNNING
}

export function MatchConfigDialog({ 
  open, 
  onOpenChange, 
  currentConfig, 
  onSave,
  isLocked = false,
}: MatchConfigDialogProps) {
  const [config, setConfig] = useState<MatchConfig>(currentConfig);
  const [activeTab, setActiveTab] = useState('time');
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  // Sync config when dialog opens
  useEffect(() => {
    if (open) {
      setConfig(currentConfig);
    }
  }, [open, currentConfig]);

  const isDirty = JSON.stringify(config) !== JSON.stringify(currentConfig);

  const requestClose = () => {
    if (isDirty) setShowDiscardDialog(true);
    else onOpenChange(false);
  };

  const handleDiscard = () => {
    setShowDiscardDialog(false);
    onOpenChange(false);
  };

  const handleSave = () => {
    onSave(config);
    onOpenChange(false);
    toast.success('Regras salvas!');
  };
  
  const formatMsToMinSec = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return { minutes, seconds };
  };
  
  const parseMinSecToMs = (minutes: number, seconds: number) => {
    return (minutes * 60 + seconds) * 1000;
  };
  
  const roundTime = formatMsToMinSec(config.roundTimeMs);
  const medicalTime = formatMsToMinSec(config.medicalTimeMs);
  const breakTime = formatMsToMinSec(config.breakTimeMs);
  
  // Options for time selects
  const minuteOptions = Array.from({ length: 16 }, (_, i) => i);
  const secondOptions = Array.from({ length: 12 }, (_, i) => i * 5);
  
  const restoreDefaultScoring = () => {
    setConfig(prev => ({
      ...prev,
      scoring: DEFAULT_SCORE_CONFIG,
    }));
  };

  /**
   * Aplica preset do ruleset escolhido — sincroniza pointGap, maxGamjeom
   * e scoring com WT_RULESET_PRESETS. CUSTOM preserva valores atuais
   * (operador edita manualmente).
   *
   * Esta eh a "value normalization" que migrateMatchConfig (Task A.3)
   * deliberadamente NAO faz — ver commit d9d6ea8 pra justificativa de
   * separacao de responsabilidades.
   */
  const handleRulesetChange = (version: WTRulesetVersion) => {
    setConfig(prev => {
      if (version === 'CUSTOM') {
        return { ...prev, rulesetVersion: 'CUSTOM' };
      }
      const preset = getRulesetPreset(version);
      return {
        ...prev,
        rulesetVersion: version,
        pointGap: preset.pointGap,
        maxGamjeom: preset.maxGamjeom,
        scoring: preset.scoring,
      };
    });
  };
  
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) requestClose();
        else onOpenChange(true);
      }}
    >
      <DialogContent className="bg-[hsl(var(--sulsport-dark))] border-[hsl(var(--sulsport-gray))] p-0 max-w-2xl w-[95vw] max-h-[90vh] flex flex-col">
        <DialogHeader className="px-4 pt-4 pb-2 shrink-0">
          <DialogTitle className="text-white text-lg font-bold flex items-center gap-2">
            Configurar Luta
            {isLocked && (
              <span className="text-xs bg-[hsl(var(--sulsport-yellow))]/20 text-[hsl(var(--sulsport-yellow))] px-2 py-0.5 rounded-md">
                BLOQUEADO
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {isLocked && (
          <div className="mx-4 mb-2 p-2 bg-[hsl(var(--sulsport-yellow))]/10 border border-[hsl(var(--sulsport-yellow))]/30 rounded-md flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[hsl(var(--sulsport-yellow))] shrink-0" />
            <span className="text-xs text-[hsl(var(--sulsport-yellow))]">
              Pause a luta para editar as configurações
            </span>
          </div>
        )}

        {/* Ruleset selector — operador escolhe regulamento WT antes de editar valores */}
        <div className="px-4 py-3 border-b border-[hsl(var(--sulsport-gray))]">
          <Label className="text-xs font-semibold text-zinc-400 mb-1.5 block">
            REGULAMENTO WT
          </Label>
          <Select
            value={config.rulesetVersion}
            onValueChange={(v) => handleRulesetChange(v as WTRulesetVersion)}
            disabled={isLocked}
          >
            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(WT_RULESET_LABELS) as WTRulesetVersion[]).map((v) => (
                <SelectItem key={v} value={v}>
                  <div className="flex flex-col">
                    <span className="font-medium">{WT_RULESET_LABELS[v].label}</span>
                    <span className="text-[11px] text-zinc-500">
                      {WT_RULESET_LABELS[v].vigencia}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {config.rulesetVersion !== 'CUSTOM' && (
            <p className="text-[11px] text-zinc-500 mt-1">
              Valores derivam do preset. Para editar livremente, escolha &quot;Customizado&quot;.
            </p>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid grid-cols-5 bg-zinc-900 mx-4 shrink-0">
            <TabsTrigger value="time" className="text-xs sm:text-sm">Tempo</TabsTrigger>
            <TabsTrigger value="rules" className="text-xs sm:text-sm">Regras</TabsTrigger>
            <TabsTrigger value="athletes" className="text-xs sm:text-sm">Atletas</TabsTrigger>
            <TabsTrigger value="scoring" className="text-xs sm:text-sm">Pontos</TabsTrigger>
            <TabsTrigger value="hardware" className="text-xs sm:text-sm">Hardware</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4 space-y-4">
              {/* TEMPO */}
              <TabsContent value="time" className="mt-0 space-y-3">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* Round Time */}
                  <div className="bg-zinc-900 border border-zinc-700 rounded-md p-3">
                    <Label className="text-white text-sm font-bold mb-2 block">Tempo de Round</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-zinc-400 text-xs">Min</Label>
                        <Select
                          value={String(roundTime.minutes)}
                          onValueChange={(value) => setConfig(prev => ({
                            ...prev,
                            roundTimeMs: parseMinSecToMs(parseInt(value), roundTime.seconds)
                          }))}
                          disabled={isLocked}
                        >
                          <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {minuteOptions.map((min) => (
                              <SelectItem key={min} value={String(min)}>{min}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-zinc-400 text-xs">Seg</Label>
                        <Select
                          value={String(roundTime.seconds)}
                          onValueChange={(value) => setConfig(prev => ({
                            ...prev,
                            roundTimeMs: parseMinSecToMs(roundTime.minutes, parseInt(value))
                          }))}
                          disabled={isLocked}
                        >
                          <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {secondOptions.map((sec) => (
                              <SelectItem key={sec} value={String(sec)}>
                                {sec.toString().padStart(2, '0')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Medical Time */}
                  <div className="bg-zinc-900 border border-zinc-700 rounded-md p-3">
                    <Label className="text-white text-sm font-bold mb-2 block">Tempo Médico</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-zinc-400 text-xs">Min</Label>
                        <Select
                          value={String(medicalTime.minutes)}
                          onValueChange={(value) => setConfig(prev => ({
                            ...prev,
                            medicalTimeMs: parseMinSecToMs(parseInt(value), medicalTime.seconds)
                          }))}
                          disabled={isLocked}
                        >
                          <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {minuteOptions.map((min) => (
                              <SelectItem key={min} value={String(min)}>{min}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-zinc-400 text-xs">Seg</Label>
                        <Select
                          value={String(medicalTime.seconds)}
                          onValueChange={(value) => setConfig(prev => ({
                            ...prev,
                            medicalTimeMs: parseMinSecToMs(medicalTime.minutes, parseInt(value))
                          }))}
                          disabled={isLocked}
                        >
                          <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {secondOptions.map((sec) => (
                              <SelectItem key={sec} value={String(sec)}>
                                {sec.toString().padStart(2, '0')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Break Time */}
                  <div className="bg-zinc-900 border border-zinc-700 rounded-md p-3 lg:col-span-2">
                    <Label className="text-white text-sm font-bold mb-2 block">Intervalo entre Rounds</Label>
                    <div className="grid grid-cols-2 gap-2 max-w-xs">
                      <div>
                        <Label className="text-zinc-400 text-xs">Min</Label>
                        <Select
                          value={String(breakTime.minutes)}
                          onValueChange={(value) => setConfig(prev => ({
                            ...prev,
                            breakTimeMs: parseMinSecToMs(parseInt(value), breakTime.seconds)
                          }))}
                          disabled={isLocked}
                        >
                          <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {minuteOptions.map((min) => (
                              <SelectItem key={min} value={String(min)}>{min}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-zinc-400 text-xs">Seg</Label>
                        <Select
                          value={String(breakTime.seconds)}
                          onValueChange={(value) => setConfig(prev => ({
                            ...prev,
                            breakTimeMs: parseMinSecToMs(breakTime.minutes, parseInt(value))
                          }))}
                          disabled={isLocked}
                        >
                          <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {secondOptions.map((sec) => (
                              <SelectItem key={sec} value={String(sec)}>
                                {sec.toString().padStart(2, '0')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* REGRAS */}
              <TabsContent value="rules" className="mt-0 space-y-3">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* Number of Rounds */}
                  <div className="bg-zinc-900 border border-zinc-700 rounded-md p-3">
                    <Label className="text-white text-sm font-bold mb-2 block">Número de Rounds</Label>
                    <RadioGroup
                      value={String(config.maxRounds)}
                      onValueChange={(value) => setConfig(prev => ({
                        ...prev,
                        maxRounds: parseInt(value) as 1 | 3
                      }))}
                      className="flex gap-4"
                      disabled={isLocked}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="1" id="rounds-1" className="border-zinc-500" disabled={isLocked} />
                        <Label htmlFor="rounds-1" className={cn("cursor-pointer", isLocked ? "text-zinc-500" : "text-white")}>1 Round</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="3" id="rounds-3" className="border-zinc-500" disabled={isLocked} />
                        <Label htmlFor="rounds-3" className={cn("cursor-pointer", isLocked ? "text-zinc-500" : "text-white")}>Best of 3</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {/* Point Gap — derivado do ruleset, editavel apenas em CUSTOM */}
                  <div className="bg-zinc-900 border border-zinc-700 rounded-md p-3">
                    <Label className="text-white text-sm font-bold mb-1 block">Point Gap</Label>
                    <p className="text-zinc-500 text-xs mb-2">Diferença para vitória automática</p>
                    <Input
                      type="number"
                      min={5}
                      max={30}
                      value={config.pointGap}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        pointGap: parseInt(e.target.value) || 20
                      }))}
                      disabled={isLocked || config.rulesetVersion !== 'CUSTOM'}
                      className="bg-zinc-800 border-zinc-600 text-white w-20 h-9"
                    />
                  </div>

                  {/* Gam-jeom Limit — derivado do ruleset, editavel apenas em CUSTOM */}
                  <div className="bg-zinc-900 border border-zinc-700 rounded-md p-3">
                    <Label className="text-white text-sm font-bold mb-1 block">Limite de Gam-jeom</Label>
                    <p className="text-zinc-500 text-xs mb-2">Máximo de penalidades antes de desqualificação</p>
                    <Input
                      type="number"
                      min={3}
                      max={20}
                      value={config.maxGamjeom}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        maxGamjeom: parseInt(e.target.value) || 10
                      }))}
                      disabled={isLocked || config.rulesetVersion !== 'CUSTOM'}
                      className="bg-zinc-800 border-zinc-600 text-white w-20 h-9"
                    />
                  </div>
                  
                  {/* Tiebreak by Hits */}
                  <div className="bg-zinc-900 border border-zinc-700 rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white text-sm font-bold block">Desempate por HITS</Label>
                        <p className="text-zinc-500 text-xs mt-1">Em empate de pontos no round, o lutador com mais HITS vence automaticamente</p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={config.tiebreakByHits !== false}
                        onClick={() => setConfig(prev => ({
                          ...prev,
                          tiebreakByHits: prev.tiebreakByHits === false ? true : false
                        }))}
                        disabled={isLocked}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                          config.tiebreakByHits !== false ? "bg-green-600" : "bg-zinc-600",
                          isLocked && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <span className={cn(
                          "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform",
                          config.tiebreakByHits !== false ? "translate-x-5" : "translate-x-0"
                        )} />
                      </button>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* ATLETAS */}
              <TabsContent value="athletes" className="mt-0 space-y-3">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* Red Athlete */}
                  <div className="bg-zinc-900 border border-[hsl(var(--sulsport-red))]/50 rounded-md p-3">
                    <Label className="text-[hsl(var(--sulsport-red-light))] text-sm font-bold mb-2 block">
                      Vermelho (Hong)
                    </Label>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-zinc-400 text-xs">Nome</Label>
                        <Input
                          placeholder="Nome do atleta"
                          value={config.athleteRed?.name || ''}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            athleteRed: {
                              id: prev.athleteRed?.id || crypto.randomUUID(),
                              name: e.target.value,
                              country: prev.athleteRed?.country,
                            }
                          }))}
                          disabled={isLocked}
                          maxLength={100}
                          className="bg-zinc-800 border-zinc-600 text-white h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-zinc-400 text-xs">País (opcional)</Label>
                        <Input
                          placeholder="BRA"
                          value={config.athleteRed?.country || ''}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            athleteRed: prev.athleteRed ? {
                              ...prev.athleteRed,
                              country: e.target.value,
                            } : undefined
                          }))}
                          disabled={isLocked}
                          maxLength={50}
                          className="bg-zinc-800 border-zinc-600 text-white w-20 h-9"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Blue Athlete */}
                  <div className="bg-zinc-900 border border-[hsl(var(--sulsport-blue))]/50 rounded-md p-3">
                    <Label className="text-[hsl(var(--sulsport-blue-light))] text-sm font-bold mb-2 block">
                      Azul (Chung)
                    </Label>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-zinc-400 text-xs">Nome</Label>
                        <Input
                          placeholder="Nome do atleta"
                          value={config.athleteBlue?.name || ''}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            athleteBlue: {
                              id: prev.athleteBlue?.id || crypto.randomUUID(),
                              name: e.target.value,
                              country: prev.athleteBlue?.country,
                            }
                          }))}
                          disabled={isLocked}
                          maxLength={100}
                          className="bg-zinc-800 border-zinc-600 text-white h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-zinc-400 text-xs">País (opcional)</Label>
                        <Input
                          placeholder="BRA"
                          value={config.athleteBlue?.country || ''}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            athleteBlue: prev.athleteBlue ? {
                              ...prev.athleteBlue,
                              country: e.target.value,
                            } : undefined
                          }))}
                          disabled={isLocked}
                          maxLength={50}
                          className="bg-zinc-800 border-zinc-600 text-white w-20 h-9"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* PONTUAÇÃO */}
              <TabsContent value="scoring" className="mt-0 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-white text-sm font-bold">Valores de Pontuação</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={restoreDefaultScoring}
                    disabled={isLocked}
                    className="text-xs text-zinc-400 hover:text-white h-7"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Restaurar WT
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {(Object.keys(config.scoring) as Array<keyof typeof config.scoring>).map((key) => (
                    <div key={key} className="bg-zinc-900 border border-zinc-700 rounded-md p-3">
                      <Label className="text-zinc-400 text-xs mb-1 block">{SCORE_LABELS[key]}</Label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={config.scoring[key]}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          scoring: {
                            ...prev.scoring,
                            [key]: parseInt(e.target.value) || 1,
                          }
                        }))}
                        disabled={isLocked || config.rulesetVersion !== 'CUSTOM'}
                        className="bg-zinc-800 border-zinc-600 text-white w-16 h-9 text-center font-bold"
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              {/* HARDWARE */}
              <TabsContent value="hardware" className="mt-0 space-y-3">
                {/* Scoring mode info */}
                <div className="bg-zinc-900 border border-zinc-700 rounded-md p-3">
                  <Label className="text-white text-sm font-bold mb-2 block">Modo de Pontuação</Label>
                  <p className="text-xs text-zinc-500">
                    IMPACTOS — Pontuação por intensidade: 0-14 = ruído (ignorado), 15-19 = HIT (só registro), 20+ = PONTO (soma placar).
                  </p>
                </div>
                
                {/* Impact Thresholds */}
                <>
                    <div className="bg-zinc-900 border border-zinc-700 rounded-md p-3">
                      <Label className="text-white text-sm font-bold mb-2 block">Thresholds de Intensidade</Label>
                      <p className="text-xs text-zinc-500 mb-3">
                        Valores relativos ao noise floor. Peak acima do floor ≥ threshold = pontuação.
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-zinc-400 text-xs mb-1 block">Colete HIT (min)</Label>
                          <Input
                            type="number"
                            min={1}
                            value={config.impactThresholds?.vestHitMin ?? 15}
                            onChange={(e) => setConfig(prev => ({
                              ...prev,
                              impactThresholds: {
                                ...prev.impactThresholds!,
                                vestHitMin: parseInt(e.target.value) || 15,
                                vestPointMin: prev.impactThresholds?.vestPointMin ?? 19,
                                helmetHitMin: prev.impactThresholds?.helmetHitMin ?? 5,
                                helmetPointMin: prev.impactThresholds?.helmetPointMin ?? 10,
                                noiseFloor: prev.impactThresholds?.noiseFloor ?? {},
                              }
                            }))}
                            disabled={isLocked}
                            className="bg-zinc-800 border-zinc-600 text-white w-20 h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-zinc-400 text-xs mb-1 block">Colete PONTO (min)</Label>
                          <Input
                            type="number"
                            min={1}
                            value={config.impactThresholds?.vestPointMin ?? 19}
                            onChange={(e) => setConfig(prev => ({
                              ...prev,
                              impactThresholds: {
                                ...prev.impactThresholds!,
                                vestHitMin: prev.impactThresholds?.vestHitMin ?? 15,
                                vestPointMin: parseInt(e.target.value) || 19,
                                helmetHitMin: prev.impactThresholds?.helmetHitMin ?? 5,
                                helmetPointMin: prev.impactThresholds?.helmetPointMin ?? 10,
                                noiseFloor: prev.impactThresholds?.noiseFloor ?? {},
                              }
                            }))}
                            disabled={isLocked}
                            className="bg-zinc-800 border-zinc-600 text-white w-20 h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-zinc-400 text-xs mb-1 block">Capacete HIT (min)</Label>
                          <Input
                            type="number"
                            min={1}
                            value={config.impactThresholds?.helmetHitMin ?? 5}
                            onChange={(e) => setConfig(prev => ({
                              ...prev,
                              impactThresholds: {
                                ...prev.impactThresholds!,
                                vestHitMin: prev.impactThresholds?.vestHitMin ?? 15,
                                vestPointMin: prev.impactThresholds?.vestPointMin ?? 19,
                                helmetHitMin: parseInt(e.target.value) || 5,
                                helmetPointMin: prev.impactThresholds?.helmetPointMin ?? 10,
                                noiseFloor: prev.impactThresholds?.noiseFloor ?? {},
                              }
                            }))}
                            disabled={isLocked}
                            className="bg-zinc-800 border-zinc-600 text-white w-20 h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-zinc-400 text-xs mb-1 block">Capacete PONTO (min)</Label>
                          <Input
                            type="number"
                            min={1}
                            value={config.impactThresholds?.helmetPointMin ?? 10}
                            onChange={(e) => setConfig(prev => ({
                              ...prev,
                              impactThresholds: {
                                ...prev.impactThresholds!,
                                vestHitMin: prev.impactThresholds?.vestHitMin ?? 15,
                                vestPointMin: prev.impactThresholds?.vestPointMin ?? 19,
                                helmetHitMin: prev.impactThresholds?.helmetHitMin ?? 5,
                                helmetPointMin: parseInt(e.target.value) || 10,
                                noiseFloor: prev.impactThresholds?.noiseFloor ?? {},
                              }
                            }))}
                            disabled={isLocked}
                            className="bg-zinc-800 border-zinc-600 text-white w-20 h-9"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Anti-duplicate window */}
                    <div className="bg-zinc-900 border border-zinc-700 rounded-md p-3">
                      <Label className="text-white text-sm font-bold mb-1 block">Janela Anti-Duplicado (ms)</Label>
                      <p className="text-xs text-zinc-500 mb-2">
                        Impactos do mesmo lado dentro desta janela são mesclados (HEAD priorizado).
                      </p>
                      <Input
                        type="number"
                        min={50}
                        max={1000}
                        value={config.antiDuplicateWindowMs ?? 300}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          antiDuplicateWindowMs: parseInt(e.target.value) || 300,
                        }))}
                        disabled={isLocked}
                        className="bg-zinc-800 border-zinc-600 text-white w-24 h-9"
                      />
                    </div>
                    
                    {/* Noise Floor per device */}
                    <div className="bg-zinc-900 border border-zinc-700 rounded-md p-3">
                      <Label className="text-white text-sm font-bold mb-2 block">Noise Floor por Equipamento</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: '1', label: 'Colete Azul (ID 1)' },
                          { id: '2', label: 'Colete Vermelho (ID 2)' },
                          { id: '3', label: 'Capacete Azul (ID 3)' },
                          { id: '4', label: 'Capacete Vermelho (ID 4)' },
                        ].map(({ id, label }) => (
                          <div key={id}>
                            <Label className="text-zinc-400 text-xs mb-1 block">{label}</Label>
                            <Input
                              type="number"
                              min={0}
                              value={config.impactThresholds?.noiseFloor?.[id] ?? 0}
                              onChange={(e) => setConfig(prev => ({
                                ...prev,
                                impactThresholds: {
                                  ...prev.impactThresholds!,
                                  vestHitMin: prev.impactThresholds?.vestHitMin ?? 15,
                                  vestPointMin: prev.impactThresholds?.vestPointMin ?? 19,
                                  helmetHitMin: prev.impactThresholds?.helmetHitMin ?? 5,
                                  helmetPointMin: prev.impactThresholds?.helmetPointMin ?? 10,
                                  noiseFloor: {
                                    ...prev.impactThresholds?.noiseFloor,
                                    [id]: parseInt(e.target.value) || 0,
                                  },
                                }
                              }))}
                              disabled={isLocked}
                              className="bg-zinc-800 border-zinc-600 text-white w-20 h-9"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Use Calibration Button */}
                    <Button
                      onClick={() => {
                        try {
                          const stored = localStorage.getItem('sulsport:championship:diag:v1');
                          if (!stored) return;
                          const data = JSON.parse(stored);
                          const nf = data.noiseFloor || {};
                          const th = data.thresholds || {};
                          setConfig(prev => ({
                            ...prev,
                            impactThresholds: {
                              vestHitMin: th.vestHitMin ?? prev.impactThresholds?.vestHitMin ?? 15,
                              vestPointMin: th.vestPointMin ?? prev.impactThresholds?.vestPointMin ?? 19,
                              helmetHitMin: th.helmetHitMin ?? prev.impactThresholds?.helmetHitMin ?? 5,
                              helmetPointMin: th.helmetPointMin ?? prev.impactThresholds?.helmetPointMin ?? 10,
                              noiseFloor: nf,
                            },
                          }));
                        } catch (e) {
                          console.error('Failed to load calibration data:', e);
                        }
                      }}
                      disabled={isLocked}
                      className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Usar Calibração
                    </Button>
                  </>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
        
        {/* Footer - Always Visible */}
        <div className="shrink-0 p-4 border-t border-[hsl(var(--sulsport-gray))] bg-[hsl(var(--sulsport-dark))] flex gap-3 justify-end">
          <Button
            variant="ghost"
            onClick={requestClose}
            className="text-zinc-400 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLocked}
            className="bg-green-600 hover:bg-green-500 text-white font-bold"
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </div>
      </DialogContent>

      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent className="bg-[hsl(var(--sulsport-dark))] border-[hsl(var(--sulsport-gray))]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Descartar mudanças?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              As alterações não serão salvas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-700 border-zinc-600 text-white hover:bg-zinc-600">
              Continuar editando
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscard}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              Sim, descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
