import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useRegistration } from '@/hooks/useRegistration';
import { calculateCategory, type AcademyAthlete, type RegistrationStep } from '@/types/registration';
import {
  UserCircle,
  Users,
  ClipboardCheck,
  CheckCircle2,
  Plus,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import logoSpe from '@/assets/logo-spe-branca.png';

// ─── Selected Athlete Interface ──────────────────────────────────────────────

interface SelectedAthlete {
  athlete: AcademyAthlete;
  weight: number;
  belt: string;
  category: string;
  reviewed: boolean;
}

// ─── New Athlete Modal Form State ────────────────────────────────────────────

interface NewAthleteForm {
  name: string;
  birth_date: string;
  gender: 'M' | 'F';
  belt: string;
  weight: number;
}

const BELT_OPTIONS = ['branca', 'amarela', 'verde', 'azul', 'vermelha', 'preta'];

const STEPS: { key: RegistrationStep; label: string; icon: React.ReactNode }[] = [
  { key: 'identification', label: 'Identificação', icon: <UserCircle className="w-5 h-5" /> },
  { key: 'athletes', label: 'Atletas', icon: <Users className="w-5 h-5" /> },
  { key: 'review', label: 'Revisão', icon: <ClipboardCheck className="w-5 h-5" /> },
  { key: 'confirmation', label: 'Confirmação', icon: <CheckCircle2 className="w-5 h-5" /> },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function PublicRegistration() {
  const [searchParams] = useSearchParams();
  const tournamentId = searchParams.get('t');

  const {
    tournament,
    coach,
    savedAthletes,
    isLoading,
    error,
    loadTournament,
    identifyCoach,
    loadAthletes,
    addAthlete,
    submitRegistration,
  } = useRegistration();

  const [step, setStep] = useState<RegistrationStep>('identification');
  const [tournamentLoaded, setTournamentLoaded] = useState(false);
  const [tournamentError, setTournamentError] = useState(false);

  // Step 1 state
  const [phone, setPhone] = useState('');
  const [academyName, setAcademyName] = useState('');
  const [coachName, setCoachName] = useState('');

  // Step 2 state
  const [selectedAthletes, setSelectedAthletes] = useState<SelectedAthlete[]>([]);
  const [weightInput, setWeightInput] = useState<{ athleteId: string; value: string } | null>(null);
  const [showNewAthleteModal, setShowNewAthleteModal] = useState(false);
  const [newAthleteForm, setNewAthleteForm] = useState<NewAthleteForm>({
    name: '',
    birth_date: '',
    gender: 'M',
    belt: 'branca',
    weight: 0,
  });

  // Step 4 state
  const [registrationId, setRegistrationId] = useState<string | null>(null);

  // ── Load tournament on mount ───────────────────────────────────────────────

  useEffect(() => {
    if (!tournamentId) return;
    loadTournament(tournamentId).then((ok) => {
      setTournamentLoaded(true);
      if (!ok) setTournamentError(true);
    });
  }, [tournamentId, loadTournament]);

  // ── Invalid link ───────────────────────────────────────────────────────────

  if (!tournamentId) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
        <div className="bg-[#141420] border border-[#1E1E2E] rounded-2xl p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Link Inválido</h1>
          <p className="text-gray-400">
            Este link de inscrição não possui um torneio associado. Verifique o link e tente novamente.
          </p>
        </div>
      </div>
    );
  }

  // ── Loading tournament ─────────────────────────────────────────────────────

  if (!tournamentLoaded) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
      </div>
    );
  }

  // ── Tournament not found ───────────────────────────────────────────────────

  if (tournamentError || !tournament) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
        <div className="bg-[#141420] border border-[#1E1E2E] rounded-2xl p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Torneio não encontrado</h1>
          <p className="text-gray-400">
            {error || 'O torneio não existe ou as inscrições estão encerradas.'}
          </p>
        </div>
      </div>
    );
  }

  // ── Step indicator index ───────────────────────────────────────────────────

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await identifyCoach(phone, academyName, coachName);
    if (result) {
      // Pre-fill if returning coach
      setAcademyName(result.academy_name);
      setCoachName(result.coach_name);
      await loadAthletes(result.id);
      setStep('athletes');
    }
  };

  const handleToggleAthlete = (athlete: AcademyAthlete) => {
    const exists = selectedAthletes.find((s) => s.athlete.id === athlete.id);
    if (exists) {
      setSelectedAthletes((prev) => prev.filter((s) => s.athlete.id !== athlete.id));
      // Clear weight input if it was open for this athlete
      if (weightInput?.athleteId === athlete.id) setWeightInput(null);
    } else {
      // Show inline weight input instead of prompt()
      setWeightInput({ athleteId: athlete.id, value: '' });
    }
  };

  const handleConfirmWeight = (athlete: AcademyAthlete) => {
    if (!weightInput) return;
    const weight = parseFloat(weightInput.value);
    if (isNaN(weight) || weight <= 0) return;

    const category = calculateCategory(
      athlete.birth_date,
      athlete.gender,
      athlete.belt,
      weight,
      tournament.date,
    );

    setSelectedAthletes((prev) => [
      ...prev,
      { athlete, weight, belt: athlete.belt, category, reviewed: false },
    ]);
    setWeightInput(null);
  };

  const handleAddNewAthlete = async () => {
    if (!coach) return;
    if (!newAthleteForm.name || !newAthleteForm.birth_date || newAthleteForm.weight <= 0) return;

    const created = await addAthlete(
      {
        coach_id: coach.id,
        name: newAthleteForm.name,
        birth_date: newAthleteForm.birth_date,
        gender: newAthleteForm.gender,
        belt: newAthleteForm.belt,
      },
      coach.id,
    );

    if (created) {
      const category = calculateCategory(
        created.birth_date,
        created.gender,
        created.belt,
        newAthleteForm.weight,
        tournament.date,
      );

      setSelectedAthletes((prev) => [
        ...prev,
        {
          athlete: created,
          weight: newAthleteForm.weight,
          belt: created.belt,
          category,
          reviewed: false,
        },
      ]);

      setNewAthleteForm({ name: '', birth_date: '', gender: 'M', belt: 'branca', weight: 0 });
      setShowNewAthleteModal(false);
    }
  };

  const handleToggleReview = (athleteId: string) => {
    setSelectedAthletes((prev) =>
      prev.map((s) =>
        s.athlete.id === athleteId ? { ...s, reviewed: !s.reviewed } : s,
      ),
    );
  };

  const handleSubmitRegistration = async () => {
    if (!coach) return;

    const athletes = selectedAthletes.map((s) => ({
      athlete_id: s.athlete.id,
      weight: s.weight,
      belt: s.belt,
      birth_date: s.athlete.birth_date,
      gender: s.athlete.gender,
    }));

    const regId = await submitRegistration(tournament.id, coach.id, athletes);
    if (regId) {
      setRegistrationId(regId);
      setStep('confirmation');
    }
  };

  const allReviewed = selectedAthletes.length > 0 && selectedAthletes.every((s) => s.reviewed);
  const reviewedCount = selectedAthletes.filter((s) => s.reviewed).length;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Header */}
      <header className="border-b border-[#1E1E2E] bg-[#141420]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <img src={logoSpe} alt="SPE" className="h-8" />
          <div className="text-right">
            <p className="text-sm text-gray-400">{tournament.name}</p>
            <p className="text-xs text-gray-500">{tournament.date} &middot; {tournament.location}</p>
          </div>
        </div>
      </header>

      {/* Step Indicator */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => {
            const isActive = i === stepIndex;
            const isDone = i < stepIndex;
            return (
              <div key={s.key} className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-colors ${
                    isActive
                      ? 'bg-gradient-to-r from-[#E11D48] to-[#9F1239] text-white'
                      : isDone
                        ? 'bg-green-600 text-white'
                        : 'bg-[#1E1E2E] text-gray-500'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-5 h-5" /> : s.icon}
                </div>
                <span
                  className={`text-xs ${
                    isActive ? 'text-white font-semibold' : isDone ? 'text-green-400' : 'text-gray-500'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ─── Step 1: Identification ─────────────────────────────────────────── */}
        {step === 'identification' && (
          <div className="bg-[#141420] border border-[#1E1E2E] rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-1">Identificação</h2>
            <p className="text-gray-400 text-sm mb-6">Informe os dados da academia e treinador.</p>

            <form onSubmit={handleIdentify} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Telefone (WhatsApp)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  required
                  maxLength={20}
                  className="w-full px-4 py-3 rounded-lg bg-[#0A0A0F] border border-[#1E1E2E] text-white placeholder-gray-500 focus:outline-none focus:border-[#E11D48] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Nome da Academia</label>
                <input
                  type="text"
                  value={academyName}
                  onChange={(e) => setAcademyName(e.target.value)}
                  placeholder="Ex: Academia Tiger TKD"
                  required
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-lg bg-[#0A0A0F] border border-[#1E1E2E] text-white placeholder-gray-500 focus:outline-none focus:border-[#E11D48] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Nome do Treinador</label>
                <input
                  type="text"
                  value={coachName}
                  onChange={(e) => setCoachName(e.target.value)}
                  placeholder="Ex: Mestre Silva"
                  required
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-lg bg-[#0A0A0F] border border-[#1E1E2E] text-white placeholder-gray-500 focus:outline-none focus:border-[#E11D48] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-[#E11D48] to-[#9F1239] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ─── Step 2: Athletes ───────────────────────────────────────────────── */}
        {step === 'athletes' && (
          <div className="space-y-4">
            <div className="bg-[#141420] border border-[#1E1E2E] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">Atletas</h2>
                  <p className="text-gray-400 text-sm">
                    Selecione os atletas e informe o peso de cada um.
                  </p>
                </div>
                <button
                  onClick={() => setShowNewAthleteModal(true)}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gradient-to-r from-[#E11D48] to-[#9F1239] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-4 h-4" />
                  Novo Atleta
                </button>
              </div>

              {/* Saved athletes list */}
              {savedAthletes.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-8">
                  Nenhum atleta cadastrado. Adicione um novo atleta.
                </p>
              )}

              <div className="space-y-2">
                {savedAthletes.map((athlete) => {
                  const isSelected = selectedAthletes.some((s) => s.athlete.id === athlete.id);
                  const sel = selectedAthletes.find((s) => s.athlete.id === athlete.id);
                  const isEnteringWeight = weightInput?.athleteId === athlete.id;
                  return (
                    <div key={athlete.id}>
                      <div
                        onClick={() => !isEnteringWeight && handleToggleAthlete(athlete)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${
                          isSelected
                            ? 'bg-[#E11D48]/10 border-[#E11D48]/40'
                            : isEnteringWeight
                              ? 'bg-[#0A0A0F] border-[#E11D48]/30'
                              : 'bg-[#0A0A0F] border-[#1E1E2E] hover:border-[#E11D48]/30'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'bg-[#E11D48] border-[#E11D48]' : 'border-gray-600'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{athlete.name}</p>
                          <p className="text-gray-400 text-xs">
                            {athlete.gender === 'M' ? 'Masculino' : 'Feminino'} &middot;{' '}
                            <span className="capitalize">{athlete.belt}</span>
                            {sel && <span className="text-[#E11D48]"> &middot; {sel.weight}kg</span>}
                          </p>
                        </div>
                      </div>

                      {/* Inline weight input */}
                      {isEnteringWeight && (
                        <div className="flex items-center gap-2 mt-1 ml-8">
                          <input
                            type="number"
                            autoFocus
                            placeholder="Peso (kg)"
                            min="1"
                            step="0.1"
                            value={weightInput.value}
                            onChange={(e) => setWeightInput({ athleteId: athlete.id, value: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleConfirmWeight(athlete);
                              if (e.key === 'Escape') setWeightInput(null);
                            }}
                            className="w-28 px-3 py-1.5 rounded-lg bg-[#0A0A0F] border border-[#E11D48]/40 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#E11D48] transition-colors"
                          />
                          <button
                            onClick={() => handleConfirmWeight(athlete)}
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#E11D48] to-[#9F1239] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                          >
                            OK
                          </button>
                          <button
                            onClick={() => setWeightInput(null)}
                            className="px-3 py-1.5 rounded-lg border border-[#1E1E2E] text-gray-400 text-sm hover:bg-[#141420] transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Selected count */}
              <div className="mt-4 pt-4 border-t border-[#1E1E2E] text-sm text-gray-400">
                {selectedAthletes.length} atleta(s) selecionado(s)
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep('identification')}
                className="flex-1 py-3 rounded-lg border border-[#1E1E2E] text-gray-300 font-semibold hover:bg-[#141420] transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
              <button
                onClick={() => setStep('review')}
                disabled={selectedAthletes.length === 0}
                className="flex-1 py-3 rounded-lg bg-gradient-to-r from-[#E11D48] to-[#9F1239] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Revisar
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* ─── New Athlete Modal ──────────────────────────────────────────── */}
            {showNewAthleteModal && (
              <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                <div className="bg-[#141420] border border-[#1E1E2E] rounded-2xl p-6 w-full max-w-md">
                  <h3 className="text-lg font-bold text-white mb-4">Novo Atleta</h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Nome</label>
                      <input
                        type="text"
                        value={newAthleteForm.name}
                        onChange={(e) =>
                          setNewAthleteForm((f) => ({ ...f, name: e.target.value }))
                        }
                        placeholder="Nome completo"
                        maxLength={100}
                        className="w-full px-4 py-2 rounded-lg bg-[#0A0A0F] border border-[#1E1E2E] text-white placeholder-gray-500 focus:outline-none focus:border-[#E11D48] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Data de Nascimento</label>
                      <input
                        type="date"
                        value={newAthleteForm.birth_date}
                        onChange={(e) =>
                          setNewAthleteForm((f) => ({ ...f, birth_date: e.target.value }))
                        }
                        className="w-full px-4 py-2 rounded-lg bg-[#0A0A0F] border border-[#1E1E2E] text-white focus:outline-none focus:border-[#E11D48] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Genero</label>
                      <select
                        value={newAthleteForm.gender}
                        onChange={(e) =>
                          setNewAthleteForm((f) => ({
                            ...f,
                            gender: e.target.value as 'M' | 'F',
                          }))
                        }
                        className="w-full px-4 py-2 rounded-lg bg-[#0A0A0F] border border-[#1E1E2E] text-white focus:outline-none focus:border-[#E11D48] transition-colors"
                      >
                        <option value="M">Masculino</option>
                        <option value="F">Feminino</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Faixa</label>
                      <select
                        value={newAthleteForm.belt}
                        onChange={(e) =>
                          setNewAthleteForm((f) => ({ ...f, belt: e.target.value }))
                        }
                        className="w-full px-4 py-2 rounded-lg bg-[#0A0A0F] border border-[#1E1E2E] text-white focus:outline-none focus:border-[#E11D48] transition-colors"
                      >
                        {BELT_OPTIONS.map((b) => (
                          <option key={b} value={b} className="capitalize">
                            {b.charAt(0).toUpperCase() + b.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Peso (kg)</label>
                      <input
                        type="number"
                        value={newAthleteForm.weight || ''}
                        onChange={(e) =>
                          setNewAthleteForm((f) => ({
                            ...f,
                            weight: parseFloat(e.target.value) || 0,
                          }))
                        }
                        placeholder="Ex: 65"
                        min="1"
                        step="0.1"
                        className="w-full px-4 py-2 rounded-lg bg-[#0A0A0F] border border-[#1E1E2E] text-white placeholder-gray-500 focus:outline-none focus:border-[#E11D48] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowNewAthleteModal(false)}
                      className="flex-1 py-2 rounded-lg border border-[#1E1E2E] text-gray-300 font-semibold hover:bg-[#0A0A0F] transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAddNewAthlete}
                      disabled={isLoading || !newAthleteForm.name || !newAthleteForm.birth_date || newAthleteForm.weight <= 0}
                      className="flex-1 py-2 rounded-lg bg-gradient-to-r from-[#E11D48] to-[#9F1239] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Adicionar'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Step 3: Review ─────────────────────────────────────────────────── */}
        {step === 'review' && (
          <div className="space-y-4">
            {/* Warning banner */}
            <div className="p-3 rounded-lg bg-yellow-900/30 border border-yellow-700 text-yellow-300 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              Confira todos os dados. Erros podem gerar lutas incorretas.
            </div>

            <div className="bg-[#141420] border border-[#1E1E2E] rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-1">Revisão</h2>
              <p className="text-gray-400 text-sm mb-4">
                Marque cada atleta como revisado para confirmar os dados.
              </p>

              <div className="space-y-2">
                {selectedAthletes.map((sel) => (
                  <div
                    key={sel.athlete.id}
                    onClick={() => handleToggleReview(sel.athlete.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${
                      sel.reviewed
                        ? 'bg-green-900/20 border-green-700/40'
                        : 'bg-[#0A0A0F] border-[#1E1E2E] hover:border-green-700/30'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        sel.reviewed ? 'bg-green-600 border-green-600' : 'border-gray-600'
                      }`}
                    >
                      {sel.reviewed && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{sel.athlete.name}</p>
                      <p className="text-gray-400 text-xs">
                        {sel.athlete.gender === 'M' ? 'Masculino' : 'Feminino'} &middot;{' '}
                        <span className="capitalize">{sel.belt}</span> &middot; {sel.weight}kg
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        Categoria: {sel.category}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reviewed counter */}
              <div className="mt-4 pt-4 border-t border-[#1E1E2E] text-sm text-gray-400">
                {reviewedCount} de {selectedAthletes.length} revisado(s)
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep('athletes')}
                className="flex-1 py-3 rounded-lg border border-[#1E1E2E] text-gray-300 font-semibold hover:bg-[#141420] transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
              <button
                onClick={handleSubmitRegistration}
                disabled={!allReviewed || isLoading}
                className="flex-1 py-3 rounded-lg bg-gradient-to-r from-[#E11D48] to-[#9F1239] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Enviar Inscrição'
                )}
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 4: Confirmation ───────────────────────────────────────────── */}
        {step === 'confirmation' && (
          <div className="bg-[#141420] border border-[#1E1E2E] rounded-2xl p-8 text-center">
            <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />

            <h2 className="text-2xl font-bold text-white mb-2">Inscrição Enviada!</h2>

            <p className="text-gray-400 mb-6">
              <span className="text-white font-semibold">{academyName}</span> &middot;{' '}
              {selectedAthletes.length} atleta(s)
            </p>

            {/* Protocol */}
            {registrationId && (
              <div className="mb-6 inline-block px-4 py-2 rounded-lg bg-[#0A0A0F] border border-[#1E1E2E]">
                <p className="text-xs text-gray-500 mb-1">Protocolo</p>
                <p className="text-lg font-mono font-bold text-white tracking-wider">
                  {registrationId.substring(0, 8).toUpperCase()}
                </p>
              </div>
            )}

            {/* Payment info */}
            {tournament.fee_amount > 0 && (
              <div className="mt-4 p-4 rounded-lg bg-yellow-900/20 border border-yellow-700/40 text-left">
                <p className="text-yellow-300 font-semibold text-sm mb-1">
                  Taxa de Inscrição: R$ {tournament.fee_amount.toFixed(2)}
                </p>
                {tournament.fee_instructions && (
                  <p className="text-yellow-200/70 text-sm whitespace-pre-wrap">
                    {tournament.fee_instructions}
                  </p>
                )}
              </div>
            )}

            <p className="text-gray-500 text-sm mt-6">
              Aguarde a aprovacao do organizador.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
