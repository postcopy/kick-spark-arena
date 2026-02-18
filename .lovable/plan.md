
# Redesign: Home Screen - Pro Lobby

## Resumo

Transformar a HomeScreen de um grid 2x2 centralizado em um **Lobby de 4 colunas widescreen** com Hero Cards verticais, efeitos de glow/hover agressivos e barra de atalhos moderna no footer.

---

## Arquivo Alterado

| Arquivo | Acao |
|---------|------|
| `src/components/game/HomeScreen.tsx` | Reescrever layout e cards |
| `src/index.css` | Adicionar keyframes para glow pulse nos cards |

---

## Layout Atual vs. Novo

```text
ATUAL (grid 2x2 centrado, max-w-4xl)
+-------------------------------+
| [Logo]          [Ola, user] [=]|
|-------------------------------|
|     Escolha um modo           |
|   +--------+ +--------+      |
|   | TEMPO  | | DUELO  |      |
|   +--------+ +--------+      |
|   | REACAO | | CAMP.  |      |
|   +--------+ +--------+      |
|-------------------------------|
| o Use A e L no teclado        |
+-------------------------------+

NOVO (4 colunas, max-w-7xl, fill height)
+----------------------------------------------------+
| [Logo]                     [Ola, user] [=]  <- translucent bar |
|----------------------------------------------------|
| +----------+ +----------+ +----------+ +----------+|
| |   [icon] | |   [icon] | |   [icon] | |   [icon] ||
| |   glow   | |   glow   | |   glow   | |   glow   ||
| |          | |          | |          | |          ||
| |  CONTRA  | |  DUELO   | |  REACAO  | | CAMPEO-  ||
| | O TEMPO  | |          | |          | |  NATO    ||
| |          | |          | |          | |          ||
| | Quem     | | Luta ate | | Reflexo  | | Placar   ||
| | chuta+?  | | o K.O.!  | | e ctrl   | | pro      ||
| |----------| |----------| |----------| |----------||
| | 1-2 jog  | | 2 jog    | | Turma    | | 2 telas  ||
| +----------+ +----------+ +----------+ +----------+|
|----------------------------------------------------|
| [A] Vermelho    [L] Azul    [o] Conectado          |
+----------------------------------------------------+
```

---

## Detalhes Tecnicos

### 1. Container Principal

- `bg-[#0b1120]` (dark slate consistente com outros modos)
- `flex flex-col h-full w-full overflow-hidden`

### 2. Header (flex-shrink-0)

- Fundo translucido: `bg-white/5 backdrop-blur-sm border-b border-white/10`
- Logo a esquerda, usuario + MenuDrawer a direita
- Texto usuario: `text-white/60 font-mono text-xs`

### 3. Main (flex-1 min-h-0)

- `flex items-center justify-center p-4 md:p-6`
- Container interno: `max-w-7xl w-full`
- Titulo "SELECIONE O MODO" centralizado acima dos cards, `font-mono font-bold text-white/40 tracking-[0.3em] text-xs md:text-sm uppercase`

#### Hero Cards Grid

```text
grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4
```

Cada card e um `<button>` com:

- **Estrutura vertical**: icone no topo, titulo no meio, info no rodape
- **Fundo**: gradiente vertical sutil da cor do modo (`from-transparent via-[cor]/5 to-[cor]/20`)
- **Borda**: `border border-[cor]/30` -> hover: `border-[cor]/80`
- **Glow no icone**: `shadow-[0_0_20px_cor] group-hover:shadow-[0_0_40px_cor]` com transicao
- **Hover scale**: `hover:scale-[1.03]` com `transition-all duration-300`
- **Active**: `active:scale-[0.97]`
- **Altura**: `h-full` para preencher o grid uniformemente

Icone container:
- `w-16 h-16 md:w-20 md:h-20` fundo circular translucido
- Icone `w-8 h-8 md:w-10 md:h-10` na cor do modo
- CSS glow persistente via `box-shadow` e `text-shadow` na cor do modo

Titulo:
- `font-black italic text-lg md:text-xl lg:text-2xl text-white uppercase tracking-tight`

Subtitulo:
- `text-sm text-[cor] font-medium`

Info tecnica (rodape do card):
- `font-mono text-[11px] text-white/40 border-t border-white/10 pt-2 mt-auto`
- Badges como `[1-2 JOGADORES]`, `[2 TELAS]`

### 4. Footer (flex-shrink-0)

- `bg-white/5 border-t border-white/10 px-4 py-2`
- Layout: `flex items-center justify-center gap-6`

Quando **nao conectado** (teclado):
```text
[A] Vermelho    [L] Azul    [ESC] Menu
```
Cada atalho e um grupo com:
- Badge da tecla: `bg-white/10 border border-white/20 rounded px-2 py-0.5 font-mono text-xs text-white/80`
- Label: `text-white/40 text-xs font-mono`

Quando **conectado** (serial):
```text
[o] Plaquinha conectada    [Bateria icons]
```
- Indicador verde + `EquipmentStatus` compacto

---

## Cores por Modo

| Modo | Cor CSS | Glow |
|------|---------|------|
| Contra o Tempo | `game-yellow` / `#eab308` | `shadow-yellow-500/50` |
| Duelo | `game-red` / `#ef4444` | `shadow-red-500/50` |
| Reacao | `#22c55e` (green-500) | `shadow-green-500/50` |
| Campeonato | `#eab308` (yellow-500) | `shadow-yellow-500/50` |

---

## Responsividade

- **Mobile (< lg)**: Grid 2x2, cards mais compactos, icones menores
- **Desktop (>= lg)**: Grid 4 colunas, cards verticais altos preenchendo a tela
- Footer sempre visivel, sem scroll
- `flex-1 min-h-0` no main garante compressao em telas menores

---

## CSS Adicional (index.css)

Adicionar keyframe `glow-pulse` para o efeito de brilho persistente nos icones:

```text
@keyframes glow-pulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}
```

Classe utilitaria `.icon-glow` que aplica o pulso sutil no box-shadow do container do icone.

---

## O Que NAO Muda

- Props do componente (mesma interface `HomeScreenProps`)
- Logica de `handleSelectMode`, `handleChampionship`
- `MenuDrawer` e `EquipmentStatus` (reutilizados)
- Integracao com `useAuth`, `useSound`
