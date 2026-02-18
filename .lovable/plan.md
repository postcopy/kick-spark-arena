

# Redesign: Arcade Setup — Minimalismo Brutalista

## Resumo

Eliminar toda a poluicao visual da `ArcadeSetupScreen.tsx`: remover icones, descricoes, glows e sombras coloridas. Substituir por tipografia pesada, geometria flat e interacao "industrial" (amarelo solido quando ativo, cinza apagado quando inativo).

## Alteracoes

### Arquivo 1: `src/components/game/ArcadeSetupScreen.tsx`

#### 1. Imports — Limpar icones

- Remover todos os imports de Lucide: `ArrowLeft, Swords, Clock, Trophy, Zap, Timer, Shield`.
- Manter apenas: `useState`, `Slider`, `cn`, `useSound`, `bgMenuModos`.

#### 2. INTENSITY_PRESETS — Simplificar dados

Remover campos desnecessarios de cada preset: `subtitle`, `description`, `Icon`, `activeGlow`, `barColor`, `iconColor`, `textColor`.

Manter apenas: `id`, `label`, `meta`, `damage`.

Atualizar `meta` para formato tecnico: `"TARGET: 50"`, `"TARGET: 100"`, `"TARGET: 200"`.

#### 3. Cards de Selecao — Barras horizontais flat

Substituir cards verticais altos por barras horizontais compactas:

- Layout: `flex flex-col gap-2` (sem grid de 3 colunas).
- Cada card e uma barra com `h-14 md:h-16`, layout `flex items-center justify-between px-6`.
- **Esquerda**: Titulo em `text-2xl md:text-3xl font-black uppercase tracking-tighter`.
- **Direita**: Meta em `font-mono text-lg md:text-xl`.

**Estados:**
- **Inativo**: `bg-transparent border border-white/5 text-white/20`. Completamente apagado.
- **Ativo**: `bg-[#FFD700] text-black border-transparent`. Amarelo solido, sem glow, sem sombra.

Remover: icones, descricoes, barras laterais indicadoras, backdrop-blur, sombras coloridas.

#### 4. Header — Terminal style

- Remover icones `Shield`.
- Alinhar titulo a esquerda (`text-left`).
- Remover subtitulo descritivo.
- Titulo: `font-mono font-black uppercase tracking-tighter text-white`.
- "DEMOLICAO" destacado em `text-[#FFD700]`.

#### 5. Controles — Labels mono tecnicos

- Remover icones `Clock`, `Trophy`, `Timer` dos labels.
- Labels: `font-mono text-xs uppercase tracking-[0.2em] text-white/40`.
- Valores numericos: `font-mono text-white/70` (sem cores especiais).

#### 6. Slider — Thumb tecnico

Criar um slider customizado inline ou via className override:
- Track: `h-1 bg-white/10 rounded-none`.
- Thumb: quadrado pequeno `w-3 h-3 rounded-none bg-[#FFD700]` (sem borda arredondada).

Para isso, passar `className` customizado ao componente Slider e tambem ajustar o componente `slider.tsx` para aceitar classes de customizacao no Track e Thumb, ou criar um wrapper.

**Abordagem escolhida**: Modificar `src/components/ui/slider.tsx` para aceitar props `trackClassName` e `thumbClassName`, mantendo backward compatibility com defaults.

#### 7. Botao "INICIAR DUELO"

- Remover icone `Shield` de dentro do botao.
- Manter clip-path chanfrado e estilo amarelo.
- Texto apenas: `INICIAR DUELO`.

#### 8. Botao Voltar

- Remover icone `ArrowLeft`.
- Texto puro: `← VOLTAR` usando caractere unicode.

#### 9. Background

- Reduzir opacidade da imagem de `0.05` para `0.03`.
- Remover qualquer gradiente radial (nao ha nenhum atualmente, apenas confirmar).

### Arquivo 2: `src/components/ui/slider.tsx`

Adicionar props opcionais `trackClassName`, `rangeClassName` e `thumbClassName` ao componente Slider para permitir customizacao sem quebrar usos existentes.

```typescript
interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  trackClassName?: string;
  rangeClassName?: string;
  thumbClassName?: string;
}
```

Os valores default continuam iguais aos atuais. A ArcadeSetupScreen passara:
- `trackClassName="h-1 bg-white/10 rounded-none"`
- `thumbClassName="w-3 h-3 rounded-none bg-[#FFD700] border-none"`

### Arquivos alterados

- `src/components/game/ArcadeSetupScreen.tsx` — redesign brutalista completo
- `src/components/ui/slider.tsx` — adicionar props de customizacao (trackClassName, thumbClassName, rangeClassName)

