

# Fix de Layout: Ajuste "Fit-to-Screen" (Sem Scroll)

## Resumo

Compactar o ArcadeSetupScreen verticalmente para caber em 100vh sem scroll, usando Flexbox vertical com `flex-1` nos cartoes de intensidade para que encolham automaticamente em telas menores.

---

## Arquivo Alterado

| Arquivo | Tipo |
|---------|------|
| `src/components/game/ArcadeSetupScreen.tsx` | Compactacao vertical CSS/Tailwind |

---

## Alteracoes

### 1. Container Principal (linha 102)
- Trocar `overflow-hidden` por manter, mas garantir que `h-full` funcione como `h-screen` no contexto pai
- Reduzir padding: `p-4 md:p-6` ja esta OK

### 2. Main wrapper (linha 118)
- **Antes**: `flex-1 min-h-0 w-full max-w-6xl mx-auto overflow-y-auto`
- **Depois**: `flex-1 min-h-0 w-full max-w-6xl mx-auto flex flex-col overflow-hidden`
- Remover `overflow-y-auto` (proibido scroll)
- Adicionar `flex flex-col` para distribuir espaco internamente

### 3. Header (linhas 104-115)
- Reduzir `mb-4 md:mb-6` para `mb-2 md:mb-3`
- Titulo: adicionar `text-[clamp(1.5rem,4vmin,3rem)]` para escalar com a tela
- Subtitulo: reduzir para `text-sm md:text-base`

### 4. Cartoes de Intensidade (linhas 120-150)
- **Antes**: `grid ... mb-6` (altura fixa pelo conteudo)
- **Depois**: `flex-1 min-h-0 grid ... mb-3` (cresce/encolhe com espaco disponivel)
- Wrapper div com `flex-1 min-h-0 mb-3` envolvendo o grid
- Grid interno: `h-full` para preencher o wrapper
- Cartoes: `overflow-hidden` para cortar conteudo se muito apertado
- Reduzir padding: `p-3 md:p-4` (era `p-4 md:p-6`)
- Icones: `w-6 h-6 md:w-8 md:h-8` (era `w-8 h-8 md:w-10 md:h-10`)
- Descricao: `hidden md:block` (esconder em telas baixas) ou `text-[0.65rem] leading-tight`

### 5. Painel de Controles (linhas 152-230)
- **Antes**: `p-4 md:p-6 ... mb-6`
- **Depois**: `flex-shrink-0 p-3 md:p-4 ... mb-3`
- `flex-shrink-0` para nao encolher (manter sempre visivel)
- Reduzir gaps internos: `gap-3 md:gap-4` (era `gap-4 md:gap-6`)
- Labels e valores na mesma linha (ja estao com `justify-between`)
- Reduzir `mb-3 md:mb-4` dos sub-headers para `mb-2`

### 6. Rodape (linhas 232-269)
- **Antes**: `grid ... items-end` sem restricao
- **Depois**: `flex-shrink-0 grid ... items-end`
- Regras: texto mais compacto, `p-2 md:p-3` (era `p-3 md:p-4`)
- Botao Iniciar: `h-12 md:h-14` (era `h-14 md:h-16`)
- Botao Voltar + hint SPACE: combinar em uma linha so para economizar altura

---

## Estrutura Logica Final

```text
div (h-full, flex flex-col, overflow-hidden)
  |-- header (flex-shrink-0)        ~60px
  |-- main (flex-1, min-h-0, flex flex-col)
  |     |-- cards (flex-1, min-h-0)  ~preenche espaco livre
  |     |-- controls (flex-shrink-0) ~120px
  |     |-- footer (flex-shrink-0)   ~80px
```

## O Que NAO Muda

- Logica de estados e callbacks
- Props do componente
- Presets e opcoes
- Integracao com SoundContext
- Layout horizontal (3 colunas em desktop)

