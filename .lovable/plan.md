
# Redesign: Reaction Mode — Sniper HUD (Target Focus)

## Resumo

Substituir o layout atual da ReactionScreen por um HUD tatico de precisao inspirado em mira de sniper. O circulo simples vira um "Target Node" com crosshair e anel tecnico. As stats saem do rodape e vao para paineis laterais flutuantes. O header fica minimalista com round e timer.

## Alteracoes

### Arquivo: `src/components/game/ReactionScreen.tsx` (reescrita completa do layout)

#### 1. Fundo e Efeito Periferico

- Fundo `bg-slate-950` mantido com `menu-modos.jpg` em 3% de opacidade via pseudo-elemento (consistente com o resto do app)
- Novo estado `peripheralFlash`: quando o estimulo verde ativa, um `box-shadow: inset 0 0 100px rgba(74,222,128,0.3)` aparece na div root por 200ms, estimulando visao periferica

#### 2. Header Tecnico (barra superior)

- Barra fina `bg-black/40 backdrop-blur-sm`
- Esquerda: `ROUND 3/10` em font-mono branco
- Direita: Timer do trabalho (workTimeLeft) em font-mono, pulsa vermelho nos ultimos 5s
- Botao de voltar (ArrowLeft) integrado na barra, extrema esquerda

#### 3. Target Node Central (substitui o circulo simples)

Estrutura em camadas concentricas:

- **Anel externo**: `w-72 h-72` (288px), `border-4 border-white/10 rounded-full` — sempre visivel
- **Crosshair**: 4 linhas de mira (top, bottom, left, right) partindo do anel em direcao ao centro, `bg-white/10`, desaparecem quando estimulo ativa
- **Ponto central idle**: Circulo pequeno (w-4 h-4) `bg-white/10` pulsando suavemente
- **Estado GO (verde)**: Interior preenche com `bg-[#4ade80]`, anel brilha com `shadow-[0_0_60px_#4ade80,0_0_120px_rgba(74,222,128,0.3)]`, crosshairs desaparecem
- **Estado NO-GO (vermelho)**: Interior preenche com `bg-red-500`, anel brilha vermelho
- **Feedback de acerto**: Tempo (ex: "340ms") aparece DENTRO do alvo em `text-black font-black` sobre fundo cyan, tamanho `clamp(2rem, 8vmin, 4rem)`
- **Feedback de erro**: "FALTA!" aparece dentro do alvo com shake animation

#### 4. Paineis Laterais (Telemetria)

Substituem o rodape fixo. Posicionados com `absolute` nos lados da tela:

**Painel Esquerdo (Metricas)**:
- Posicao: `left-6 top-1/2 -translate-y-1/2`
- Vertical, sem background card, texto flutuante mono
- `MEDIA` — valor grande em branco
- `MELHOR` — valor menor abaixo em amarelo
- `FALTAS` — (so no modo cognitivo) em vermelho

**Painel Direito (Log de Combate)**:
- Posicao: `right-6 top-1/2 -translate-y-1/2`
- Lista dos ultimos 3 hits, alinhado a direita
- Formato: `HIT 05  410ms`
- Cor: verde (`text-green-400`) se < 400ms, amarelo (`text-yellow-400`) se >= 400ms
- Font-mono, texto pequeno (text-xs), sem background

#### 5. Hits Counter

- Abaixo do target node: `HITS: 07` em amarelo, font-bold, tracking-wider
- Menor que antes, nao compete com o alvo

#### 6. Tela de Descanso (isResting)

- Manter layout atual mas aplicar o mesmo fundo com textura
- Adicionar crosshair sutil no fundo para manter continuidade visual

## Fluxo Visual

```text
+--[< ROUND 3/10]-------[1:24]--+
|                                |
|  MEDIA                HIT 05  |
|  342ms                 410ms  |
|                        HIT 04  |
|  MELHOR                382ms  |
|  298ms                HIT 03  |
|          +--------+    340ms  |
|          |  (GO)  |           |
|          | --+--  |           |
|          |   |    |           |
|          +--------+           |
|          HITS: 07             |
|                                |
+--------------------------------+
```

## Resultado Esperado

- Sensacao de "cockpit tatico" com foco total no alvo central
- Dados acessiveis na periferia sem competir com o estimulo
- Flash periferico verde cria urgencia sem cegar
- Tempo de reacao exibido dentro do alvo da feedback imediato e claro
