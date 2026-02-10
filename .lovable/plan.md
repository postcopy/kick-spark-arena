

# Correcao: "FALTA!" permanece na tela

## Causa Raiz

O `useEffect` que controla o "FALTA!" tem uma race condition:

```text
useEffect depende de [commissionErrors, trackedErrors]

1. commissionErrors sobe → efeito roda
2. setTrackedErrors(commissionErrors) → altera dependencia
3. Timer de 1500ms criado + cleanup registrado
4. React re-renderiza por causa do setTrackedErrors
5. Efeito re-executa → cleanup da execucao anterior CANCELA o timer
6. Na nova execucao, commissionErrors === trackedErrors → nao entra no if
7. showFault fica true PARA SEMPRE
```

## Solucao

Trocar `trackedErrors` de `useState` para `useRef`. Assim, atualizar o valor nao causa re-render e o efeito nao re-executa, preservando o timer de 1500ms.

## Mudanca

**Arquivo:** `src/components/game/ReactionScreen.tsx`

Substituir:
```text
const [showFault, setShowFault] = useState(false);
const [trackedErrors, setTrackedErrors] = useState(0);

useEffect(() => {
  if (commissionErrors > trackedErrors) {
    setTrackedErrors(commissionErrors);
    setShowFault(true);
    const timer = window.setTimeout(() => setShowFault(false), 1500);
    return () => window.clearTimeout(timer);
  }
}, [commissionErrors, trackedErrors]);
```

Por:
```text
const [showFault, setShowFault] = useState(false);
const trackedErrorsRef = useRef(0);

useEffect(() => {
  if (commissionErrors > trackedErrorsRef.current) {
    trackedErrorsRef.current = commissionErrors;
    setShowFault(true);
    const timer = window.setTimeout(() => setShowFault(false), 1500);
    return () => window.clearTimeout(timer);
  }
}, [commissionErrors]);
```

Tambem adicionar `useRef` ao import do React (ja importa `useState` e `useEffect`, falta `useRef`).

### Por que funciona

- `useRef` nao causa re-render ao ser atualizado
- O efeito so depende de `[commissionErrors]`
- Quando `commissionErrors` sobe: efeito roda UMA vez, cria o timer de 1500ms
- O timer nao e cancelado por re-execucao espuria
- Apos 1500ms, `setShowFault(false)` limpa a mensagem normalmente

## Arquivos modificados
1. `src/components/game/ReactionScreen.tsx` — trocar useState por useRef para trackedErrors

