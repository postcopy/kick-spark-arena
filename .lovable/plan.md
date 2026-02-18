

# Redesign: Duo Time Attack HUD — Arena Battle

## Resumo

Substituir o modo Duo atual (dois blocos solidos vermelho/azul com KickPanel e FighterMascot) por um HUD "Arena Battle" com estetica Industrial Cyber, simetrico, fundo escuro e metricas individuais de CPM.

## Estrutura do Layout

```text
+------------------------------------------------------------+
| ████████████████████  BARRA DE TEMPO  ████████████████████  |
|                       01:23                                 |
+------------------------------------------------------------+
|                                                              |
|  ┌─────────────────┐         ┌─────────────────┐            |
|  │▌RED         47  │   VS    │  39        BLUE▐│            |
|  │▌HITS             │         │          HITS  ▐│            |
|  │▌CPM: 142        │  ████   │      CPM: 118  ▐│            |
|  └─────────────────┘  +8     └─────────────────┘            |
|                                                              |
+------------------------------------------------------------+
| Vermelho    ● Conectado    [P] Pausar    Azul               |
+------------------------------------------------------------+
```

## Alteracoes

### Arquivo: `src/components/game/GameScreen.tsx`

#### 1. Novos calculos (antes do return)

Adicionar apos a linha 44 (onde `cpm` e calculado):

- `redCpm` e `blueCpm`: CPM individual por lado
- `totalDuo`: total combinado para calculo de percentuais
- `redPercent` / `bluePercent`: distribuicao proporcional
- `scoreDiff`: diferenca absoluta de pontos

#### 2. Substituir bloco Duo (linhas 306-344)

Remover `KickPanel` e `FighterMascot`. Novo layout:

**Background**: `bgMenuModos` com `opacity-[0.05]`, absolute, pointer-events-none

**Header (Barra de Tempo)**: Identico ao individual — barra `h-3` com trilho `bg-white/[0.08]`, glow neon dinamico (verde/amarelo/vermelho), timer `text-[6vh]` centralizado abaixo

**Arena Grid**: `grid grid-cols-12 gap-4 flex-1 items-center px-4`

- **Red (col-span-5)**: `border-l-4 border-red-500 bg-gradient-to-r from-red-500/10 to-transparent p-6 rounded-r-xl`. Score `text-[12vw] font-black italic text-red-500` com `drop-shadow` vermelho. Labels "HITS" e "CPM: {redCpm}" alinhados a esquerda. Brilho quando `flashSide === 'red'`

- **VS (col-span-2)**: "VS" em `text-4xl font-black text-white/20 italic`. Barra de cabo de guerra (`h-2 bg-white/10 rounded-full`) com indicador vermelho proporcional (`width: redPercent%`). Diferenca de pontos `+{diff}` colorida para quem lidera

- **Blue (col-span-5)**: Espelhado do vermelho — `border-r-4 border-blue-500 bg-gradient-to-l from-blue-500/10 to-transparent text-right`. Score azul com `drop-shadow` azul. Labels alinhados a direita

#### 3. Substituir footer Duo (linhas 350-364)

Nova barra tecnica: `bg-black/60 backdrop-blur border-t border-white/10 flex justify-between px-10 py-3`

- Esquerda: "Vermelho" em `text-red-500`
- Centro: indicador de conexao (bolinha verde + "Conectado")
- Direita: "Azul" em `text-blue-500`
- Atalhos: `[P] Pausar [ESC] Sair` em `text-white/30 font-mono text-xs`

#### 4. Remocoes

- Timer circular SVG do Duo (linhas 104-126) removido — substituido pela barra horizontal
- `showPauseHint` do Duo (linhas 129-135) removido — atalhos agora no footer
- Import de `KickPanel` e `FighterMascot` permanecem no arquivo (podem ser usados por outros modos), mas nao serao mais renderizados no Duo

#### 5. Efeitos

- Flash de impacto global: `inset box-shadow` branco quando `flashSide` ativo (mesmo do individual)
- Painel atingido recebe `scale-105` momentaneo via `transition-transform duration-100`
- Overlay de pausa do Duo permanece funcional com estilo `bg-[#0b1120]/90`

### Detalhes Tecnicos

**Calculos novos:**
```
const redCpm = elapsedSeconds > 0 ? Math.round((scores.red / elapsedSeconds) * 60) : 0;
const blueCpm = elapsedSeconds > 0 ? Math.round((scores.blue / elapsedSeconds) * 60) : 0;
const totalDuo = scores.red + scores.blue;
const redPercent = totalDuo > 0 ? (scores.red / totalDuo) * 100 : 50;
const bluePercent = totalDuo > 0 ? (scores.blue / totalDuo) * 100 : 50;
const scoreDiff = Math.abs(scores.red - scores.blue);
```

**Barra de cabo de guerra:**
```
<div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
  <div className="h-full bg-red-500 rounded-full transition-all duration-300"
       style={{ width: `${redPercent}%` }} />
</div>
```

**Glow nos paineis (flash):**
```
className={cn(
  "border-l-4 border-red-500 bg-gradient-to-r from-red-500/10 ...",
  flashSide === 'red' && "from-red-500/25 shadow-[inset_0_0_30px_rgba(239,68,68,0.3)]"
)}
```

### Arquivos alterados

- `src/components/game/GameScreen.tsx` — reescrita completa do bloco Duo + footer + remocao do timer circular

