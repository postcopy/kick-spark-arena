import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface SetupTutorialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accentColor?: string; // tailwind color class e.g. 'bg-[#FFD700]' or 'bg-green-500'
}

const STEPS = [
  { num: '01', title: 'SELECIONE O PROTOCOLO', desc: 'Escolha o tipo de treino que deseja executar.' },
  { num: '02', title: 'AJUSTE A CARGA', desc: 'Configure tempo, dificuldade e parâmetros avançados.' },
  { num: '03', title: 'INICIAR COMBATE', desc: 'Dê o play e acerte os alvos. Boa luta!' },
];

export function SetupTutorialDialog({ open, onOpenChange, accentColor = 'bg-[#FFD700]' }: SetupTutorialDialogProps) {
  const textColor = accentColor === 'bg-green-500' ? 'text-green-500' : 'text-[#FFD700]';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0b1120] border border-white/10 max-w-md p-0 gap-0 [&>button]:text-white/40">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="font-mono font-black text-white uppercase tracking-tighter text-xl">
            MANUAL DO <span className={textColor}>OPERADOR</span>
          </DialogTitle>
          <p className="font-mono text-[0.65rem] text-white/30 uppercase tracking-widest mt-1">
            ARQUIVO CONFIDENCIAL — NÍVEL DE ACESSO: OPERADOR
          </p>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {STEPS.map((step) => (
            <div key={step.num} className="flex gap-4 items-start">
              <span className={cn("font-mono font-black text-2xl", textColor)}>
                {step.num}
              </span>
              <div>
                <h4 className="font-mono font-bold text-white text-sm uppercase tracking-wider">
                  {step.title}
                </h4>
                <p className="font-mono text-xs text-white/50 mt-0.5">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 pt-0">
          <button
            onClick={() => onOpenChange(false)}
            className={cn(
              "w-full h-12 font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center",
              accentColor,
              accentColor === 'bg-green-500' ? 'text-black' : 'text-black'
            )}
          >
            ENTENDIDO
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
