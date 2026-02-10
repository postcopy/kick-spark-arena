

# Redesign Completo: HUD "Elite" para Modo Individual

## Arquivo
`src/components/game/GameScreen.tsx` (unico arquivo)

## Alteracoes

### 1. Import (linha 7)
Adicionar `Zap` de `lucide-react`.

### 2. Novos calculos e estado (apos linha 38)
- **CPM em tempo real**: `elapsedSeconds = totalDuration - timeLeft`, `cpm = Math.round((totalKicks / elapsedSeconds) * 60)` quando elapsed > 0, senao 0.
- **dayPB**: `useState<number | null>(null)` + `useEffect` que le `kickcounter_dayRecord` do localStorage e extrai `bestTotal` se a data for de hoje.

### 3. Timer condicional (linhas 73-114)
Envolver o bloco do timer no topo em `{!isIndividual && (...)}` para aparecer apenas no modo Duo.

### 4. Bloco Individual reescrito (linhas 144-175)
Substituir todo o conteudo por um HUD centralizado vertical:

- **Timer circular grosso**: SVG com `strokeWidth="8"` (vs 4 atual), `viewBox="0 0 100 100"`, raio 45, tamanho via `clamp(7rem,25vh,18rem)`. Cor `#FFD700` quando > 10s, `#EF4444` + `animate-pulse` quando <= 10s. Progresso via `strokeDasharray="283"` e `strokeDashoffset` calculado como `283 - (283 * (timeLeft / totalDuration))`.
- **Contador de chutes**: `totalKicks` em fonte dourada gigante `clamp(4rem, 20vh, 12rem)` com glow `drop-shadow` e escala no flash.
- **Label "HITS"**: Abaixo do contador em `clamp(1.2rem, 3vh, 2.5rem)`.
- **Badge CPM**: Visivel quando `totalKicks > 0`. Icone `Zap` amarelo preenchido + valor CPM em badge `bg-white/10 border-white/20 rounded-full`.
- **Mascote removido** do modo individual.

### 5. Footer reescrito (linhas 218-241)
Substituir por logica condicional:

**Individual** -- barra de stats com 3 colunas em grid:

| MELHOR (DIA) | RITMO ATUAL | ATLETA |
|---|---|---|
| `dayPB` em verde `#39FF14` ou "--" | `cpm` CPM | Nome do atleta ou "Visitante" |

Estilo: `bg-black/80 backdrop-blur-md border-t border-white/10 py-4`. Labels em `text-[10px] uppercase tracking-widest text-white/50`. Valores em `text-xl font-bold`.

**Duo** -- footer existente mantido inalterado (nomes Vermelho/Azul).

### 6. Modo Duo
Permanece 100% inalterado: timer no topo, paineis vermelho/azul com mascotes, footer com nomes.

## Secao Tecnica

### Calculo do progresso do anel (individual)
```text
circunferencia = 2 * PI * 45 = ~283
strokeDasharray = "283"
strokeDashoffset = 283 - (283 * (timeLeft / totalDuration))
```
Anel comeca cheio e vai diminuindo.

### Resultado visual (modo individual)
```text
+------------------------------------------+
|                                          |
|         [Anel Grosso Dourado]            |
|              1:23                        |
|                                          |
|               42                         |
|              HITS                        |
|           [Zap 120 CPM]                  |
|                                          |
+------------------------------------------+
| MELHOR (DIA) | RITMO ATUAL |   ATLETA   |
|     12       |   120 CPM   |   Joao     |
+------------------------------------------+
```
