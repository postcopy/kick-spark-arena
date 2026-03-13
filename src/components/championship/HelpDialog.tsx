import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Usb, Activity, Target, Keyboard } from 'lucide-react';

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wider">
        <Icon className="h-5 w-5 text-zinc-400" />
        {title}
      </div>
      <div className="text-sm text-zinc-300 space-y-2 leading-relaxed">{children}</div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center px-2 py-0.5 rounded bg-zinc-700 border border-zinc-600 text-xs font-mono text-zinc-200">
      {children}
    </kbd>
  );
}

function ColorDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-3 w-3 rounded-full ${color}`} />
      <span>{label}</span>
    </span>
  );
}

export function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[hsl(var(--sulsport-dark))] border-[hsl(var(--sulsport-gray))] text-white">
        <DialogHeader>
          <DialogTitle className="text-white text-lg font-bold uppercase tracking-wider">
            Guia de Ajuda
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="hardware" className="mt-2">
          <TabsList className="w-full bg-zinc-800/80 border border-zinc-700">
            <TabsTrigger value="hardware" className="flex-1 data-[state=active]:bg-zinc-600 data-[state=active]:text-white text-zinc-400 text-xs">
              <Usb className="h-3.5 w-3.5 mr-1.5" /> Hardware
            </TabsTrigger>
            <TabsTrigger value="calibragem" className="flex-1 data-[state=active]:bg-zinc-600 data-[state=active]:text-white text-zinc-400 text-xs">
              <Activity className="h-3.5 w-3.5 mr-1.5" /> Calibragem
            </TabsTrigger>
            <TabsTrigger value="pontuacao" className="flex-1 data-[state=active]:bg-zinc-600 data-[state=active]:text-white text-zinc-400 text-xs">
              <Target className="h-3.5 w-3.5 mr-1.5" /> Pontuação
            </TabsTrigger>
            <TabsTrigger value="atalhos" className="flex-1 data-[state=active]:bg-zinc-600 data-[state=active]:text-white text-zinc-400 text-xs">
              <Keyboard className="h-3.5 w-3.5 mr-1.5" /> Atalhos
            </TabsTrigger>
          </TabsList>

          {/* Hardware */}
          <TabsContent value="hardware" className="mt-4 space-y-4">
            <Section icon={Usb} title="Conexão USB">
              <p>Conecte a placa de sensores via cabo USB <strong>antes de iniciar a luta</strong>.</p>
              <p>Clique no botão <strong>"CONECTAR USB"</strong> no painel lateral direito para parear a porta serial.</p>
              <div className="bg-zinc-800/60 rounded-md p-3 space-y-1.5 border border-zinc-700">
                <p className="font-semibold text-white text-xs uppercase">Indicadores de Status</p>
                <div className="flex flex-col gap-1">
                  <ColorDot color="bg-green-500" label="USB conectado e recebendo dados" />
                  <ColorDot color="bg-zinc-500" label="USB desconectado ou sem resposta" />
                </div>
              </div>
              <p className="text-zinc-500 text-xs">💡 Dica: conecte o USB e verifique o status verde antes de iniciar o round.</p>
            </Section>
          </TabsContent>

          {/* Calibragem */}
          <TabsContent value="calibragem" className="mt-4 space-y-4">
            <Section icon={Activity} title="Lógica das Cores">
              <p>Cada impacto detectado pelos sensores é classificado em 3 faixas de intensidade:</p>
              <div className="bg-zinc-800/60 rounded-md p-3 space-y-1.5 border border-zinc-700">
                <div className="flex flex-col gap-1.5">
                  <ColorDot color="bg-zinc-500" label="Ruído — intensidade abaixo do limiar. Ignorado pelo sistema." />
                  <ColorDot color="bg-yellow-500" label="HIT — registrado para desempate, mas NÃO soma ponto." />
                  <ColorDot color="bg-green-500" label="PONTO — impacto acima do limiar. Soma no placar." />
                </div>
              </div>
            </Section>
            <Section icon={Activity} title="Presets de Calibragem">
              <p>Use o <strong>Assistente de Calibragem</strong> no painel lateral para ajustar os limiares:</p>
              <ul className="list-disc list-inside space-y-1 text-zinc-400">
                <li><strong>Infantil</strong> — limiares mais baixos, mais sensível a impactos leves.</li>
                <li><strong>Adulto</strong> — limiares padrão, exige impactos mais fortes para pontuar.</li>
              </ul>
              <p className="text-zinc-500 text-xs">Os valores de limiar definem a fronteira entre HIT e PONTO. Quanto maior o limiar, mais forte precisa ser o impacto para pontuar.</p>
            </Section>
          </TabsContent>

          {/* Pontuação */}
          <TabsContent value="pontuacao" className="mt-4 space-y-4">
            <Section icon={Target} title="Sistema de 3 Faixas">
              <p>O sistema classifica cada impacto em Ruído, HIT ou PONTO com base nos limiares configurados na calibragem.</p>
              <p><strong>Desempate automático:</strong> em caso de empate no placar, o atleta com mais HITs (impactos registrados que não viraram ponto) vence o round.</p>
            </Section>
            <Section icon={Target} title="Pontuação Manual">
              <p>Use os botões na parte inferior da tela para adicionar pontos manualmente:</p>
              <div className="bg-zinc-800/60 rounded-md p-3 border border-zinc-700">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between"><span>Soco</span><span className="font-bold text-white">1 pt</span></div>
                  <div className="flex justify-between"><span>Corpo</span><span className="font-bold text-white">2 pts</span></div>
                  <div className="flex justify-between"><span>Cabeça</span><span className="font-bold text-white">3 pts</span></div>
                  <div className="flex justify-between"><span>Giro Corpo</span><span className="font-bold text-white">4 pts</span></div>
                  <div className="flex justify-between"><span>Giro Cabeça</span><span className="font-bold text-white">6 pts</span></div>
                </div>
              </div>
            </Section>
          </TabsContent>

          {/* Atalhos */}
          <TabsContent value="atalhos" className="mt-4 space-y-4">
            <Section icon={Keyboard} title="Atalhos de Teclado">
              <div className="bg-zinc-800/60 rounded-md p-3 border border-zinc-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span>Iniciar / Pausar round</span>
                  <Kbd>Espaço</Kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span>Pausar imediatamente (emergência)</span>
                  <Kbd>ESC</Kbd>
                </div>
              </div>
              <p className="text-zinc-500 text-xs">Os atalhos são desativados quando o foco está em campos de texto.</p>
            </Section>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
