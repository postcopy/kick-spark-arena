// Professional Mode Selector — Choose role: Central, Mat, TV, Chamada
// Premium atmospheric design matching ModeSelectorPage

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import logoSpe from '@/assets/logo-spe-branca.png';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

const ROLES = [
  {
    id: 'central',
    title: 'CENTRAL',
    description: 'Organizar torneio e gerenciar quadras',
    route: '/central',
    needsMat: false,
    accentFrom: 'from-[hsl(var(--sulsport-yellow))]/60',
    accentVia: 'via-[hsl(var(--sulsport-yellow))]/80',
    accentTo: 'to-[hsl(var(--sulsport-yellow))]/60',
    separatorBg: 'bg-[hsl(var(--sulsport-yellow))]/30',
    separatorHover: 'group-hover:bg-[hsl(var(--sulsport-yellow))]/60',
    glowColor: 'rgba(180,140,40,0.06)',
    cornerBg: 'bg-[hsl(var(--sulsport-yellow))]/20',
    cornerHover: 'group-hover:bg-[hsl(var(--sulsport-yellow))]/50',
  },
  {
    id: 'mat',
    title: 'MAT',
    description: 'Operar lutas na quadra',
    route: '/championship/mat',
    needsMat: true,
    accentFrom: 'from-red-600/60',
    accentVia: 'via-red-500/80',
    accentTo: 'to-red-600/60',
    separatorBg: 'bg-red-500/30',
    separatorHover: 'group-hover:bg-red-500/60',
    glowColor: 'rgba(220,38,38,0.06)',
    cornerBg: 'bg-red-500/20',
    cornerHover: 'group-hover:bg-red-500/50',
  },
  {
    id: 'tv',
    title: 'TV',
    description: 'Placar e chaves no telão',
    route: '/championship/tv',
    needsMat: true,
    accentFrom: 'from-blue-600/60',
    accentVia: 'via-blue-500/80',
    accentTo: 'to-blue-600/60',
    separatorBg: 'bg-blue-500/30',
    separatorHover: 'group-hover:bg-blue-500/60',
    glowColor: 'rgba(59,130,246,0.06)',
    cornerBg: 'bg-blue-500/20',
    cornerHover: 'group-hover:bg-blue-500/50',
  },
  {
    id: 'chamada',
    title: 'CHAMADA',
    description: 'Próximas lutas no aquecimento',
    route: '/chamada',
    needsMat: false,
    accentFrom: 'from-emerald-600/60',
    accentVia: 'via-emerald-500/80',
    accentTo: 'to-emerald-600/60',
    separatorBg: 'bg-emerald-500/30',
    separatorHover: 'group-hover:bg-emerald-500/60',
    glowColor: 'rgba(16,185,129,0.06)',
    cornerBg: 'bg-emerald-500/20',
    cornerHover: 'group-hover:bg-emerald-500/50',
  },
] as const;

const MAT_NUMBERS = [1, 2, 3, 4, 5, 6, 7];

export default function ProfessionalSelectorPage() {
  const navigate = useNavigate();
  const [matDialogOpen, setMatDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<typeof ROLES[number] | null>(null);

  function handleRoleClick(role: typeof ROLES[number]) {
    if (role.needsMat) {
      setSelectedRole(role);
      setMatDialogOpen(true);
    } else {
      navigate(role.route);
    }
  }

  function handleMatSelect(matNumber: number) {
    if (!selectedRole) return;
    setMatDialogOpen(false);
    navigate(`${selectedRole.route}?mat=${matNumber}`);
  }

  return (
    <div className="min-h-screen bg-[#060609] flex flex-col relative overflow-hidden select-none">
      {/* Atmospheric background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,80,40,0.12),transparent)]" />

      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-6">
        {/* Header */}
        <div className="flex flex-col items-center mb-16">
          <div className="flex items-center gap-5 mb-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-lg text-zinc-700 hover:text-white hover:bg-white/5 transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <img
              src={logoSpe}
              alt="SPE Sulsport"
              className="h-14 object-contain opacity-90"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-px bg-gradient-to-r from-transparent to-zinc-700" />
            <span className="text-xs text-zinc-500 tracking-[0.4em] uppercase font-medium">
              Modo Profissional
            </span>
            <div className="w-8 h-px bg-gradient-to-l from-transparent to-zinc-700" />
          </div>
        </div>

        {/* Role Cards — 2x2 grid */}
        <div className="grid grid-cols-2 gap-5 max-w-[680px] w-full">
          {ROLES.map(role => (
            <button
              key={role.id}
              onClick={() => handleRoleClick(role)}
              className="group relative overflow-hidden transition-all duration-500 hover:scale-[1.015] active:scale-[0.99]"
            >
              <div
                className="relative bg-[#0c0c12] border border-white/[0.04] overflow-hidden"
                style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%)' }}
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{ background: `radial-gradient(ellipse at top, ${role.glowColor}, transparent 70%)` }}
                />

                {/* Top accent bar */}
                <div className={`h-[2px] bg-gradient-to-r ${role.accentFrom} ${role.accentVia} ${role.accentTo} opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="px-8 pt-10 pb-12 flex flex-col items-center">
                  <h2 className="text-2xl font-black text-white/90 tracking-[0.2em] mb-3 group-hover:text-white transition-colors duration-500">
                    {role.title}
                  </h2>
                  <div className={`w-8 h-[1px] ${role.separatorBg} group-hover:w-14 ${role.separatorHover} transition-all duration-500 mb-3`} />
                  <p className="text-zinc-500 text-sm tracking-wide group-hover:text-zinc-400 transition-colors duration-500">
                    {role.description}
                  </p>
                </div>

                {/* Bottom corner accent */}
                <div className={`absolute bottom-0 right-4 w-[1px] h-4 ${role.cornerBg} ${role.cornerHover} transition-colors duration-500`} />
              </div>
            </button>
          ))}
        </div>

        {/* Utility links */}
        <div className="flex gap-6 mt-12">
          <button
            onClick={() => navigate('/demo')}
            className="text-sm text-zinc-500 tracking-[0.2em] uppercase hover:text-[hsl(var(--sulsport-yellow))] transition-colors duration-300 font-medium"
          >
            Demo & Teste
          </button>
          <div className="w-px h-4 bg-zinc-700" />
          <button
            onClick={() => navigate('/help')}
            className="text-sm text-zinc-500 tracking-[0.2em] uppercase hover:text-white transition-colors duration-300 font-medium"
          >
            Manual
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 flex justify-center pb-6">
        <span className="text-zinc-600 text-xs tracking-[0.3em]">v1.0.0</span>
      </div>

      {/* Mat Number Dialog */}
      <AlertDialog open={matDialogOpen} onOpenChange={setMatDialogOpen}>
        <AlertDialogContent className="bg-[#0D0D14] border-zinc-800/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white font-black tracking-wider">
              SELECIONE A QUADRA
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-500">
              Escolha o número da quadra para {selectedRole?.title}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-4 gap-3 py-4">
            {MAT_NUMBERS.map(n => (
              <Button
                key={n}
                variant="outline"
                onClick={() => handleMatSelect(n)}
                className="h-16 text-2xl font-black border-zinc-800 hover:bg-[hsl(var(--sulsport-yellow))]/10 hover:border-[hsl(var(--sulsport-yellow))]/50 hover:text-[hsl(var(--sulsport-yellow))] transition-all"
              >
                {n}
              </Button>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-800 text-zinc-400 hover:text-white">
              Cancelar
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
