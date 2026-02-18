

# Redesign de Layout: Tela Final Widescreen (Dashboard Split)

## Resumo

Refatorar o ArcadeFinishedScreen de um layout de coluna unica centralizada para um layout "Widescreen Split" com duas colunas horizontais, preenchendo a tela 16:9 com estetica de transmissao E-Sports profissional.

---

## Arquivo Alterado

| Arquivo | Tipo |
|---------|------|
| `src/components/game/ArcadeFinishedScreen.tsx` | Refatoracao de layout CSS/Tailwind |

---

## Alteracoes Detalhadas

### 1. Container Principal (linhas 48-49)
- **Antes**: `flex flex-col items-center justify-center p-6` (coluna unica centralizada)
- **Depois**: `w-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col justify-center h-full`
- Manter `bg-[#0b1120]` e overlays existentes

### 2. Grid Principal de 2 Colunas (novo wrapper — linhas 69-235)
Substituir o `div.relative.z-10.text-center` por um grid dividido:

```text
+-----------------------------------------------+
|  COLUNA ESQUERDA (3/5)  |  COLUNA DIREITA (2/5) |
|                         |                       |
|  Header Badge           |  DETALHES DOS ROUNDS  |
|  Trofeu Gigante         |  (tabela data grid)   |
|  VERMELHO / AZUL        |  Round 1: 45 — 0 ZERO!|
|  CAMPAO DO DUELO!       |  Round 2: 12 — 30     |
|  Placar: 2 x 1          |  Round 3: 0 — 55 ZERO!|
|                         |                       |
+-----------------------------------------------+
|         BOTOES DE ACAO (largura total)          |
+-----------------------------------------------+
```

Estrutura:
```
<div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 w-full items-stretch relative z-10">
  <div className="lg:col-span-3 ...">  <!-- Emocao -->
  <div className="lg:col-span-2 ...">  <!-- Dados -->
</div>
```

### 3. Coluna Esquerda (Emocao — lg:col-span-3)
Mover para ca e alinhar a esquerda em desktop:
- Header badge ("CORRIDA DE DEMOLICAO")
- Trofeu com glow (manter tamanhos atuais com clamp/vmin)
- Titulo do vencedor (VERMELHO/AZUL/EMPATE)
- Subtitulo "CAMPEO DO DUELO!"
- Placar central (redWins x blueWins)
- Classes: `flex flex-col justify-center items-center lg:items-start text-center lg:text-left`
- O gradiente radial do vencedor deve focar nesta coluna

### 4. Coluna Direita (Dados — lg:col-span-2)
Mover para ca a tabela "DETALHES DOS ROUNDS":
- Remover `max-w-lg mx-auto` do container da tabela
- Adicionar `h-full` ou `min-h-[300px]` para esticar verticalmente
- Manter estilo `bg-[#0b1120]/80 border border-white/10 backdrop-blur-sm rounded-xl`
- Classes da coluna: `flex flex-col justify-center`

### 5. Botoes de Acao (fora do grid, abaixo)
Mover botoes e hint do SPACE para fora do grid principal:
- Container: `flex flex-col sm:flex-row gap-3 justify-center mt-8 relative z-10`
- Manter estilos existentes dos botoes
- Hint SPACE centralizado abaixo

---

## O Que NAO Muda

- Logica de estado (winner, redWins, blueWins, rounds)
- Efeitos sonoros (play victoryRed/Blue/victory)
- Componente Confetti
- Gradientes radiais (apenas reposicionamento visual)
- Props e callbacks (onPlayAgain, onBackToMenu)
- Responsividade mobile (coluna unica em telas < lg)

---

## Resumo Tecnico

- 1 arquivo alterado
- 0 arquivos novos
- Apenas CSS/Tailwind, nenhuma mudanca de logica
- Responsivo: coluna unica em mobile, split 3/5 + 2/5 em lg+
- Segue padrao vmin/clamp para Kiosk Mode

