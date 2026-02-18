

# Redesign: Arcade Setup Screen — Cyber Loadout Menu

## Resumo

Transformar a `ArcadeSetupScreen.tsx` em um menu de configuracao "AAA" alinhado com a identidade Industrial Cyber, aplicando background com imagem, cards com backdrop-blur, botao chanfrado, segmented control militar e bloco de regras estilo "nota de sistema".

## Alteracoes

### Arquivo: `src/components/game/ArcadeSetupScreen.tsx`

#### 1. Import de Background

Adicionar `import bgMenuModos from '@/assets/menu-modos.jpg'` no topo do arquivo.

#### 2. Container Principal (linha 102)

- Adicionar imagem `bgMenuModos` como fundo absoluto com `opacity-[0.05]` e `pointer-events-none` (mesmo padrao do GameScreen e FinishedScreen).
- Container mantem `bg-[#0b1120]` com `relative overflow-hidden`.

#### 3. Cards de Intensidade (linhas 122-151)

Substituir o estilo dos cards:

- **Inativo**: `bg-white/5 backdrop-blur-sm border border-white/10 rounded-none` (sem arredondamento, industrial).
- **Ativo**: `bg-{color}-500/10 border-{color}-500 shadow-[0_0_20px_rgba(...)]` com brilho intenso.
- Titulos maiores: `text-xl md:text-2xl font-black italic` (em vez de `text-base md:text-lg`).
- Descricoes: `text-white/60` (mais legivel).
- Remover `rounded-xl` e `border-2`, usar `border` simples.
- Adicionar `transition-all duration-300` para transicoes suaves.
- Indicador ativo: substituir bolinha por barra lateral `w-1 h-full absolute left-0 top-0` na cor do preset.

#### 4. Painel de Controles (linhas 155-232)

- Container: trocar `bg-slate-900/50` por `bg-black/20 rounded-xl p-6 border border-white/10`.
- Sliders: manter componente Slider existente (ja funcional), valor numerico destacado.

#### 5. Segmented Control "Formato" (linhas 188-203)

Substituir botoes arredondados por segmented control militar:

- Container: `bg-black/40 rounded-lg p-1 flex gap-1`.
- Item selecionado: `bg-white/10 text-white shadow-sm`.
- Item nao selecionado: `text-white/40 bg-transparent`.
- Remover `rounded-lg` individual, usar `rounded-md` menor.

#### 6. Botao "INICIAR DUELO" (linhas 247-254)

Substituir `Button` por elemento nativo com clip-path chanfrado:

- Cor: `bg-[#FFD700] text-black`.
- Clip-path: `polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)`.
- Texto: `font-black uppercase tracking-widest text-lg`.
- Largura: `w-full`.
- Hover: `hover:brightness-110`.

#### 7. Bloco de Regras (linhas 237-243)

Estilizar como "Nota de Sistema":

- Trocar `bg-white/5 rounded-lg` por `bg-transparent border-l-2 border-cyan-500/50 pl-4`.
- Fonte: `font-mono text-xs text-white/40`.
- Titulo: `text-cyan-500/60 uppercase tracking-widest`.

#### 8. Botao Voltar (linhas 256-264)

Manter funcionalidade, ajustar para `text-white/30 hover:text-white/60` com estilo outline sutil.

### Detalhes Tecnicos

**Background overlay:**
```
<img src={bgMenuModos} className="absolute inset-0 w-full h-full object-cover opacity-[0.05] pointer-events-none" alt="" />
```

**Card ativo (exemplo Sprint):**
```
className={cn(
  "relative p-4 md:p-5 border transition-all duration-300 text-left flex flex-col backdrop-blur-sm",
  isActive
    ? "bg-yellow-500/10 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)]"
    : "bg-white/5 border-white/10 hover:bg-white/8"
)}
```

**Botao chanfrado:**
```
<button
  onClick={handleStart}
  className="w-full h-14 bg-[#FFD700] text-black font-black uppercase tracking-widest text-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
  style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}
>
  INICIAR DUELO
</button>
```

**Segmented control:**
```
<div className="flex bg-black/40 rounded-lg p-1 gap-1">
  {BEST_OF_OPTIONS.map((option) => (
    <button
      className={cn(
        "flex-1 py-2 px-4 rounded-md font-bold text-base font-mono transition-all",
        bestOf === option.value
          ? "bg-white/10 text-white shadow-sm"
          : "text-white/40 bg-transparent hover:text-white/60"
      )}
    >
      {option.label}
    </button>
  ))}
</div>
```

### Arquivos alterados

- `src/components/game/ArcadeSetupScreen.tsx` — redesign completo com estetica Industrial Cyber

