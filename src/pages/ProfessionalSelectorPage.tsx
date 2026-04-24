// Professional Mode Selector — escolha de papel (Central, Mat, TV, Chamada).
//
// spe-ui-design §P3/§3: retangular, sem gradientes decorativos, sem clip-path
// ornamental. Cor com função: cada papel ancorado em token WT coerente.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Command,
  Gamepad2,
  Monitor,
  Megaphone,
  FlaskConical,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
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
import { cn } from '@/lib/utils';

type RoleIconName = 'command' | 'gamepad' | 'monitor' | 'megaphone';
type RoleTone = 'gold' | 'hong' | 'chung' | 'success';

interface Role {
  id: string;
  title: string;
  tagline: string;
  description: string;
  iconName: RoleIconName;
  route: string;
  needsMat: boolean;
  tone: RoleTone;
}

const ROLES: Role[] = [
  {
    id: 'central',
    title: 'CENTRAL',
    tagline: 'Comando do evento',
    description: 'Organizar torneio, criar chaves, gerenciar quadras e fila de lutas.',
    iconName: 'command',
    route: '/central',
    needsMat: false,
    tone: 'gold',
  },
  {
    id: 'mat',
    title: 'MAT',
    tagline: 'Mesa de luta',
    description: 'Operar lutas na quadra — placar, gam-jeom, pausa, round, decisões.',
    iconName: 'gamepad',
    route: '/championship/mat',
    needsMat: true,
    tone: 'hong',
  },
  {
    id: 'tv',
    title: 'TV',
    tagline: 'Telão público',
    description: 'Placar e chaveamento no telão da arena. Modo somente leitura.',
    iconName: 'monitor',
    route: '/championship/tv',
    needsMat: true,
    tone: 'chung',
  },
  {
    id: 'chamada',
    title: 'CHAMADA',
    tagline: 'Aquecimento',
    description: 'Próximas lutas na fila. Chamar atletas e anunciar entrada no tatame.',
    iconName: 'megaphone',
    route: '/chamada',
    needsMat: false,
    tone: 'success',
  },
];

const MAT_NUMBERS = [1, 2, 3, 4, 5, 6, 7];

const TONE_CLASSES: Record<RoleTone, { stripe: string; text: string; iconBg: string; iconBorder: string }> = {
  gold: {
    stripe: 'bg-wt-manual',
    text: 'text-wt-manual',
    iconBg: 'bg-wt-manual/10',
    iconBorder: 'border-wt-manual/40',
  },
  hong: {
    stripe: 'bg-hong',
    text: 'text-hong-accent',
    iconBg: 'bg-hong/10',
    iconBorder: 'border-hong/40',
  },
  chung: {
    stripe: 'bg-chung',
    text: 'text-chung-accent',
    iconBg: 'bg-chung/10',
    iconBorder: 'border-chung/40',
  },
  success: {
    stripe: 'bg-wt-success',
    text: 'text-wt-success',
    iconBg: 'bg-wt-success/10',
    iconBorder: 'border-wt-success/40',
  },
};

function RoleIcon({ name, size = 22 }: { name: RoleIconName; size?: number }) {
  const props = { size, strokeWidth: 2 };
  switch (name) {
    case 'command':
      return <Command {...props} />;
    case 'gamepad':
      return <Gamepad2 {...props} />;
    case 'monitor':
      return <Monitor {...props} />;
    case 'megaphone':
      return <Megaphone {...props} />;
  }
}

export default function ProfessionalSelectorPage() {
  const navigate = useNavigate();
  const [matDialogOpen, setMatDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  function handleRoleClick(role: Role) {
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
    <div className="min-h-screen bg-wt-bg flex flex-col font-display select-none">
      {/* Top bar */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-wt-divider">
        <button
          onClick={() => navigate('/')}
          className="group flex items-center gap-2 text-wt-fg-muted hover:text-wt-fg-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
          <span className="text-[10px] tracking-[0.35em] font-bold uppercase">Voltar</span>
        </button>

        <div className="flex items-center gap-2 text-[10px] tracking-[0.3em] font-bold uppercase">
          <span className="text-wt-fg-muted">SPE</span>
          <ChevronRight className="w-3 h-3 text-wt-divider" />
          <span className="text-wt-fg-primary">Competição</span>
          <ChevronRight className="w-3 h-3 text-wt-divider" />
          <span className="text-wt-fg-muted">Papel</span>
        </div>

        <img src={logoSpe} alt="SPE" className="h-6 object-contain opacity-80" />
      </header>

      {/* Heading */}
      <div className="flex flex-col items-center mt-12 mb-10">
        <span className="text-[11px] tracking-[0.45em] uppercase font-bold text-wt-fg-muted mb-4">
          Centro de comando
        </span>
        <h1 className="text-wt-fg-primary font-black leading-none tracking-tight text-4xl md:text-5xl">
          ESCOLHA SEU PAPEL
        </h1>
        <p className="text-wt-fg-muted text-sm mt-3 tracking-wide">
          Cada papel tem uma tela otimizada pra função.
        </p>
      </div>

      {/* Roles grid */}
      <main className="flex-1 flex items-center justify-center px-8 pb-6 min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[2px] max-w-[960px] w-full">
          {ROLES.map((role) => {
            const tone = TONE_CLASSES[role.tone];
            return (
              <button
                key={role.id}
                onClick={() => handleRoleClick(role)}
                className="group relative text-left bg-wt-bg-secondary border border-wt-divider hover:border-wt-fg-muted transition-colors focus:outline-none focus:border-wt-fg-primary"
              >
                {/* Top stripe — única ornamentação, identifica papel */}
                <div className={cn('h-1', tone.stripe)} />

                <div className="px-7 pt-6 pb-7">
                  <div className="flex items-start justify-between mb-5">
                    <div
                      className={cn(
                        'w-12 h-12 flex items-center justify-center border',
                        tone.iconBg,
                        tone.iconBorder,
                        tone.text,
                      )}
                    >
                      <RoleIcon name={role.iconName} />
                    </div>
                    <span
                      className={cn(
                        'text-[9px] font-bold tracking-[0.3em] uppercase',
                        tone.text,
                      )}
                    >
                      {role.tagline}
                    </span>
                  </div>

                  <h2 className="text-wt-fg-primary font-black leading-none tracking-tight text-4xl md:text-[44px] mb-3">
                    {role.title}
                  </h2>

                  <p className="text-wt-fg-muted text-[13px] leading-snug group-hover:text-wt-fg-secondary transition-colors max-w-[38ch]">
                    {role.description}
                  </p>

                  <div
                    className={cn(
                      'mt-5 flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity',
                      tone.text,
                    )}
                  >
                    <span className="text-[10px] font-bold tracking-[0.35em] uppercase">
                      {role.needsMat ? 'Selecionar quadra' : 'Entrar'}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {/* Utility links */}
      <footer className="flex flex-col items-center gap-3 pb-5 pt-3 border-t border-wt-divider">
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => navigate('/demo')}
            className="flex items-center gap-2 text-wt-fg-muted hover:text-wt-fg-primary transition-colors"
          >
            <FlaskConical className="w-3.5 h-3.5" strokeWidth={2} />
            <span className="text-[10px] tracking-[0.3em] uppercase font-bold">Demo & Teste</span>
          </button>

          <div className="w-px h-3 bg-wt-divider" />

          <button
            onClick={() => navigate('/help')}
            className="flex items-center gap-2 text-wt-fg-muted hover:text-wt-fg-primary transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" strokeWidth={2} />
            <span className="text-[10px] tracking-[0.3em] uppercase font-bold">Manual</span>
          </button>
        </div>

        <span className="text-[9px] text-wt-fg-muted tracking-[0.4em] font-mono uppercase">
          SPE · Sulsport
        </span>
      </footer>

      {/* Mat selection dialog */}
      <AlertDialog open={matDialogOpen} onOpenChange={setMatDialogOpen}>
        <AlertDialogContent className="bg-wt-bg-secondary border-wt-divider max-w-md rounded-none">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              {selectedRole && (() => {
                const tone = TONE_CLASSES[selectedRole.tone];
                return (
                  <div
                    className={cn(
                      'w-10 h-10 flex items-center justify-center border',
                      tone.iconBg,
                      tone.iconBorder,
                      tone.text,
                    )}
                  >
                    <RoleIcon name={selectedRole.iconName} size={18} />
                  </div>
                );
              })()}
              <div>
                <div className="text-[9px] tracking-[0.35em] font-bold text-wt-fg-muted uppercase">
                  {selectedRole?.tagline}
                </div>
                <AlertDialogTitle className="text-wt-fg-primary font-black tracking-wider text-xl leading-none mt-1 uppercase">
                  Selecione a quadra
                </AlertDialogTitle>
              </div>
            </div>
            <AlertDialogDescription className="text-wt-fg-secondary text-sm">
              Escolha o número de quadra onde você vai operar como{' '}
              <span className="font-bold text-wt-fg-primary">{selectedRole?.title}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid grid-cols-4 gap-[2px] py-5">
            {MAT_NUMBERS.map((n) => (
              <Button
                key={n}
                variant="outline"
                onClick={() => handleMatSelect(n)}
                className="h-16 text-2xl font-black rounded-none border border-wt-divider bg-wt-bg hover:bg-wt-bg-tertiary hover:border-wt-fg-muted text-wt-fg-primary tabular-nums transition-colors"
              >
                {n}
              </Button>
            ))}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="border-wt-divider bg-wt-bg-tertiary text-wt-fg-primary hover:bg-wt-bg-tertiary/70 rounded-none uppercase tracking-wider text-xs font-bold">
              Cancelar
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
