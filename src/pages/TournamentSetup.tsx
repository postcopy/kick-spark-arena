// Tournament Setup — Operator page for creating/managing tournaments

import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournament } from '@/hooks/useTournament';
import { parseCsvAthletes } from '@/utils/csvParser';
import { BracketView } from '@/components/championship/BracketView';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import {
  Plus,
  Trash2,
  Upload,
  Shuffle,
  Trophy,
  Users,
  ChevronDown,
  ChevronUp,
  Play,
  ArrowLeft,
  X,
} from 'lucide-react';
import { AGE_GROUPS, BELTS, WEIGHT_CLASSES } from '@/types/tournament';
import type { Category, CategoryGender } from '@/types/tournament';
import logoSpe from '@/assets/logo-spe-branca.png';

export default function TournamentSetup() {
  const navigate = useNavigate();
  const t = useTournament();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [tournamentName, setTournamentName] = useState(t.tournament?.name || '');
  const [tournamentDate, setTournamentDate] = useState(t.tournament?.date || new Date().toISOString().slice(0, 10));
  const [tournamentLocation, setTournamentLocation] = useState(t.tournament?.location || '');

  // Category form
  const [catAgeGroup, setCatAgeGroup] = useState('');
  const [catBelt, setCatBelt] = useState('');
  const [catWeight, setCatWeight] = useState('');
  const [catGender, setCatGender] = useState<CategoryGender>('M');

  // Athlete form
  const [csvUploadCategoryId, setCsvUploadCategoryId] = useState<string | null>(null);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);

  // Dialogs
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const hasTournament = !!t.tournament;
  const isSetup = !t.tournament || t.tournament.status === 'SETUP';

  // Step 1: Create tournament
  const handleCreateTournament = () => {
    if (!tournamentName.trim()) return;
    t.createTournament(tournamentName.trim(), tournamentDate, tournamentLocation.trim() || undefined);
  };

  // Step 2: Add category
  const handleAddCategory = () => {
    if (!catAgeGroup || !catBelt || !catWeight) return;
    t.addCategory(catAgeGroup, catBelt, catWeight, catGender);
    setCatAgeGroup('');
    setCatBelt('');
    setCatWeight('');
  };

  // CSV import
  const handleCsvUpload = useCallback((categoryId: string) => {
    setCsvUploadCategoryId(categoryId);
    setCsvErrors([]);
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !csvUploadCategoryId) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = parseCsvAthletes(text);
      if (result.athletes.length > 0) {
        t.addAthletes(csvUploadCategoryId, result.athletes);
      }
      if (result.errors.length > 0) {
        setCsvErrors(result.errors);
      }
      setCsvUploadCategoryId(null);
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [csvUploadCategoryId, t]);

  // Toggle category expansion
  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Start tournament
  const handleStartTournament = () => {
    const catsWithBrackets = t.tournament?.categories.filter(c => c.bracket.length > 0) || [];
    if (catsWithBrackets.length === 0) return;
    t.startTournament();
    navigate('/championship/mat');
  };

  const totalAthletes = t.tournament?.categories.reduce((s, c) => s + c.athletes.length, 0) || 0;
  const totalCatsWithBrackets = t.tournament?.categories.filter(c => c.bracket.length > 0).length || 0;

  return (
    <div className="h-screen flex flex-col bg-wt-bg text-wt-fg-primary overflow-hidden font-display">
      {/* Hidden file input for CSV */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <header className="h-14 bg-wt-bg-secondary border-b border-wt-divider flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/central')}
            className="text-wt-fg-muted hover:text-wt-fg-primary transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Trophy className="h-5 w-5 text-wt-manual" />
          <span className="font-bold text-lg uppercase tracking-wider">Gerenciar campeonato</span>
        </div>
        <img src={logoSpe} alt="SPE" className="h-8 w-auto" />
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* SECTION 1: Tournament Info */}
          <section className="bg-wt-bg-secondary border border-wt-divider p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-wt-manual" />
              Dados do Campeonato
            </h2>

            {!hasTournament ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Nome do Campeonato"
                  value={tournamentName}
                  onChange={e => setTournamentName(e.target.value)}
                  className="bg-wt-bg border-wt-divider text-wt-fg-primary rounded-none"
                />
                <Input
                  type="date"
                  value={tournamentDate}
                  onChange={e => setTournamentDate(e.target.value)}
                  className="bg-wt-bg border-wt-divider text-wt-fg-primary rounded-none"
                />
                <Input
                  placeholder="Local (opcional)"
                  value={tournamentLocation}
                  onChange={e => setTournamentLocation(e.target.value)}
                  className="bg-wt-bg border-wt-divider text-wt-fg-primary rounded-none"
                />
                <Button
                  onClick={handleCreateTournament}
                  disabled={!tournamentName.trim()}
                  className="bg-wt-manual hover:bg-wt-manual/90 text-black font-bold uppercase tracking-wider rounded-none md:col-span-3"
                >
                  Criar Campeonato
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-wt-manual">
                    {t.tournament!.name}
                  </h3>
                  <p className="text-wt-fg-secondary">
                    {t.tournament!.date} {t.tournament!.location && `— ${t.tournament!.location}`}
                  </p>
                  <p className="text-sm text-wt-fg-muted mt-1">
                    {t.tournament!.categories.length} categorias · {totalAthletes} atletas
                  </p>
                </div>
                {isSetup && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    className="border-wt-danger/40 text-wt-danger hover:bg-wt-danger/10 rounded-none uppercase tracking-wider text-xs font-bold"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                )}
              </div>
            )}
          </section>

          {/* SECTION 2: Categories */}
          {hasTournament && isSetup && (
            <section className="bg-wt-bg-secondary border border-wt-divider p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-wt-manual" />
                Categorias
              </h2>

              {/* Add Category Form */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                <Select value={catAgeGroup} onValueChange={setCatAgeGroup}>
                  <SelectTrigger className="bg-wt-bg border-wt-divider text-wt-fg-primary rounded-none">
                    <SelectValue placeholder="Faixa Etária" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_GROUPS.map(ag => (
                      <SelectItem key={ag} value={ag}>{ag}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={catBelt} onValueChange={setCatBelt}>
                  <SelectTrigger className="bg-wt-bg border-wt-divider text-wt-fg-primary rounded-none">
                    <SelectValue placeholder="Graduação" />
                  </SelectTrigger>
                  <SelectContent>
                    {BELTS.map(b => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={catWeight} onValueChange={setCatWeight}>
                  <SelectTrigger className="bg-wt-bg border-wt-divider text-wt-fg-primary rounded-none">
                    <SelectValue placeholder="Peso" />
                  </SelectTrigger>
                  <SelectContent>
                    {WEIGHT_CLASSES.map(w => (
                      <SelectItem key={w} value={w}>{w}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={catGender} onValueChange={v => setCatGender(v as CategoryGender)}>
                  <SelectTrigger className="bg-wt-bg border-wt-divider text-wt-fg-primary rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Feminino</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleAddCategory}
                  disabled={!catAgeGroup || !catBelt || !catWeight}
                  className="bg-wt-manual hover:bg-wt-manual/90 text-black font-bold uppercase tracking-wider rounded-none"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>

              {/* Category List */}
              <div className="space-y-2">
                {t.tournament!.categories.map(cat => (
                  <CategoryRow
                    key={cat.id}
                    category={cat}
                    expanded={expandedCategories.has(cat.id)}
                    onToggle={() => toggleCategory(cat.id)}
                    onRemoveCategory={() => t.removeCategory(cat.id)}
                    onAddAthlete={(name, academy) => {
                      t.addAthlete(cat.id, {
                        name: name.toUpperCase(),
                        academy: academy || undefined,
                      });
                    }}
                    onRemoveAthlete={(athleteId) => t.removeAthlete(cat.id, athleteId)}
                    onCsvImport={() => handleCsvUpload(cat.id)}
                    onGenerateBracket={() => t.generateCategoryBracket(cat.id)}
                  />
                ))}

                {t.tournament!.categories.length === 0 && (
                  <p className="text-wt-fg-muted text-center py-6">
                    Nenhuma categoria adicionada ainda.
                  </p>
                )}
              </div>
            </section>
          )}

          {/* SECTION 3: Generate All + Start */}
          {hasTournament && isSetup && t.tournament!.categories.length > 0 && (
            <section className="bg-wt-bg-secondary border border-wt-divider p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Iniciar Campeonato</h2>
                  <p className="text-sm text-wt-fg-secondary mt-1">
                    {totalCatsWithBrackets}/{t.tournament!.categories.length} categorias com chaves geradas
                    · {t.getTotalMatches()} lutas no total
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={t.generateAllBrackets}
                    variant="outline"
                    className="border-wt-divider bg-wt-bg-secondary text-wt-fg-primary hover:bg-wt-bg-tertiary rounded-none uppercase tracking-wider text-xs font-bold"
                    disabled={totalAthletes < 2}
                  >
                    <Shuffle className="h-4 w-4 mr-2" />
                    Gerar Todas as Chaves
                  </Button>
                  <Button
                    onClick={() => setShowStartDialog(true)}
                    disabled={totalCatsWithBrackets === 0}
                    className="bg-wt-success hover:bg-wt-success/90 text-white font-bold px-8 uppercase tracking-wider rounded-none"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar Campeonato
                  </Button>
                </div>
              </div>
            </section>
          )}

          {/* If tournament is IN_PROGRESS, show bracket overview */}
          {hasTournament && t.tournament!.status !== 'SETUP' && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  Campeonato {t.tournament!.status === 'FINISHED' ? 'Encerrado' : 'Em Andamento'}
                </h2>
                <div className="flex gap-3">
                  <span className="text-wt-fg-secondary">
                    {t.getFinishedMatches()}/{t.getTotalMatches()} lutas
                  </span>
                  {t.tournament!.status === 'IN_PROGRESS' && (
                    <Button
                      onClick={() => navigate('/championship/mat')}
                      className="bg-wt-success hover:bg-wt-success/90 text-white font-bold uppercase tracking-wider rounded-none"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Ir para Mesa
                    </Button>
                  )}
                </div>
              </div>

              {t.tournament!.categories.map(cat => (
                <div key={cat.id} className="bg-wt-bg-secondary border border-wt-divider p-4">
                  <BracketView
                    category={cat}
                    currentMatchId={t.tournament!.currentMatchId}
                    compact
                  />
                </div>
              ))}
            </section>
          )}
        </div>
      </div>

      {/* CSV Errors Toast */}
      {csvErrors.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-wt-danger/10 border border-wt-danger/50 p-4 max-w-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="font-bold text-wt-danger uppercase tracking-wider text-xs">Erros no CSV</span>
            <button onClick={() => setCsvErrors([])} className="text-wt-danger hover:text-wt-danger/70">
              <X className="h-4 w-4" />
            </button>
          </div>
          {csvErrors.map((err, i) => (
            <p key={i} className="text-wt-danger/80 text-sm">{err}</p>
          ))}
        </div>
      )}

      {/* Delete Tournament Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-wt-bg-secondary border-wt-divider rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir Campeonato?</AlertDialogTitle>
            <AlertDialogDescription className="text-wt-fg-secondary">
              Todos os dados do campeonato serão perdidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-wt-bg-tertiary border-wt-divider text-wt-fg-primary hover:bg-wt-bg-tertiary/70 rounded-none uppercase tracking-wider text-xs font-bold">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { t.deleteTournament(); setShowDeleteDialog(false); }}
              className="bg-wt-danger hover:bg-wt-danger/90 text-white rounded-none uppercase tracking-wider text-xs font-bold"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Start Tournament Dialog */}
      <AlertDialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <AlertDialogContent className="bg-wt-bg-secondary border-wt-divider rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Iniciar Campeonato?</AlertDialogTitle>
            <AlertDialogDescription className="text-wt-fg-secondary">
              {totalCatsWithBrackets} categorias com chaves prontas. {t.getTotalMatches()} lutas no total.
              Após iniciar, não será possível alterar categorias ou atletas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-wt-bg-tertiary border-wt-divider text-wt-fg-primary hover:bg-wt-bg-tertiary/70 rounded-none uppercase tracking-wider text-xs font-bold">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { handleStartTournament(); setShowStartDialog(false); }}
              className="bg-wt-success hover:bg-wt-success/90 text-white rounded-none uppercase tracking-wider text-xs font-bold"
            >
              Iniciar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Category Row Sub-Component ──

function CategoryRow({
  category,
  expanded,
  onToggle,
  onRemoveCategory,
  onAddAthlete,
  onRemoveAthlete,
  onCsvImport,
  onGenerateBracket,
}: {
  category: Category;
  expanded: boolean;
  onToggle: () => void;
  onRemoveCategory: () => void;
  onAddAthlete: (name: string, academy: string) => void;
  onRemoveAthlete: (athleteId: string) => void;
  onCsvImport: () => void;
  onGenerateBracket: () => void;
}) {
  const [name, setName] = useState('');
  const [academy, setAcademy] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    onAddAthlete(name.trim(), academy.trim());
    setName('');
    setAcademy('');
  };

  return (
    <div className="bg-wt-bg border border-wt-divider">
      {/* Category Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-wt-bg-tertiary/40 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {expanded ? <ChevronUp className="h-4 w-4 text-wt-fg-secondary" /> : <ChevronDown className="h-4 w-4 text-wt-fg-secondary" />}
          <span className="font-bold">{category.name}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border border-wt-divider bg-wt-bg-tertiary text-wt-fg-secondary">
            {category.athletes.length} atletas
          </span>
          {category.bracket.length > 0 && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border border-wt-success/50 bg-wt-success/10 text-wt-success">
              Chave gerada
            </span>
          )}
        </div>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            onClick={onCsvImport}
            className="h-7 text-xs border-wt-divider bg-wt-bg-tertiary text-wt-fg-secondary hover:bg-wt-bg-tertiary/70 rounded-none uppercase tracking-wider font-bold"
          >
            <Upload className="h-3 w-3 mr-1" />
            CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onGenerateBracket}
            disabled={category.athletes.length < 2}
            className="h-7 text-xs border-wt-divider bg-wt-bg-tertiary text-wt-fg-secondary hover:bg-wt-bg-tertiary/70 rounded-none uppercase tracking-wider font-bold"
          >
            <Shuffle className="h-3 w-3 mr-1" />
            Gerar Chave
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-wt-danger hover:text-wt-danger/80 hover:bg-wt-danger/10 rounded-none"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-wt-bg-secondary border-wt-divider rounded-none">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Excluir categoria?</AlertDialogTitle>
                <AlertDialogDescription className="text-wt-fg-secondary">
                  {category.athletes.length > 0
                    ? `${category.athletes.length} atleta${category.athletes.length > 1 ? 's' : ''} e a chave gerada serão perdidos.`
                    : 'Esta categoria será removida.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-wt-bg-tertiary border-wt-divider text-wt-fg-primary hover:bg-wt-bg-tertiary/70 rounded-none uppercase tracking-wider text-xs font-bold">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={onRemoveCategory}
                  className="bg-wt-danger hover:bg-wt-danger/90 text-white rounded-none uppercase tracking-wider text-xs font-bold"
                >
                  Sim, excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Expanded: Athletes List + Add Form */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-wt-divider">
          {/* Add athlete form */}
          <div className="flex gap-2 mb-3">
            <Input
              placeholder="Nome do Atleta"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              className="bg-wt-bg border-wt-divider text-wt-fg-primary h-8 text-sm rounded-none"
            />
            <Input
              placeholder="Academia (opcional)"
              value={academy}
              onChange={e => setAcademy(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              className="bg-wt-bg border-wt-divider text-wt-fg-primary h-8 text-sm rounded-none w-48"
            />
            <Button
              onClick={handleAdd}
              disabled={!name.trim()}
              size="sm"
              className="bg-wt-manual hover:bg-wt-manual/90 text-black h-8 rounded-none"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Athletes list */}
          {category.athletes.length === 0 ? (
            <p className="text-wt-fg-muted text-sm text-center py-2">Nenhum atleta cadastrado</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
              {category.athletes.map((a, idx) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between px-3 py-1.5 bg-wt-bg-tertiary/40 border border-wt-divider group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-wt-fg-muted w-5">{idx + 1}.</span>
                    <span className="text-sm font-medium">{a.name}</span>
                    {a.academy && (
                      <span className="text-xs text-wt-fg-muted">({a.academy})</span>
                    )}
                  </div>
                  <button
                    onClick={() => onRemoveAthlete(a.id)}
                    className="text-wt-fg-muted hover:text-wt-danger opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Bracket Preview (compact) */}
          {category.bracket.length > 0 && (
            <div className="mt-4 pt-4 border-t border-wt-divider">
              <div className="h-48 overflow-hidden">
                <BracketView category={category} compact />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
