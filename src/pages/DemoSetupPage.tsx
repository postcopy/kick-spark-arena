// Demo Setup — Generate sample tournament data for testing & presentation
// Creates a realistic tournament with categories, athletes, brackets

import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Trash2, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import logoSpe from '@/assets/logo-spe-branca.png';

const TOURNAMENT_KEY = 'sulsport:tournament';

// Realistic Brazilian athlete names
const MALE_NAMES = [
  'LUCAS SILVA', 'PEDRO SANTOS', 'GABRIEL OLIVEIRA', 'MATHEUS COSTA',
  'RAFAEL FERREIRA', 'BRUNO ALMEIDA', 'FELIPE RODRIGUES', 'THIAGO PEREIRA',
  'GUSTAVO LIMA', 'ANDERSON SOUZA', 'DIEGO MARTINS', 'LEONARDO ARAUJO',
  'RICARDO CARVALHO', 'MARCOS RIBEIRO', 'VINICIUS GOMES', 'DANIEL BARBOSA',
  'RODRIGO CARDOSO', 'FERNANDO NUNES', 'HENRIQUE MORAES', 'CAIO TEIXEIRA',
  'ANDRE MENDES', 'CARLOS ROCHA', 'EDUARDO DIAS', 'JONATHAN PINTO',
  'SAMUEL CAVALCANTI', 'RENAN MONTEIRO', 'JEFFERSON NASCIMENTO', 'ALEX VIEIRA',
  'WILLIAM FREITAS', 'NICOLAS CORREIA', 'IGOR MACHADO', 'JULIO CAMPOS',
];

const FEMALE_NAMES = [
  'ANA SILVA', 'MARIA SANTOS', 'JULIANA OLIVEIRA', 'CAMILA COSTA',
  'BEATRIZ FERREIRA', 'LARISSA ALMEIDA', 'FERNANDA RODRIGUES', 'PATRICIA PEREIRA',
  'AMANDA LIMA', 'GABRIELA SOUZA', 'CAROLINA MARTINS', 'LETICIA ARAUJO',
  'MARIANA CARVALHO', 'ISABELA RIBEIRO', 'NATALIA GOMES', 'BRUNA BARBOSA',
  'RAFAELA CARDOSO', 'TATIANA NUNES', 'VANESSA MORAES', 'DANIELA TEIXEIRA',
  'RENATA MENDES', 'PRISCILA ROCHA', 'ALINE DIAS', 'JESSICA PINTO',
];

const ACADEMIES = [
  'CT Dragon', 'Team Alpha', 'Sulsport Academy', 'Lions TKD',
  'Arena Combat', 'Black Tiger', 'Warriors Academy', 'Elite TKD',
  'Phoenix Fight', 'Gladiadores', 'Iron Fist', 'Koryo Team',
];

function uuid() {
  return crypto.randomUUID();
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateBracket(athletes: { id: string; name: string; academy?: string }[], categoryId: string, startMatchNumber: number) {
  const shuffled = shuffle(athletes);
  const n = shuffled.length;
  // Bracket size = next power of 2
  let size = 1;
  while (size < n) size *= 2;
  const totalRounds = Math.log2(size);
  const matches: any[] = [];
  let matchCounter = startMatchNumber;

  // Round 1
  const r1Matches = size / 2;
  for (let pos = 0; pos < r1Matches; pos++) {
    const aIdx = pos * 2;
    const bIdx = pos * 2 + 1;
    const athleteRed = aIdx < n ? shuffled[aIdx] : undefined;
    const athleteBlue = bIdx < n ? shuffled[bIdx] : undefined;

    const isBye = !athleteRed || !athleteBlue;
    const match: any = {
      id: `${categoryId}-r1-m${pos}`,
      round: 1,
      position: pos,
      athleteRed: athleteRed || undefined,
      athleteBlue: athleteBlue || undefined,
      status: isBye ? 'BYE' : 'READY',
      matchNumber: matchCounter++,
    };

    if (isBye) {
      const winner = athleteRed || athleteBlue;
      if (winner) {
        match.winnerId = winner.id;
        match.winnerSide = athleteRed ? 'RED' : 'BLUE';
      }
    }

    matches.push(match);
  }

  // Subsequent rounds
  for (let round = 2; round <= totalRounds; round++) {
    const roundMatches = size / Math.pow(2, round);
    for (let pos = 0; pos < roundMatches; pos++) {
      const match: any = {
        id: `${categoryId}-r${round}-m${pos}`,
        round,
        position: pos,
        status: 'PENDING',
        matchNumber: matchCounter++,
      };
      matches.push(match);
    }
  }

  // Link nextMatchId
  for (const m of matches) {
    if (m.round < totalRounds) {
      const nextPos = Math.floor(m.position / 2);
      m.nextMatchId = `${categoryId}-r${m.round + 1}-m${nextPos}`;
    }
  }

  // Propagate BYE winners to next round
  for (const m of matches) {
    if (m.status === 'BYE' && m.winnerId && m.nextMatchId) {
      const next = matches.find((x: any) => x.id === m.nextMatchId);
      if (next) {
        const isEven = m.position % 2 === 0;
        if (isEven) {
          next.athleteRed = m.athleteRed || m.athleteBlue;
        } else {
          next.athleteBlue = m.athleteRed || m.athleteBlue;
        }
        if (next.athleteRed && next.athleteBlue) {
          next.status = 'READY';
        }
      }
    }
  }

  return { matches, nextMatchNumber: matchCounter };
}

interface DemoConfig {
  name: string;
  categories: {
    ageGroup: string;
    belt: string;
    weightClass: string;
    gender: 'M' | 'F';
    athleteCount: number;
  }[];
}

const DEMO_CONFIGS: DemoConfig[] = [
  {
    name: 'Campeonato Gaúcho de Taekwondo 2026',
    categories: [
      { ageGroup: 'Cadete', belt: 'Verde', weightClass: 'Até 55kg', gender: 'M', athleteCount: 8 },
      { ageGroup: 'Cadete', belt: 'Azul', weightClass: 'Até 55kg', gender: 'F', athleteCount: 4 },
      { ageGroup: 'Juvenil', belt: 'Azul', weightClass: 'Até 68kg', gender: 'M', athleteCount: 6 },
      { ageGroup: 'Adulto', belt: 'Preta', weightClass: 'Até 80kg', gender: 'M', athleteCount: 8 },
      { ageGroup: 'Adulto', belt: 'Preta', weightClass: 'Até 67kg', gender: 'F', athleteCount: 4 },
      { ageGroup: 'Adulto', belt: 'Vermelha', weightClass: 'Até 74kg', gender: 'M', athleteCount: 5 },
    ],
  },
  {
    name: 'Copa Sul de Taekwondo',
    categories: [
      { ageGroup: 'Infantil', belt: 'Amarela', weightClass: 'Até 45kg', gender: 'M', athleteCount: 4 },
      { ageGroup: 'Cadete', belt: 'Verde', weightClass: 'Até 51kg', gender: 'M', athleteCount: 6 },
      { ageGroup: 'Adulto', belt: 'Preta', weightClass: 'Até 68kg', gender: 'M', athleteCount: 8 },
    ],
  },
  {
    name: 'Torneio Interacademias',
    categories: [
      { ageGroup: 'Adulto', belt: 'Preta', weightClass: 'Até 74kg', gender: 'M', athleteCount: 16 },
      { ageGroup: 'Adulto', belt: 'Preta', weightClass: 'Até 62kg', gender: 'F', athleteCount: 8 },
    ],
  },
];

function generateTournament(config: DemoConfig) {
  let maleIdx = 0;
  let femaleIdx = 0;
  let globalMatchCounter = 1;

  const shuffledMales = shuffle(MALE_NAMES);
  const shuffledFemales = shuffle(FEMALE_NAMES);

  const categories = config.categories.map((cat) => {
    const catId = uuid();
    const names = cat.gender === 'M' ? shuffledMales : shuffledFemales;
    const startIdx = cat.gender === 'M' ? maleIdx : femaleIdx;

    const athletes = [];
    for (let i = 0; i < cat.athleteCount; i++) {
      const nameIdx = (startIdx + i) % names.length;
      athletes.push({
        id: uuid(),
        name: names[nameIdx],
        academy: ACADEMIES[Math.floor(Math.random() * ACADEMIES.length)],
      });
    }

    if (cat.gender === 'M') maleIdx += cat.athleteCount;
    else femaleIdx += cat.athleteCount;

    const { matches, nextMatchNumber } = generateBracket(athletes, catId, globalMatchCounter);
    globalMatchCounter = nextMatchNumber;

    return {
      id: catId,
      name: `${cat.ageGroup} ${cat.belt} ${cat.weightClass} ${cat.gender === 'M' ? 'Masc' : 'Fem'}`,
      ageGroup: cat.ageGroup,
      belt: cat.belt,
      weightClass: cat.weightClass,
      gender: cat.gender,
      athletes,
      bracket: matches,
      status: 'PENDING' as const,
    };
  });

  // Auto-assign categories across 3 mats round-robin
  const matAssignments: Record<number, string[]> = { 1: [], 2: [], 3: [] };
  categories.forEach((cat, i) => {
    const mat = (i % 3) + 1;
    matAssignments[mat].push(cat.id);
  });

  const tournament = {
    id: uuid(),
    name: config.name,
    date: new Date().toISOString().split('T')[0],
    location: 'Ginásio Municipal',
    categories,
    status: 'IN_PROGRESS' as const,
    createdAt: Date.now(),
    globalMatchCounter,
    matAssignments,
  };

  return tournament;
}

export default function DemoSetupPage() {
  const navigate = useNavigate();
  const [generated, setGenerated] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<number | null>(null);

  const existing = localStorage.getItem(TOURNAMENT_KEY);

  function handleGenerate(configIndex: number) {
    const tournament = generateTournament(DEMO_CONFIGS[configIndex]);
    localStorage.setItem(TOURNAMENT_KEY, JSON.stringify(tournament));
    // Broadcast to other tabs
    try {
      const bc = new BroadcastChannel('sulsport:tournament-sync');
      bc.postMessage({ type: 'tournament-updated', tournament });
      bc.close();
    } catch {}
    setGenerated(true);
    setSelectedConfig(configIndex);
  }

  function handleClear() {
    localStorage.removeItem(TOURNAMENT_KEY);
    try {
      const bc = new BroadcastChannel('sulsport:tournament-sync');
      bc.postMessage({ type: 'tournament-updated', tournament: null });
      bc.close();
    } catch {}
    setGenerated(false);
    setSelectedConfig(null);
  }

  return (
    <div className="min-h-screen bg-[#07070C] text-white p-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,80,40,0.08),transparent)]" />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={() => navigate('/professional')}
            className="p-2 rounded-lg text-zinc-600 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <img src={logoSpe} alt="SPE" className="h-8 object-contain" />
          <div className="w-px h-6 bg-zinc-800" />
          <h1 className="font-black text-lg tracking-[0.15em]">DEMO & TESTE</h1>
        </div>

        {/* Status */}
        {existing && !generated && (
          <div className="mb-8 p-4 border border-yellow-500/20 bg-yellow-500/5 rounded-lg flex items-center justify-between">
            <p className="text-yellow-400/80 text-sm">
              Já existe um torneio carregado. Gerar um novo vai substituí-lo.
            </p>
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all"
            >
              <Trash2 className="h-4 w-4" /> Limpar
            </button>
          </div>
        )}

        {generated && selectedConfig !== null && (
          <div className="mb-8 p-4 border border-emerald-500/20 bg-emerald-500/5 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <p className="text-emerald-400 font-bold text-sm">Torneio gerado com sucesso!</p>
            </div>
            <p className="text-zinc-400 text-sm mb-4">
              <strong>{DEMO_CONFIGS[selectedConfig].name}</strong> — {DEMO_CONFIGS[selectedConfig].categories.length} categorias,{' '}
              {DEMO_CONFIGS[selectedConfig].categories.reduce((s, c) => s + c.athleteCount, 0)} atletas, 3 quadras
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/central')}
                className="px-4 py-2 text-sm bg-[hsl(45,93%,47%)]/10 text-[hsl(45,93%,60%)] border border-[hsl(45,93%,47%)]/20 rounded-lg hover:bg-[hsl(45,93%,47%)]/20 transition-all font-bold tracking-wide"
              >
                Abrir Central
              </button>
              <button
                onClick={() => navigate('/championship/mat?mat=1')}
                className="px-4 py-2 text-sm bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all font-bold tracking-wide"
              >
                Abrir Mat 1
              </button>
              <button
                onClick={() => navigate('/championship/tv?mat=1')}
                className="px-4 py-2 text-sm bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-all font-bold tracking-wide"
              >
                Abrir TV 1
              </button>
              <button
                onClick={() => navigate('/chamada')}
                className="px-4 py-2 text-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-all font-bold tracking-wide"
              >
                Abrir Chamada
              </button>
            </div>
          </div>
        )}

        {/* Tournament Presets */}
        <h2 className="text-zinc-400 text-xs tracking-[0.3em] uppercase font-bold mb-6">
          Selecione um torneio de demonstração
        </h2>

        <div className="grid gap-4">
          {DEMO_CONFIGS.map((config, i) => (
            <button
              key={i}
              onClick={() => handleGenerate(i)}
              className="group text-left p-6 bg-[#0c0c12] border border-white/[0.04] rounded-xl hover:border-[hsl(45,93%,47%)]/30 transition-all hover:scale-[1.005] active:scale-[0.995]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-black tracking-wide text-white/90 group-hover:text-white mb-2">
                    {config.name}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-0.5 bg-[hsl(45,93%,47%)]/10 text-[hsl(45,93%,60%)] text-xs rounded font-bold">
                      {config.categories.length} categorias
                    </span>
                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded font-bold">
                      {config.categories.reduce((s, c) => s + c.athleteCount, 0)} atletas
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs rounded font-bold">
                      3 quadras
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {config.categories.map((cat, j) => (
                      <span key={j} className="text-zinc-600 text-xs">
                        {cat.ageGroup} {cat.belt} {cat.weightClass} {cat.gender === 'M' ? '♂' : '♀'} ({cat.athleteCount})
                      </span>
                    ))}
                  </div>
                </div>
                <Zap className="h-5 w-5 text-zinc-700 group-hover:text-[hsl(45,93%,60%)] transition-colors flex-shrink-0 mt-1" />
              </div>
            </button>
          ))}
        </div>

        {/* Clear button at bottom */}
        {(existing || generated) && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-6 py-3 text-sm text-zinc-600 hover:text-red-400 transition-colors"
            >
              <Trash2 className="h-4 w-4" /> Limpar todos os dados de torneio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
