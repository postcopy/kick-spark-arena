
# Feedback Visual de Impacto no Circulo Central (Modo Reacao)

## Resumo
Adicionar feedback visual imediato dentro do circulo de estimulo central quando o atleta acerta (sucesso) ou erra (falta). O circulo vai "reagir" ao impacto com mudanca de cor, texto e animacao rapida.

## Como Funciona

- **Acerto (verde)**: Circulo pisca em ciano brilhante, exibe o tempo de reacao (ex: "342ms") em fonte mono grande, com animacao de scale-up rapido. Dura 500ms.
- **Erro (vermelho)**: Circulo pulsa/treme, exibe "FALTA!" em fonte grande dentro do circulo. Dura 500ms.
- Quando nao ha feedback ativo, o comportamento atual (icones Check/X no modo cognitivo) permanece inalterado.

## Alteracoes (apenas ReactionScreen.tsx)

### 1. Novo estado de feedback (apos linha 31)
```typescript
const [hitFeedback, setHitFeedback] = useState<{ type: 'success' | 'error'; value: string } | null>(null);
```

### 2. Efeito para acerto - dispara no lastReactionTime (modificar o useEffect existente, linhas 43-50)
Adicionar ao useEffect existente que ja rastreia `lastReactionTime`:
```typescript
useEffect(() => {
  if (lastReactionTime !== null) {
    setDisplayedTime(lastReactionTime);
    setShowReactionTime(true);
    setHitFeedback({ type: 'success', value: `${lastReactionTime}ms` });
    const feedbackTimer = window.setTimeout(() => setHitFeedback(null), 500);
    const displayTimer = window.setTimeout(() => setShowReactionTime(false), 2000);
    return () => {
      window.clearTimeout(feedbackTimer);
      window.clearTimeout(displayTimer);
    };
  }
}, [lastReactionTime]);
```

### 3. Efeito para erro - dispara no commissionErrors (modificar o useEffect existente, linhas 34-41)
Adicionar ativacao do hitFeedback dentro do efeito existente:
```typescript
useEffect(() => {
  if (commissionErrors > trackedErrorsRef.current) {
    trackedErrorsRef.current = commissionErrors;
    setShowFault(true);
    setHitFeedback({ type: 'error', value: 'FALTA!' });
    const faultTimer = window.setTimeout(() => setShowFault(false), 1500);
    const feedbackTimer = window.setTimeout(() => setHitFeedback(null), 500);
    return () => {
      window.clearTimeout(faultTimer);
      window.clearTimeout(feedbackTimer);
    };
  }
}, [commissionErrors]);
```

### 4. Estilo do circulo - modificar getStimulusStyle (linhas 67-84)
Adicionar condicao para feedback de sucesso (cor ciano brilhante):
```typescript
const getStimulusStyle = () => {
  // Feedback de acerto: circulo ciano brilhante
  if (hitFeedback?.type === 'success') {
    return {
      backgroundColor: '#22d3ee',
      boxShadow: '0 0 60px 20px rgba(34,211,238,0.5), 0 0 120px 40px rgba(34,211,238,0.2)',
      transform: 'scale(1.08)',
      transition: 'transform 0.1s ease-out, background-color 0.05s',
    };
  }
  // Feedback de erro: circulo vermelho com shake
  if (hitFeedback?.type === 'error') {
    return {
      backgroundColor: '#FF3333',
      boxShadow: '0 0 80px 30px rgba(255,51,51,0.5), 0 0 140px 50px rgba(255,51,51,0.2)',
      animation: 'shake 0.3s ease-in-out',
    };
  }
  // Estados normais (sem mudanca)
  if (!stimulusActive || !stimulusColor) { ... }
  if (stimulusColor === 'red') { ... }
  return { ... }; // verde
};
```

### 5. Conteudo do circulo - modificar JSX (linhas 157-164)
Substituir o conteudo condicional dentro do circulo:
```tsx
{hitFeedback ? (
  <span
    className={`font-black font-mono text-center leading-none ${
      hitFeedback.type === 'success' ? 'text-white' : 'text-white'
    }`}
    style={{ fontSize: 'clamp(1.5rem, 6vmin, 3rem)' }}
  >
    {hitFeedback.value}
  </span>
) : (
  <>
    {isCognitive && stimulusActive && stimulusColor === 'green' && (
      <Check className="w-16 h-16 text-white" strokeWidth={3} />
    )}
    {isCognitive && stimulusActive && stimulusColor === 'red' && (
      <X className="w-16 h-16 text-white" strokeWidth={3} />
    )}
  </>
)}
```

### 6. Adicionar keyframe de shake (no mesmo arquivo, via style tag inline ou no index.css)
Adicionar ao `src/index.css`:
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-6px); }
  80% { transform: translateX(6px); }
}
```

### 7. Remover transition-none do circulo (linha 151)
Mudar de `transition-none` para permitir a animacao de scale no feedback de sucesso. Usar `transition-transform duration-100` apenas quando em feedback, controlado via estilo inline.

## Resumo de Arquivos
| Arquivo | Tipo de Alteracao |
|---------|-------------------|
| `src/components/game/ReactionScreen.tsx` | Novo estado, modificar 2 useEffects, modificar getStimulusStyle, modificar JSX do circulo |
| `src/index.css` | Adicionar keyframe `shake` |

- 2 arquivos alterados
- Nenhum arquivo novo
- Nenhuma mudanca de logica de jogo, apenas visual
