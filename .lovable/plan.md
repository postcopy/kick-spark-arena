

# Redesign: Tela de Contagem Regressiva ("Launch Sequence")

## Resumo

Transformar o CountdownScreen de um overlay basico (fundo liso, numeros cinzas) em uma sequencia de lancamento imersiva com estetica E-Sports Pro, usando logica de semaforo (vermelho/amarelo/verde) sincronizada com o audio narrado.

---

## Arquivo Alterado

| Arquivo | Tipo |
|---------|------|
| `src/components/game/CountdownScreen.tsx` | Redesign visual completo (sem mudanca de logica) |

---

## Alteracoes Detalhadas

### 1. Container e Fundo
- **Antes**: `bg-background` (liso)
- **Depois**: `bg-[#0b1120]` com gradiente radial centralizado `bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.15),transparent_70%)]`
- Manter `overflow-hidden relative` e z existente

### 2. Fase Intro (countdown > 3: segundos 6, 5, 4)
- **Antes**: "VAI COMECAR!" em `text-6xl md:text-8xl text-muted-foreground animate-pulse`
- **Depois**: 
  - Icone `AlertTriangle` (lucide) em ciano acima do texto
  - Texto "PREPARAR" em `font-mono tracking-[0.3em] text-cyan-400 animate-pulse`
  - Tamanho: `text-[clamp(2rem,6vmin,4rem)]`

### 3. Fase Contagem (3, 2, 1) - Logica de Semaforo
Helper function `getCountdownStyle(n)`:
- **3**: `text-red-500` + `drop-shadow-[0_0_35px_rgba(239,68,68,0.6)]`
- **2**: `text-yellow-400` + `drop-shadow-[0_0_35px_rgba(250,204,21,0.6)]`
- **1**: `text-green-500` + `drop-shadow-[0_0_35px_rgba(34,197,94,0.6)]`

Tamanho dos numeros: `fontSize: clamp(10rem, 40vmin, 25rem)` via style inline (Regra Kiosk)
Classe: `font-black` com `animate-countdown-pop` existente

### 4. Fase Final (countdown === 0 / "FIGHT!")
- **Antes**: `text-game-yellow text-glow-yellow`
- **Depois**: `text-white font-black italic tracking-tighter`
- Glow intenso: `drop-shadow-[0_0_60px_rgba(255,255,255,0.8)]`
- Tamanho: `fontSize: clamp(6rem, 25vmin, 16rem)`
- Manter animacao `animate-countdown-pop`

### 5. Paineis Laterais (Preview)
- **Antes**: `opacity-30` com bordas red/blue
- **Depois**: Manter mas reduzir para `opacity-15` para nao competir com semaforo

### 6. Botao Voltar
- **Antes**: `bg-black/50 text-white/70`
- **Depois**: `bg-transparent text-white/30 hover:text-white/70` (mais discreto)

---

## O Que NAO Muda

- Logica de countdown (valores, fases, refs)
- Integracao com audio (`playWithRef`, `onMusicStarted`, `shouldStartMusic`)
- Ref `hasStartedMusicRef` e efeito de reset
- Props do componente
- Comportamento do botao voltar (apenas visual)

---

## Resumo Tecnico

- 1 arquivo alterado
- 0 arquivos novos
- Import adicional: `AlertTriangle` de lucide-react
- Apenas mudancas de CSS/classes, nenhuma logica alterada
- Responsividade via `clamp(..., vmin, ...)` conforme padrao Kiosk

