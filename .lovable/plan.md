
# Redesign Total: Modo Duelo ("Corrida de Demolicao" + Visual Pro)

## Resumo da Transformacao

O Modo Duelo vai mudar de um "jogo de luta" (atacar o adversario) para uma "Corrida de Demolicao" (destruir seu proprio alvo). A configuracao sera simplificada com presets de intensidade, e o visual adotara estetica E-Sports profissional sem mascotes.

---

## Arquivos Alterados (4 arquivos)

| Arquivo | Tipo de Mudanca |
|---------|-----------------|
| `src/components/game/ArcadeSetupScreen.tsx` | Redesign completo dos controles |
| `src/components/game/ArcadeScreenTV.tsx` | Redesign visual + inversao de logica |
| `src/hooks/useArcadeState.ts` | Inversao de dano (proprio alvo) + remocao de energy/special + suporte a float |
| `src/components/game/ArcadeFinishedScreen.tsx` | Remover mascotes, atualizar terminologia |

---

## Parte 1: Setup (ArcadeSetupScreen.tsx)

### Remover
- Sliders de `vestDamage` e `helmetDamage`
- Presets antigos (Kids/Juvenil/Adulto)
- Regras sobre "combos" e "especial"

### Adicionar: Cartoes de Intensidade
Tres cartoes grandes selecionaveis em grid:

**SPRINT** (Zap, amarelo/laranja)
- Meta: ~50 chutes | vestDamage: 2.0 | helmetDamage: 2.0
- "Explosao maxima. Quem termina 50 chutes primeiro?"

**RESISTENCIA** (Swords, azul/ciano)
- Meta: ~100 chutes | vestDamage: 1.0 | helmetDamage: 1.0
- "Volume de luta. 100 chutes de pura resistencia."

**ELITE** (Trophy, roxo)
- Meta: ~200 chutes | vestDamage: 0.5 | helmetDamage: 0.5
- "Desafio Olimpico. 200 chutes para testar o limite."

### Manter
- Slider de Tempo do Round
- Selector de Formato (Rapido / Melhor de 3)
- Slider de Intervalo de Recuperacao (quando Best of 3)

### Atualizar
- Titulo: "DUELO ARCADE" -> "CORRIDA DE DEMOLICAO" ou "DUELO"
- Subtitulo: "Destrua seu alvo primeiro!" 
- Regras: "META: X chutes | Colete: X dano | Quem zerar primeiro vence!"
- Visual: bg-[#0b1120], font-mono nos numeros

### Props
- `vestDamage` e `helmetDamage` continuam sendo passados para Index.tsx mas sao definidos automaticamente pelo preset selecionado (nao por sliders manuais)

---

## Parte 2: Logica (useArcadeState.ts)

### Inversao de Dano
- Antes: Vermelho chuta -> dano no Azul (`setBlueState`)
- Depois: Vermelho chuta -> dano no PROPRIO Vermelho (`setRedState`)
- O `registerKick` vai aplicar dano no `attackerState` em vez do `defenderState`

### Remocao de Energy/Special
- Remover campos `energy`, `specialReady` do `ArcadePlayerState` (manter no tipo para nao quebrar, mas setar sempre 0/false)
- Remover logica de `energyPerKick`, `energyMax`, `specialDamageBonus` do `calculateDamage`
- Manter combo bonus (chutes rapidos = +dano bonus)

### Vitoria por Zeragem
- KO: Quem chega a HP 0 primeiro VENCE (nao perde)
- Antes: `if (redState.hp <= 0) endRound('blue', true)` (azul vence porque vermelho morreu)
- Depois: `if (redState.hp <= 0) endRound('red', true)` (vermelho vence porque zerou seu alvo)

### Empate por Tempo
- Antes: Maior HP vence
- Depois: MENOR HP vence (quem destruiu mais)
- `const winner = redState.hp < blueState.hp ? 'red' : blueState.hp < redState.hp ? 'blue' : 'tie'`

### Suporte a Float
- O `vestDamage` e `helmetDamage` ja sao `number` no tipo, entao 0.5 funciona
- O slider de setup vai ser removido, entao o step nao e problema
- O HP exibido usara `Math.round()` ou `Math.ceil()` para evitar decimais na tela

### Visual Feedback
- `flashSide` agora indica o lado de quem CHUTOU (nao do defensor)
- `lastDamage.side` agora mostra no lado de quem chutou (proprio)

---

## Parte 3: Tela do Jogo (ArcadeScreenTV.tsx)

### Remover
- `FighterMascot` (ambos os lados)
- Import do `FighterMascot`
- Funcao `getMascotState`
- Barras de energia no footer
- Indicadores "ESPECIAL" (special ready/used)
- Import de `Zap`

### Adicionar
- Import de `Shield` (lucide-react)
- Icone grande de Shield no centro de cada lado, com animacao de shake quando recebe dano
- Label "META" em vez de "VIDA"

### Redesign Visual
- Background: `bg-[#0b1120]` (Slate 950) em vez de `bg-black`
- Tipografia: `font-mono` nos numeros (timer, HP)
- Top bar simplificada (nomes + round stars)
- Footer simplificado: apenas controles hint + battery badges (sem energia)

### HP Display
- Manter a barra como background height (visual atual) - ja e bom
- O numero gigante continua centralizado mas agora representa "quanto falta para zerar"
- Adicionar label pequeno "META" ou "RESTANTE" acima do numero

### Feedback de Hit
- Manter popups de dano flutuante
- Garantir que valores float (ex: -0.5) sejam exibidos corretamente
- Popup aparece sobre o lado de quem CHUTOU (nao do adversario)

---

## Parte 4: Tela Final (ArcadeFinishedScreen.tsx)

### Remover
- `FighterMascot` (ambos os mascotes)
- Imports de `FighterMascot`

### Atualizar
- Badge: "ARCADE MODE" -> "CORRIDA DE DEMOLICAO"
- Round details: HP restante agora significa "quanto faltou" (menor = melhor)
- Manter confetti, trofeu, e botoes

---

## Fluxo de Dados (sem mudancas em Index.tsx)

O `Index.tsx` continua passando `vestDamage`, `helmetDamage`, `roundDuration`, `bestOf`, `recoveryInterval` para o setup e para o hook. A unica diferenca e que o setup agora define esses valores via presets em vez de sliders manuais. Nao e necessario alterar props ou estado em Index.tsx.

---

## Resumo Tecnico

| Item | Antes | Depois |
|------|-------|--------|
| Dano aplicado em | Adversario | Proprio |
| Vitoria | Adversario HP = 0 | Proprio HP = 0 |
| Empate (tempo) | Maior HP vence | Menor HP vence |
| Energy/Special | Ativo | Removido |
| Combos | Ativo | Mantido |
| Mascotes | FighterMascot | Shield icon |
| Setup | 3 sliders + presets | 3 cartoes de intensidade |
| Dano float | Nao usado | Suportado (0.5) |
| Visual | Street Fighter / infantil | E-Sports / profissional |

- 4 arquivos alterados
- 0 arquivos novos
- Mudancas de logica + visual
- Responsividade mantida (vmin/vh em todos os clamp)
