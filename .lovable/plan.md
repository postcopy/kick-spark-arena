

# UX Upgrade: Tutorial, Dicas Visuais e Descricoes Dinamicas

## Resumo

Adicionar elementos de usabilidade nas 3 telas de setup (Arcade, Contra o Tempo, Reacao) sem quebrar a estetica brutalista: Mission Briefing dinamico, chevrons de affordance, botao tutorial com modal, e animacao de atencao por inatividade.

## Alteracoes

### 1. Novo componente: `src/components/game/MissionBriefing.tsx`

Container reutilizavel estilo terminal que recebe um texto e o exibe com efeito de "digitacao".

- Props: `text: string` (a descricao do modo selecionado)
- Visual: `border-l-2 border-cyan-500/30 pl-4 py-2 bg-black/20 min-h-[48px]`
- Header: `MISSION BRIEFING` em `font-mono text-[0.65rem] text-cyan-500/60 uppercase tracking-widest`
- Texto: `font-mono text-sm text-white/60` com efeito typewriter (revela caractere a caractere via `useState` + `setInterval`)
- Quando `text` muda, reinicia a animacao de digitacao
- Texto padrao quando vazio: `"SELECIONE UM PROTOCOLO PARA INICIAR A ANALISE..."`

### 2. Novo componente: `src/components/game/SetupTutorialDialog.tsx`

Modal "Manual do Operador" reutilizavel pelas 3 telas.

- Usa `Dialog` do shadcn/ui
- Props: `open: boolean; onOpenChange: (open: boolean) => void; accentColor?: string` (amarelo para Arcade/Setup, verde para Reacao)
- Titulo: `MANUAL DO OPERADOR` em font-mono
- 3 passos com numero grande (01, 02, 03) e texto:
  - `01 — SELECIONE O PROTOCOLO`: Escolha o tipo de treino
  - `02 — AJUSTE A CARGA`: Configure tempo e dificuldade
  - `03 — INICIAR COMBATE`: De o play e acerte os alvos
- Botao de fechar: `ENTENDIDO` com accent color
- Visual: fundo escuro, bordas tecnicas, estilo "arquivo confidencial"

### 3. Hook customizado: `src/hooks/useIdleAttention.ts`

Hook que detecta inatividade e retorna um boolean para trigger de animacao.

- Recebe `timeoutMs: number` (default 5000)
- Reseta timer a cada `mousemove`, `touchstart`, `keydown`, `click`
- Retorna `isIdle: boolean`
- Usado para aplicar `animate-pulse` condicionalmente nos botoes de iniciar ou nos cards de modo

### 4. Alteracoes em `src/components/game/ArcadeSetupScreen.tsx`

- Importar `MissionBriefing`, `SetupTutorialDialog`, `useIdleAttention`, `ChevronRight` e `HelpCircle` do lucide-react
- **Header**: Adicionar botao `[ ? ]` ao lado do titulo que abre o `SetupTutorialDialog`
- **Barras de preset**: Adicionar `<ChevronRight>` na extremidade direita de cada barra
  - Inativo: `text-white/20 w-4`
  - Hover: `text-white/60 translate-x-1`
  - Ativo: `text-black w-5`
  - Adicionar `cursor-pointer` (ja implicito no `button`)
- **Mission Briefing**: Inserir `<MissionBriefing>` logo abaixo das barras de preset (antes do Controls Panel)
  - Mapeamento: sprint -> "PROTOCOLO DE VELOCIDADE: Atingir a meta no menor tempo. Foco em explosao.", resistance -> "VOLUME DE LUTA: Meta padrao com ritmo constante. Equilibrio entre potencia e resistencia.", elite -> "DESAFIO DE MARATONA: Meta extrema que exige estrategia e controle total do combate."
- **Botao INICIAR DUELO**: Aplicar `animate-pulse` condicional via `useIdleAttention(5000)` quando `isIdle === true`

### 5. Alteracoes em `src/components/game/SetupScreen.tsx`

- Importar `MissionBriefing`, `SetupTutorialDialog`, `useIdleAttention`, `ChevronRight`, `HelpCircle`
- **Header**: Adicionar progress bars existentes + botao `[ ? ]` no topo
- **Step "players"**: Adicionar `<ChevronRight>` nas barras DUPLA/SOZINHO
  - Inserir `<MissionBriefing>` abaixo com textos: duo -> "MODO DUPLA: Dois jogadores competem lado a lado. Quem marcar mais chutes vence.", individual -> "MODO SOLO: Treine sozinho e registre seu desempenho no ranking."
- **Step "duration"**: Adicionar `<ChevronRight>` nas barras de duracao
  - Inserir `<MissionBriefing>` com descricao da duracao selecionada
- **Botao JOGAR!**: `animate-pulse` condicional via `useIdleAttention`

### 6. Alteracoes em `src/components/game/ReactionSetupScreen.tsx`

- Importar `MissionBriefing`, `SetupTutorialDialog`, `useIdleAttention`, `ChevronRight`, `HelpCircle`
- **Header**: Adicionar botao `[ ? ]` ao lado do titulo
- **Barras de dificuldade**: Adicionar `<ChevronRight>` em cada barra
- **Mission Briefing**: Inserir abaixo do Row 1 (Athlete + Difficulty)
  - beginner -> "MODO INICIANTE: Reflexos basicos com tempos generosos. Ideal para aquecimento.", intermediate -> "MODO INTERMEDIARIO: Velocidade e consistencia. Prepare-se para reagir rapido.", elite -> "MODO ELITE: Reflexos no limite. Cada milissegundo conta."
- **Botao INICIAR TREINO**: `animate-pulse` condicional via `useIdleAttention`

## Arquivos criados/alterados

| Arquivo | Acao |
|---------|------|
| `src/components/game/MissionBriefing.tsx` | Criar componente |
| `src/components/game/SetupTutorialDialog.tsx` | Criar componente |
| `src/hooks/useIdleAttention.ts` | Criar hook |
| `src/components/game/ArcadeSetupScreen.tsx` | Adicionar briefing, chevrons, tutorial, idle pulse |
| `src/components/game/SetupScreen.tsx` | Adicionar briefing, chevrons, tutorial, idle pulse |
| `src/components/game/ReactionSetupScreen.tsx` | Adicionar briefing, chevrons, tutorial, idle pulse |

