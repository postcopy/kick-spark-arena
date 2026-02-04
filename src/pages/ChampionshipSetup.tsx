import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  MatchConfig, 
  DEFAULT_MATCH_CONFIG, 
  DEFAULT_SCORE_CONFIG,
  getConfigStorageKey 
} from '@/types/championship';
import { useToast } from '@/hooks/use-toast';

export default function ChampionshipSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Load existing config or use defaults
  const [config, setConfig] = useState<MatchConfig>(() => {
    const stored = localStorage.getItem(getConfigStorageKey(1));
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch { /* ignore */ }
    }
    return DEFAULT_MATCH_CONFIG;
  });
  
  const [activeTab, setActiveTab] = useState('time');
  
  // Check URL for tab parameter
  useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'rules' || tab === 'athletes' || tab === 'scoring') {
      setActiveTab(tab);
    }
  });
  
  const handleSave = () => {
    localStorage.setItem(getConfigStorageKey(config.matId), JSON.stringify(config));
    
    // Also save to main state storage to trigger hasConfig
    const stateKey = `championship-state-mat-${config.matId}`;
    const existingState = localStorage.getItem(stateKey);
    if (existingState) {
      try {
        const state = JSON.parse(existingState);
        state.config = config;
        state.hasConfig = true;
        state.timeLeftMs = config.roundTimeMs;
        localStorage.setItem(stateKey, JSON.stringify(state));
      } catch { /* ignore */ }
    } else {
      localStorage.setItem(stateKey, JSON.stringify({
        status: 'IDLE',
        round: 1,
        timeLeftMs: config.roundTimeMs,
        roundScoreRed: 0,
        roundScoreBlue: 0,
        roundWinsRed: 0,
        roundWinsBlue: 0,
        gamjeomRed: 0,
        gamjeomBlue: 0,
        events: [],
        lastUpdate: Date.now(),
        isMedicalTime: false,
        config,
        hasConfig: true,
      }));
    }
    
    toast({
      title: 'Configuração salva!',
      description: 'A luta está pronta para iniciar.',
    });
    
    navigate('/championship/mat');
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
  
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="h-14 bg-zinc-900 border-b border-zinc-700 flex items-center px-4 gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/championship/mat')}
          className="text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-purple-500" />
          <h1 className="text-lg font-bold">Configurar Luta</h1>
        </div>
        <div className="flex-1" />
        <Button onClick={handleSave} className="bg-green-600 hover:bg-green-500">
          <Save className="w-4 h-4 mr-2" />
          Salvar e Iniciar
        </Button>
      </header>
      
      {/* Content */}
      <main className="p-4 md:p-6 max-w-4xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 bg-zinc-900 mb-6">
            <TabsTrigger value="time">Tempo</TabsTrigger>
            <TabsTrigger value="rules">Regras</TabsTrigger>
            <TabsTrigger value="athletes">Atletas</TabsTrigger>
            <TabsTrigger value="scoring">Pontuação</TabsTrigger>
          </TabsList>
          
          {/* TEMPO */}
          <TabsContent value="time" className="space-y-4">
            <Card className="bg-zinc-900 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Tempo de Round</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-zinc-400">Minutos</Label>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      value={roundTime.minutes}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        roundTimeMs: parseMinSecToMs(parseInt(e.target.value) || 0, roundTime.seconds)
                      }))}
                      className="bg-zinc-800 border-zinc-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-zinc-400">Segundos</Label>
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      value={roundTime.seconds}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        roundTimeMs: parseMinSecToMs(roundTime.minutes, parseInt(e.target.value) || 0)
                      }))}
                      className="bg-zinc-800 border-zinc-600 text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Tempo Médico</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-zinc-400">Minutos</Label>
                    <Input
                      type="number"
                      min={0}
                      max={5}
                      value={medicalTime.minutes}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        medicalTimeMs: parseMinSecToMs(parseInt(e.target.value) || 0, medicalTime.seconds)
                      }))}
                      className="bg-zinc-800 border-zinc-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-zinc-400">Segundos</Label>
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      value={medicalTime.seconds}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        medicalTimeMs: parseMinSecToMs(medicalTime.minutes, parseInt(e.target.value) || 0)
                      }))}
                      className="bg-zinc-800 border-zinc-600 text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Intervalo entre Rounds</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-zinc-400">Minutos</Label>
                    <Input
                      type="number"
                      min={0}
                      max={5}
                      value={breakTime.minutes}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        breakTimeMs: parseMinSecToMs(parseInt(e.target.value) || 0, breakTime.seconds)
                      }))}
                      className="bg-zinc-800 border-zinc-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-zinc-400">Segundos</Label>
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      value={breakTime.seconds}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        breakTimeMs: parseMinSecToMs(breakTime.minutes, parseInt(e.target.value) || 0)
                      }))}
                      className="bg-zinc-800 border-zinc-600 text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* REGRAS */}
          <TabsContent value="rules" className="space-y-4">
            <Card className="bg-zinc-900 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Número de Rounds</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={String(config.maxRounds)}
                  onValueChange={(value) => setConfig(prev => ({
                    ...prev,
                    maxRounds: parseInt(value) as 1 | 3
                  }))}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1" id="rounds-1" className="border-zinc-500" />
                    <Label htmlFor="rounds-1" className="text-white cursor-pointer">1 Round</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="3" id="rounds-3" className="border-zinc-500" />
                    <Label htmlFor="rounds-3" className="text-white cursor-pointer">Best of 3</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Point Gap</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label className="text-zinc-400">
                    Diferença de pontos para vitória automática
                  </Label>
                  <Input
                    type="number"
                    min={5}
                    max={30}
                    value={config.pointGap}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      pointGap: parseInt(e.target.value) || 20
                    }))}
                    className="bg-zinc-800 border-zinc-600 text-white w-24"
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Limite de Gam-jeom</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label className="text-zinc-400">
                    Máximo de penalidades antes de desqualificação
                  </Label>
                  <Input
                    type="number"
                    min={3}
                    max={20}
                    value={config.maxGamjeom}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      maxGamjeom: parseInt(e.target.value) || 10
                    }))}
                    className="bg-zinc-800 border-zinc-600 text-white w-24"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* ATLETAS */}
          <TabsContent value="athletes" className="space-y-4">
            <Card className="bg-zinc-900 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-red-500">Atleta Vermelho (Hong)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-zinc-400">Nome</Label>
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
                    className="bg-zinc-800 border-zinc-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-zinc-400">País (opcional)</Label>
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
                    className="bg-zinc-800 border-zinc-600 text-white w-24"
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-blue-500">Atleta Azul (Chung)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-zinc-400">Nome</Label>
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
                    className="bg-zinc-800 border-zinc-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-zinc-400">País (opcional)</Label>
                  <Input
                    placeholder="USA"
                    value={config.athleteBlue?.country || ''}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      athleteBlue: prev.athleteBlue ? {
                        ...prev.athleteBlue,
                        country: e.target.value,
                      } : undefined
                    }))}
                    className="bg-zinc-800 border-zinc-600 text-white w-24"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* PONTUAÇÃO */}
          <TabsContent value="scoring" className="space-y-4">
            <Card className="bg-zinc-900 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Valores de Pontuação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-zinc-400">Soco (Tronco)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={config.scoring.punch}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        scoring: { ...prev.scoring, punch: parseInt(e.target.value) || 1 }
                      }))}
                      className="bg-zinc-800 border-zinc-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-zinc-400">Chute Corpo</Label>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={config.scoring.body}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        scoring: { ...prev.scoring, body: parseInt(e.target.value) || 2 }
                      }))}
                      className="bg-zinc-800 border-zinc-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-zinc-400">Chute Cabeça</Label>
                    <Input
                      type="number"
                      min={1}
                      max={6}
                      value={config.scoring.head}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        scoring: { ...prev.scoring, head: parseInt(e.target.value) || 3 }
                      }))}
                      className="bg-zinc-800 border-zinc-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-zinc-400">Giro Corpo</Label>
                    <Input
                      type="number"
                      min={1}
                      max={8}
                      value={config.scoring.spinBody}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        scoring: { ...prev.scoring, spinBody: parseInt(e.target.value) || 4 }
                      }))}
                      className="bg-zinc-800 border-zinc-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-zinc-400">Giro Cabeça</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={config.scoring.spinHead}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        scoring: { ...prev.scoring, spinHead: parseInt(e.target.value) || 6 }
                      }))}
                      className="bg-zinc-800 border-zinc-600 text-white"
                    />
                  </div>
                </div>
                
                <div className="pt-4 border-t border-zinc-700">
                  <Button
                    variant="outline"
                    onClick={() => setConfig(prev => ({
                      ...prev,
                      scoring: DEFAULT_SCORE_CONFIG
                    }))}
                    className="border-zinc-600 text-zinc-400 hover:text-white"
                  >
                    Restaurar Padrão WT
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
