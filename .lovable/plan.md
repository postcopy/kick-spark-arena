

# Pacote de Melhorias Visuais e de UX

Conjunto de melhorias baseadas no feedback do usuario, organizadas por prioridade e impacto.

---

## 1. Login com imersao visual (Login.tsx + SiteLayout.tsx)

Substituir o fundo generico do SiteLayout na tela de Login por um layout dedicado com:
- Background `bg-arena.jpg` com blur sutil e gradiente escuro (igual a WelcomeScreen)
- Remover uso do SiteLayout generico e criar layout inline no Login.tsx
- Manter o form centralizado com backdrop-blur no card do formulario

## 2. HomeScreen — Cards com mais vida (HomeScreen.tsx)

- Aumentar icones de `w-7 h-7` para `w-10 h-10` (mobile) e `w-14 h-14` (desktop)
- Adicionar hover com glow colorido na borda e box-shadow na cor do modo (amarelo/vermelho/verde/dourado)
- Adicionar `transition-shadow` e `group-hover:shadow-[0_0_30px_${color}40]`
- Background sutil com gradiente radial da cor do modo no hover

## 3. Duo HUD — Barra de progresso tug-of-war mais expressiva (GameScreen.tsx)

- Aumentar a barra central de `h-2` para `h-4` com border-radius
- Adicionar gradiente: lado vermelho em vermelho, lado azul em azul (nao so vermelho preenchendo)
- Glow na borda do lado que esta vencendo
- Aumentar o `+N` score diff e o `Total: N` para fontes maiores

## 4. Individual HUD — Pulse no contador + gauge menor (GameScreen.tsx)

- Adicionar animacao `scale-110` com transition rapida (100ms) no hero counter quando `flashSide` ativa (ja parcialmente implementado, reforcar com keyframe)
- Reduzir o gauge CPM de `clamp(10rem, 15vw, 16rem)` para `clamp(7rem, 12vw, 12rem)`
- Adicionar label "RECORDE" com linha tracejada no gauge quando `dayPB` existe

## 5. Setup Duelo — Modo rapido vs avancado (ArcadeSetupScreen.tsx)

- Por padrao, mostrar apenas os 3 presets + botao INICIAR (modo rapido)
- Adicionar botao "Ajustes avancados" que expande/colapsa o painel de controles (Slider de tempo, formato, intervalo)
- Usar `Collapsible` do Radix (ja instalado) para animar a abertura
- O MissionBriefing e as regras ficam sempre visiveis

## 6. Setup Reacao — Parametros colapsados (ReactionSetupScreen.tsx)

- Colapsar por padrao a secao "PARAMETROS DO TREINO" (os 6 inputs numericos)
- Adicionar botao "Personalizar parametros" que abre a secao via `Collapsible`
- Manter presets, athlete picker e modo cognitivo sempre visiveis
- Quando o usuario altera um parametro, mudar o preset label para "PERSONALIZADO" (ja implementado)

## 7. Indicador de conexao no header da HomeScreen (HomeScreen.tsx)

- Adicionar um indicador compacto no header (ao lado do email do usuario):
  - Circulo verde pulsante + "USB" quando conectado
  - Circulo vermelho + "Offline" quando desconectado
- Usar os dados de `serialPort?.isConnected` ja disponiveis nas props

---

## Detalhes tecnicos

### Arquivos afetados
| Arquivo | Mudanca |
|---------|---------|
| `src/pages/Login.tsx` | Layout dedicado com bg-arena e blur |
| `src/components/game/HomeScreen.tsx` | Icones maiores, hover glow, indicador USB no header |
| `src/components/game/GameScreen.tsx` | Tug-of-war bar melhorada, pulse no counter, gauge menor |
| `src/components/game/ArcadeSetupScreen.tsx` | Collapsible nos controles avancados |
| `src/components/game/ReactionSetupScreen.tsx` | Collapsible nos parametros |

### Dependencias
- `@radix-ui/react-collapsible` — ja instalado no projeto
- Nenhuma nova dependencia necessaria

### O que NAO esta incluido neste pacote
- "Fantasma" do recorde (requer mudanca no hook useGameState — futuro)
- Efeitos dramaticos de KO no Duelo (requer mudanca no ArcadeScreen — futuro)
- Formas geometricas no modo Reacao (requer mudanca no useReactionState — futuro)
- Simulador de demo sem hardware (requer novo hook — futuro)

