
## Plano: Buffer de Carregamento de Áudio ✅ CONCLUÍDO

### Problema Identificado
A música de fundo (`fightModeBg`) era colocada no **final da fila de preload** e o sistema não aguardava o buffer completar antes de iniciar o countdown. Isso causava atraso/silêncio no início do jogo.

### Solução Implementada
Criada uma tela de **loading intermediária** que aguarda os áudios críticos ficarem prontos antes de iniciar o countdown.

---

### Mudanças Realizadas

| Arquivo | Status |
|---------|--------|
| `src/hooks/useSoundEffects.ts` | ✅ Adicionada função `waitForAudioReady()` e `getAudioProgress()` |
| `src/contexts/SoundContext.tsx` | ✅ Novas funções expostas automaticamente via return type |
| `src/components/game/LoadingScreen.tsx` | ✅ **NOVO** - Tela de carregamento com progresso |
| `src/types/game.ts` | ✅ Adicionado `'loading'` ao GameState |
| `src/pages/Index.tsx` | ✅ Integrado LoadingScreen entre setup e countdown |
| `src/components/game/SetupScreen.tsx` | ✅ Simplificado - removido delay de 800ms |
| `src/components/game/ArcadeSetupScreen.tsx` | ✅ Simplificado - removido delay de 800ms |
| `src/components/game/ReactionSetupScreen.tsx` | ✅ Adicionado unlock e preload no start |
| `src/hooks/useGameState.ts` | ✅ Adicionado `goToLoading()` |
| `src/hooks/useArcadeState.ts` | ✅ Adicionado `goToLoading()` |
| `src/hooks/useReactionState.ts` | ✅ Adicionado `goToLoading()` |

---

### Fluxo Implementado

```text
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌───────────┐    ┌─────────┐
│  SETUP  │───▶│ LOADING │───▶│COUNTDOWN│───▶│  RUNNING  │───▶│FINISHED │
└─────────┘    └─────────┘    └─────────┘    └───────────┘    └─────────┘
                    │
                    │ waitForAudioReady()
                    │ (máx 5s timeout)
                    ▼
            Barra de progresso
              mostra % real
```

---

### Características

- **Timeout fallback**: 5 segundos máximo - nunca trava
- **Progresso visual**: Barra mostra % real baseado em readyState dos áudios
- **Modo Reação**: Loading mais rápido (skipBgMusic=true)
- **UX profissional**: Transição suave com feedback visual
