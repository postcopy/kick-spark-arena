import { useState, useEffect } from 'react';
import { useOpenTournaments } from '@/hooks/useOpenTournaments';
import type { OpenTournament } from '@/types/registration';
import {
  Plus,
  Copy,
  Check,
  X,
  Clock,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Users,
  Loader2,
  CheckCircle2,
  XCircle,
  Link2,
} from 'lucide-react';

interface RegistrationsPanelProps {
  userId: string;
}

export default function RegistrationsPanel({ userId }: RegistrationsPanelProps) {
  const {
    tournaments,
    registrations,
    isLoading,
    loadTournaments,
    createTournament,
    closeTournament,
    loadRegistrations,
    updateRegistrationStatus,
    updatePaymentStatus,
    getRegistrationLink,
  } = useOpenTournaments(userId);

  // --- State ---
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [expandedReg, setExpandedReg] = useState<string | null>(null);

  // Create form fields
  const [formName, setFormName] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formFee, setFormFee] = useState('');
  const [formFeeInstructions, setFormFeeInstructions] = useState('');

  // --- Effects ---
  useEffect(() => {
    loadTournaments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      loadRegistrations(selectedTournament);
      setExpandedReg(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTournament]);

  // --- Handlers ---
  async function handleCreate() {
    if (!formName || !formDate) return;
    const created = await createTournament({
      name: formName,
      date: formDate,
      location: formLocation,
      registration_deadline: formDeadline,
      fee_amount: formFee ? parseFloat(formFee) : 0,
      fee_instructions: formFeeInstructions,
      status: 'open',
    });
    if (created) {
      setSelectedTournament(created.id);
      setShowCreateForm(false);
      setFormName('');
      setFormDate('');
      setFormLocation('');
      setFormDeadline('');
      setFormFee('');
      setFormFeeInstructions('');
    }
  }

  function handleCopyLink() {
    if (!selectedTournament) return;
    const link = getRegistrationLink(selectedTournament);
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  }

  // --- Derived data ---
  const currentTournament = tournaments.find((t) => t.id === selectedTournament);
  const pendingCount = registrations.filter((r) => r.status === 'pending').length;
  const approvedCount = registrations.filter((r) => r.status === 'approved').length;
  const totalAthletes = registrations.reduce((sum, r) => sum + r.athletes.length, 0);

  // --- Render ---
  return (
    <div className="space-y-6">
      {/* ── Tournament Selector ── */}
      <div className="flex items-center gap-3">
        <select
          value={selectedTournament ?? ''}
          onChange={(e) => setSelectedTournament(e.target.value || null)}
          className="flex-1 bg-[#141420] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
        >
          <option value="">Selecione um torneio...</option>
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} — {t.date} {t.status === 'closed' ? '(Encerrado)' : ''}
            </option>
          ))}
        </select>

        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-sm font-bold px-4 py-2.5 rounded-lg transition-all whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          Novo Torneio
        </button>
      </div>

      {/* ── Create Tournament Modal ── */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#141420] border border-[#1E1E2E] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl mx-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">Novo Torneio</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-zinc-400 text-xs font-bold mb-1">Nome *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Copa Regional 2026"
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 text-xs font-bold mb-1">Data *</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-bold mb-1">Local</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="Cidade / Ginasio"
                    className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-bold mb-1">Prazo de Inscricao</label>
                <input
                  type="datetime-local"
                  value={formDeadline}
                  onChange={(e) => setFormDeadline(e.target.value)}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 text-xs font-bold mb-1">Valor da Taxa (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formFee}
                    onChange={(e) => setFormFee(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-bold mb-1">Instrucoes de Pagamento</label>
                <textarea
                  rows={3}
                  value={formFeeInstructions}
                  onChange={(e) => setFormFeeInstructions(e.target.value)}
                  placeholder="PIX, dados bancarios, etc."
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={!formName || !formDate || isLoading}
                className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold px-5 py-2 rounded-lg transition-all"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Criar Torneio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Actions Bar (only when tournament selected) ── */}
      {selectedTournament && currentTournament && (
        <div className="flex flex-wrap items-center gap-3 bg-[#141420] border border-[#1E1E2E] rounded-xl px-5 py-3">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-[#1E1E2E] text-white text-sm font-bold px-4 py-2 rounded-lg transition-all"
          >
            {copiedLink ? (
              <>
                <Check className="h-4 w-4 text-green-400" />
                <span className="text-green-400">Link Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar Link de Inscricao
              </>
            )}
          </button>

          {currentTournament.status === 'open' && (
            <button
              onClick={() => closeTournament(selectedTournament)}
              disabled={isLoading}
              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-bold px-4 py-2 rounded-lg transition-all"
            >
              <X className="h-4 w-4" />
              Encerrar Inscricoes
            </button>
          )}

          <div className="flex-1" />

          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-yellow-400">
              <Clock className="h-4 w-4" />
              {pendingCount} pendentes
            </span>
            <span className="flex items-center gap-1.5 text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              {approvedCount} aprovadas
            </span>
            <span className="flex items-center gap-1.5 text-zinc-400">
              <Users className="h-4 w-4" />
              {totalAthletes} atletas
            </span>
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-red-500" />
        </div>
      )}

      {/* ── Registrations List ── */}
      {selectedTournament && !isLoading && registrations.length > 0 && (
        <div className="space-y-3">
          {registrations.map((reg) => {
            const isExpanded = expandedReg === reg.id;

            const StatusIcon =
              reg.status === 'approved'
                ? CheckCircle2
                : reg.status === 'rejected'
                  ? XCircle
                  : Clock;

            const statusColor =
              reg.status === 'approved'
                ? 'text-green-400'
                : reg.status === 'rejected'
                  ? 'text-red-400'
                  : 'text-yellow-400';

            return (
              <div
                key={reg.id}
                className="bg-[#141420] border border-[#1E1E2E] rounded-xl overflow-hidden"
              >
                {/* Card Header */}
                <button
                  onClick={() => setExpandedReg(isExpanded ? null : reg.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left"
                >
                  <StatusIcon className={`h-5 w-5 flex-shrink-0 ${statusColor}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold truncate">
                        {reg.coach.academy_name}
                      </span>
                    </div>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      {reg.coach.coach_name} &middot; {reg.coach.phone}
                    </p>
                  </div>

                  <span className="text-zinc-400 text-sm whitespace-nowrap">
                    {reg.athletes.length} atleta{reg.athletes.length !== 1 ? 's' : ''}
                  </span>

                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                      reg.payment_status === 'paid'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    <DollarSign className="h-3 w-3 inline -mt-0.5 mr-0.5" />
                    {reg.payment_status === 'paid' ? 'Pago' : 'Pendente'}
                  </span>

                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-zinc-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-zinc-500 flex-shrink-0" />
                  )}
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-[#1E1E2E] p-5 space-y-4">
                    {/* Athletes Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-zinc-500 text-xs uppercase">
                            <th className="text-left pb-2 font-bold">Nome</th>
                            <th className="text-left pb-2 font-bold">Faixa</th>
                            <th className="text-left pb-2 font-bold">Peso</th>
                            <th className="text-left pb-2 font-bold">Categoria</th>
                          </tr>
                        </thead>
                        <tbody className="text-zinc-300">
                          {reg.athletes.map((ra) => (
                            <tr key={ra.id} className="border-t border-[#1E1E2E]">
                              <td className="py-2 text-white font-medium">{ra.athlete.name}</td>
                              <td className="py-2 capitalize">{ra.belt}</td>
                              <td className="py-2">{ra.weight}kg</td>
                              <td className="py-2 text-zinc-400">{ra.category ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {reg.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateRegistrationStatus(reg.id, 'approved')}
                            disabled={isLoading}
                            className="flex items-center gap-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-bold px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Aprovar
                          </button>
                          <button
                            onClick={() => updateRegistrationStatus(reg.id, 'rejected')}
                            disabled={isLoading}
                            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-bold px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                          >
                            <XCircle className="h-4 w-4" />
                            Rejeitar
                          </button>
                        </>
                      )}

                      <button
                        onClick={() =>
                          updatePaymentStatus(
                            reg.id,
                            reg.payment_status === 'paid' ? 'pending' : 'paid',
                          )
                        }
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-[#1E1E2E] text-zinc-300 text-sm font-bold px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                      >
                        <DollarSign className="h-4 w-4" />
                        {reg.payment_status === 'paid'
                          ? 'Marcar como Nao Pago'
                          : 'Marcar como Pago'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Empty State ── */}
      {selectedTournament && !isLoading && registrations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
          <Link2 className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-bold">Nenhuma inscricao ainda.</p>
          <p className="text-sm">Compartilhe o link.</p>
        </div>
      )}
    </div>
  );
}
