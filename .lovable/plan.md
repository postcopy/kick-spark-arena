
# Fix: Debugging por que o ImpactDetector nao e criado

## Diagnostico

O console mostra dados seriais chegando (`[Serial] Parsed OK`) mas NENHUM log do detector (`[useSerialPort] ImpactDetector ENABLED`) e NENHUM log de flush. Isso significa que ou:
1. O useEffect que cria o detector nunca roda com `enabled=true`
2. Ou roda, mas algo destrói o detector logo depois

O codigo parece correto, entao precisamos de logging agressivo para identificar o ponto exato de falha.

## Mudancas

### 1. `src/hooks/useSerialPort.ts` - Logging incondicional

**No useEffect do detector (linha 114):** Adicionar log NO INICIO do efeito, ANTES do if, mostrando o valor de `impactDetectorConfig?.enabled` e `noiseFloorJson`. Isso confirma se o efeito roda e com quais valores.

```
console.log('[useSerialPort] detector useEffect RUNNING, enabled=', impactDetectorConfig?.enabled, 'noiseFloor=', noiseFloorJson);
```

**No flush interval (linha 131-148):** Adicionar um heartbeat log incondicional a cada 5 segundos (usando um counter no ref). Isso confirma se o interval esta rodando, independente de haver impactos finalizados.

```
// A cada ~150 iteracoes (30ms * 150 = 4.5s), logar status
flushCountRef.current++;
if (flushCountRef.current % 150 === 0) {
  console.log('[useSerialPort] flush heartbeat, detector exists:', !!detectorRef.current);
}
```

**No startReading, dentro do while loop (linha 249):** Logar se o detector existe quando um pacote chega (apenas o primeiro pacote, usando um flag ref para nao poluir).

```
if (!loggedDetectorStatusRef.current) {
  console.log('[useSerialPort] First packet, detectorRef.current:', !!detectorRef.current);
  loggedDetectorStatusRef.current = true;
}
```

### 2. `src/pages/ChampionshipMat.tsx` - Log do config memo

**Apos o useMemo (linha 201):** Adicionar um useEffect que loga quando o `impactDetectorConfigMemo` muda.

```
useEffect(() => {
  console.log('[ChampionshipMat] impactDetectorConfig changed:', impactDetectorConfigMemo);
}, [impactDetectorConfigMemo]);
```

## Resultado esperado

Com esses logs, ao abrir o console o usuario vera:
- Se o memo retorna `enabled: true` ou `false`
- Se o useEffect do detector roda e com quais valores
- Se o flush interval esta ativo (heartbeat a cada ~5s)
- Se o primeiro pacote serial ve o detector como existente ou null

Isso vai identificar EXATAMENTE onde o pipeline quebra, permitindo o fix definitivo.

## Arquivos modificados

- `src/hooks/useSerialPort.ts` - 3 pontos de logging adicionais
- `src/pages/ChampionshipMat.tsx` - 1 useEffect de debug
