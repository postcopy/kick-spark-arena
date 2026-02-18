

# Industrial Cyber-Pro -- Redesign Visual

Transformar a estetica atual "web padrao" em um visual brutalista-industrial inspirado em equipamentos profissionais, paineis de cockpit e HUDs de jogos de luta.

## 1. Textura de Ruido Estatico (Noise Grain)

**Arquivo:** `src/index.css`

Criar um pseudo-elemento `::after` no `#root` com um SVG de ruido inline como `background-image` a 3% de opacidade, cobrindo toda a tela com `pointer-events: none`. Isso adiciona textura industrial sem afetar interatividade.

```text
#root::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,..."); /* SVG fractal noise */
  background-repeat: repeat;
}
```

## 2. Cards Chanfrados (Chamfered Corners)

**Arquivo:** `src/index.css` (nova classe utilitaria) + `src/components/game/HomeScreen.tsx`

- Remover `rounded-2xl` dos cards
- Aplicar `clip-path: polygon(...)` com cortes de 45 graus nos cantos superiores (12px de chanfro)
- Adicionar classe `.cyber-card` reutilizavel com o clip-path

```text
.cyber-card {
  clip-path: polygon(
    12px 0, calc(100% - 12px) 0,   /* topo chanfrado */
    100% 12px, 100% 100%,           /* direita */
    0 100%, 0 12px                  /* esquerda */
  );
}
```

## 3. Glow de LED Realista nos Icones

**Arquivo:** `src/components/game/HomeScreen.tsx`

Substituir o `box-shadow` simples por uma composicao de camadas:
- Gradiente radial interno (do centro do icone para fora)
- `backdrop-filter: blur(8px)` no container do icone
- Pseudo-elemento com gradiente radial da cor do modo, simulando difusao de luz
- Remover a classe `icon-glow` (animacao generica) e usar `animate-pulse-glow` mais sutil

Cada modo tera um `style` inline com `background: radial-gradient(circle, ${mode.color}25 0%, transparent 70%)` no container do icone.

## 4. Tipografia Industrial

**Arquivo:** `src/components/game/HomeScreen.tsx`

Os titulos dos modos ja usam `font-black italic uppercase`, mas falta `tracking-tighter`. Atualizar:
- Titulos: `font-black italic uppercase tracking-tighter`
- Subtitulos: `uppercase tracking-wide font-semibold` (mais industrial)
- Label "Selecione o modo": `tracking-[0.4em]` mais espacado, mais tecnico

## 5. Profundidade com Sombras Internas (Inset Shadows)

**Arquivo:** `src/index.css` (classe `.cyber-card`) + `src/components/game/HomeScreen.tsx`

Compor multiplas camadas de sombra nos cards:
- `box-shadow: inset 0 1px 0 rgba(255,255,255,0.07)` -- highlight de borda superior (reflexo metalico)
- `box-shadow: inset 0 -2px 8px rgba(0,0,0,0.5)` -- profundidade inferior
- `box-shadow: 0 4px 16px rgba(0,0,0,0.4)` -- sombra externa de elevacao
- Background com gradiente de `#0f172a` para `#0b1120` simulando metal escovado

## Resumo de Arquivos Alterados

| Arquivo | Mudancas |
|---------|----------|
| `src/index.css` | Overlay de noise grain, classe `.cyber-card` (clip-path + inset shadows), classe `.led-glow` |
| `src/components/game/HomeScreen.tsx` | Trocar `rounded-2xl` por `cyber-card`, atualizar glow dos icones para LED radial, ajustar tracking da tipografia |

## Resultado Esperado

- Cards com aparencia de paineis metalicos chanfrados, com profundidade visual
- Textura de grao fino sobre toda a interface
- Icones com brilho difuso tipo LED real (nao um shadow generico)
- Tipografia mais agressiva e compacta
- Visual coeso de equipamento profissional / HUD de cockpit

