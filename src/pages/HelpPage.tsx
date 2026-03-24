// Help & Manual — SPE Sulsport Professional Mode Guide
// In-app documentation for presentation and training

import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Monitor, Swords, Tv, Megaphone, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import logoSpe from '@/assets/logo-spe-branca.png';

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, icon, color, children, defaultOpen = false }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-white/[0.04] rounded-xl overflow-hidden bg-[#0c0c12]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className={`flex-shrink-0 ${color}`}>{icon}</div>
        <h3 className="flex-1 font-black text-white/90 tracking-wide text-lg">{title}</h3>
        <ChevronDown
          className={`h-5 w-5 text-zinc-600 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-0 border-t border-white/[0.03]">
          <div className="pt-4 text-zinc-400 text-base leading-relaxed space-y-3">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white/60">
        {n}
      </span>
      <p className="pt-0.5">{children}</p>
    </div>
  );
}

function KeyBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block px-2 py-0.5 bg-white/5 border border-white/10 rounded text-xs font-mono text-white/70">
      {children}
    </span>
  );
}

export default function HelpPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#07070C] text-white relative overflow-y-auto">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,80,40,0.08),transparent)]" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate('/professional')}
            className="p-2 rounded-lg text-zinc-600 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <img src={logoSpe} alt="SPE" className="h-8 object-contain" />
          <div className="w-px h-6 bg-zinc-800" />
          <h1 className="font-black text-2xl tracking-[0.15em]">MANUAL</h1>
        </div>

        {/* Intro */}
        <div className="mb-8 p-6 border border-white/[0.04] rounded-xl bg-[#0c0c12]">
          <h2 className="text-2xl font-black tracking-wide mb-3 text-white/90">
            SPE Sulsport — Sistema Profissional de Eventos
          </h2>
          <p className="text-zinc-400 text-base leading-relaxed mb-4">
            O sistema opera torneios de Taekwondo em tempo real com sincronização entre
            múltiplas estações. Dois modos disponíveis:
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
              <h4 className="font-bold text-red-400 text-base mb-1">BÁSICO</h4>
              <p className="text-zinc-400 text-sm">Luta a luta, sem chaves. Ideal para treinos e eventos simples.</p>
            </div>
            <div className="p-3 rounded-lg bg-[hsl(45,93%,47%)]/5 border border-[hsl(45,93%,47%)]/10">
              <h4 className="font-bold text-[hsl(45,93%,60%)] text-base mb-1">PROFISSIONAL</h4>
              <p className="text-zinc-400 text-sm">Torneio completo com categorias, chaves, múltiplas quadras.</p>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-3">

          {/* Overview */}
          <Section
            title="VISÃO GERAL — MODO PROFISSIONAL"
            icon={<Monitor className="h-5 w-5" />}
            color="text-[hsl(45,93%,60%)]"
            defaultOpen
          >
            <p>
              O Modo Profissional é composto por <strong className="text-white/70">4 estações</strong> que
              trabalham sincronizadas no mesmo computador ou em rede:
            </p>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="p-3 rounded-lg bg-[hsl(45,93%,47%)]/5 border border-[hsl(45,93%,47%)]/10">
                <h4 className="font-bold text-[hsl(45,93%,60%)] text-sm tracking-wide mb-1">CENTRAL</h4>
                <p className="text-zinc-400 text-sm">Cria o torneio, gerencia categorias, gera chaves, atribui quadras.</p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                <h4 className="font-bold text-red-400 text-sm tracking-wide mb-1">MAT (QUADRA)</h4>
                <p className="text-zinc-400 text-sm">Opera as lutas na quadra — placar, pontuação, cronômetro.</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                <h4 className="font-bold text-blue-400 text-sm tracking-wide mb-1">TV (TELÃO)</h4>
                <p className="text-zinc-400 text-sm">Exibe o placar e as chaves no telão para o público.</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <h4 className="font-bold text-emerald-400 text-sm tracking-wide mb-1">CHAMADA</h4>
                <p className="text-zinc-400 text-sm">Mostra as próximas lutas na área de aquecimento.</p>
              </div>
            </div>
          </Section>

          {/* Central */}
          <Section
            title="CENTRAL — Organizando o Torneio"
            icon={<Monitor className="h-5 w-5" />}
            color="text-[hsl(45,93%,60%)]"
          >
            <p className="font-bold text-white/60 mb-2">Como criar um torneio:</p>
            <Step n={1}>Na tela inicial, selecione <strong className="text-white/60">PROFISSIONAL</strong> → <strong className="text-white/60">CENTRAL</strong></Step>
            <Step n={2}>Clique em <strong className="text-white/60">Criar Torneio</strong> — defina nome, data e local</Step>
            <Step n={3}>Adicione <strong className="text-white/60">Categorias</strong> (faixa etária, graduação, peso, sexo)</Step>
            <Step n={4}>Cadastre os <strong className="text-white/60">Atletas</strong> em cada categoria (manual ou importar CSV)</Step>
            <Step n={5}>Clique em <strong className="text-white/60">Gerar Chaves</strong> — o sistema cria automaticamente as chaves eliminatórias</Step>
            <Step n={6}>Atribua categorias às <strong className="text-white/60">Quadras</strong> (Mat 1, Mat 2, etc.)</Step>
            <Step n={7}>Clique em <strong className="text-white/60">Iniciar Torneio</strong></Step>

            <div className="mt-3 p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-lg">
              <p className="text-yellow-400/80 text-sm">
                <strong>Dica:</strong> Use o botão "Importar CSV" para cadastrar atletas em massa.
                Formato: nome, academia (um por linha).
              </p>
            </div>
          </Section>

          {/* Mat */}
          <Section
            title="MAT — Operando as Lutas"
            icon={<Swords className="h-5 w-5" />}
            color="text-red-400"
          >
            <p className="font-bold text-white/60 mb-2">Como operar uma luta:</p>
            <Step n={1}>Selecione <strong className="text-white/60">MAT</strong> e escolha o número da quadra</Step>
            <Step n={2}>A próxima luta da quadra é carregada automaticamente</Step>
            <Step n={3}>Use os botões de <strong className="text-white/60">pontuação</strong> para marcar pontos (1, 2, 3, 4 pts)</Step>
            <Step n={4}>Controle o <strong className="text-white/60">cronômetro</strong> — iniciar, pausar, resetar</Step>
            <Step n={5}>Registre <strong className="text-white/60">penalidades</strong> (Gam-jeom) quando necessário</Step>
            <Step n={6}>Ao final, marque o <strong className="text-white/60">vencedor</strong> e confirme o resultado</Step>

            <p className="font-bold text-white/60 mt-4 mb-2">Controles do teclado:</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <KeyBadge>Espaço</KeyBadge> <span className="text-sm">Iniciar/Pausar timer</span>
              </div>
              <div className="flex items-center gap-2">
                <KeyBadge>Q / P</KeyBadge> <span className="text-sm">+1 pt Vermelho / Azul</span>
              </div>
              <div className="flex items-center gap-2">
                <KeyBadge>W / O</KeyBadge> <span className="text-sm">+2 pts Vermelho / Azul</span>
              </div>
              <div className="flex items-center gap-2">
                <KeyBadge>E / I</KeyBadge> <span className="text-sm">+3 pts Vermelho / Azul</span>
              </div>
              <div className="flex items-center gap-2">
                <KeyBadge>A / L</KeyBadge> <span className="text-sm">Gam-jeom Verm. / Azul</span>
              </div>
              <div className="flex items-center gap-2">
                <KeyBadge>R</KeyBadge> <span className="text-sm">Resetar round</span>
              </div>
            </div>

            <div className="mt-3 p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
              <p className="text-blue-400/80 text-sm">
                <strong>Placar TV:</strong> Use o botão "ABRIR PLACAR TV" para projetar o
                placar em tempo real no telão. A TV sincroniza automaticamente.
              </p>
            </div>
          </Section>

          {/* TV */}
          <Section
            title="TV — Telão e Público"
            icon={<Tv className="h-5 w-5" />}
            color="text-blue-400"
          >
            <Step n={1}>Selecione <strong className="text-white/60">TV</strong> e escolha a quadra</Step>
            <Step n={2}>Arraste a janela para o monitor/projetor secundário</Step>
            <Step n={3}>Pressione <KeyBadge>F11</KeyBadge> para tela cheia</Step>

            <p className="mt-3">
              A TV exibe automaticamente o placar da luta em andamento e as chaves da
              categoria atual. Não necessita interação — tudo é sincronizado pela estação Mat.
            </p>

            <div className="mt-3 p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
              <p className="text-blue-400/80 text-sm">
                <strong>Múltiplos telões:</strong> Abra várias janelas de TV, cada uma em
                uma quadra diferente, para monitorar todas as áreas simultaneamente.
              </p>
            </div>
          </Section>

          {/* Chamada */}
          <Section
            title="CHAMADA — Área de Aquecimento"
            icon={<Megaphone className="h-5 w-5" />}
            color="text-emerald-400"
          >
            <Step n={1}>Selecione <strong className="text-white/60">CHAMADA</strong></Step>
            <Step n={2}>Posicione o monitor na área de aquecimento</Step>
            <Step n={3}>Pressione <KeyBadge>F11</KeyBadge> para tela cheia</Step>

            <p className="mt-3">
              A Chamada exibe as próximas lutas de todas as quadras, permitindo
              que atletas se preparem com antecedência. Atualiza em tempo real.
            </p>
          </Section>

          {/* Architecture */}
          <Section
            title="COMO FUNCIONA A SINCRONIZAÇÃO"
            icon={<Monitor className="h-5 w-5" />}
            color="text-zinc-400"
          >
            <p>
              Todas as estações (Central, Mat, TV, Chamada) leem e escrevem no
              mesmo banco de dados local (<strong className="text-white/60">localStorage</strong>).
              Mudanças são propagadas instantaneamente via <strong className="text-white/60">BroadcastChannel</strong>.
            </p>

            <div className="mt-3 font-mono text-sm text-zinc-500 bg-black/30 rounded-lg p-4 leading-loose">
              <div className="text-[hsl(45,93%,60%)]">CENTRAL</div>
              <div className="pl-4">↓ cria torneio, gera chaves, atribui quadras</div>
              <div className="text-zinc-600 pl-4">↓ localStorage + BroadcastChannel</div>
              <div className="flex gap-8 pl-4 mt-1">
                <div>
                  <span className="text-red-400">MAT</span>
                  <div className="text-zinc-600">opera lutas</div>
                </div>
                <div>
                  <span className="text-blue-400">TV</span>
                  <div className="text-zinc-600">exibe placar</div>
                </div>
                <div>
                  <span className="text-emerald-400">CHAMADA</span>
                  <div className="text-zinc-600">próximas lutas</div>
                </div>
              </div>
            </div>

            <div className="mt-3 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
              <p className="text-emerald-400/80 text-sm">
                <strong>Mesmo computador:</strong> Abra múltiplas janelas/abas do navegador.
                Cada uma em uma estação diferente. A sincronização é instantânea.
              </p>
            </div>
          </Section>

          {/* Workflow */}
          <Section
            title="FLUXO COMPLETO DO EVENTO"
            icon={<Monitor className="h-5 w-5" />}
            color="text-zinc-400"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-20 text-right text-sm text-zinc-500 font-mono">ANTES</span>
                <div className="w-2 h-2 rounded-full bg-[hsl(45,93%,47%)]" />
                <span className="text-sm">Central: Criar torneio, categorias, atletas, chaves</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-20 text-right text-sm text-zinc-500 font-mono">ANTES</span>
                <div className="w-2 h-2 rounded-full bg-[hsl(45,93%,47%)]" />
                <span className="text-sm">Central: Atribuir categorias às quadras</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-20 text-right text-sm text-zinc-500 font-mono">INÍCIO</span>
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm">Central: Iniciar torneio</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-20 text-right text-sm text-zinc-500 font-mono">EVENTO</span>
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-sm">Mat: Operar lutas, registrar placar</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-20 text-right text-sm text-zinc-500 font-mono">EVENTO</span>
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-sm">TV: Exibir placar e chaves no telão</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-20 text-right text-sm text-zinc-500 font-mono">EVENTO</span>
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm">Chamada: Chamar próximos atletas</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-20 text-right text-sm text-zinc-500 font-mono">FIM</span>
                <div className="w-2 h-2 rounded-full bg-zinc-600" />
                <span className="text-sm">Central: Encerrar torneio, consultar resultados</span>
              </div>
            </div>
          </Section>

        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-zinc-600 text-xs tracking-[0.3em]">
            SPE SULSPORT — SISTEMA PROFISSIONAL DE EVENTOS v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
