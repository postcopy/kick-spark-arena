

# Redesign de Layout: Setup Widescreen (Dashboard Mode)

## Resumo

Refatorar o ArcadeSetupScreen de um layout de coluna unica estreita (max-w-2xl) para um dashboard widescreen (max-w-6xl) com grids horizontais, preenchendo a tela 16:9 de forma profissional.

---

## Arquivo Alterado

| Arquivo | Tipo |
|---------|------|
| `src/components/game/ArcadeSetupScreen.tsx` | Refatoracao de layout CSS/Tailwind |

---

## Alteracoes Detalhadas

### 1. Container Principal (linha 119)
- **Antes**: `max-w-2xl mx-auto` (coluna estreita)
- **Depois**: `max-w-6xl mx-auto w-full`
- Remover `space-y-3 md:space-y-4` (o spacing sera gerenciado pelos grids internos)

### 2. Cartoes de Intensidade (linhas 121-151)
- **Antes**: `grid grid-cols-3 gap-3` (ja e horizontal mas comprimido pela max-w-2xl)
- **Depois**: `grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6`
- Adicionar `h-full` nos botoes de preset para altura igual
- Aumentar padding interno: `p-4` para `p-4 md:p-6`
- Icones maiores em desktop: `w-8 h-8 md:w-10 md:h-10`

### 3. Controles de Tempo e Formato (linhas 153-223)
Agrupar os 3 paineis (Tempo, Formato, Intervalo) em um unico container com grid horizontal:

```
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
  <!-- Coluna Esquerda: Slider de Tempo do Round -->
  <!-- Coluna Direita: Formato (Rapido/Melhor de 3) + Intervalo (condicional) -->
</div>
```

- O container externo tera: `bg-slate-900/50 p-4 md:p-6 rounded-xl border border-white/5`
- Coluna esquerda: Slider de Tempo (como esta, sem o wrapper bg individual)
- Coluna direita: Formato + Intervalo empilhados verticalmente (sem wrappers bg individuais)
- Remover os `bg-white/5 border border-white/10` dos paineis internos (o container externo assume esse papel)

### 4. Rodape: Regras + Botao (linhas 225-261)
Reorganizar em grid horizontal:

```
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-end">
  <!-- md:col-span-2: Card de Regras (largo) -->
  <!-- md:col-span-1: Botao Iniciar + Voltar (empilhados ou lado a lado) -->
</div>
```

- Regras ocupam 2/3 da largura em desktop
- Botao "INICIAR DUELO" ocupa 1/3, com altura maior: `h-14 md:h-16 text-lg md:text-xl`
- Botao "Voltar" fica acima do Iniciar ou como link discreto
- Hint do SPACE fica abaixo do botao

### 5. Footer fixo (linhas 238-262)
- Mover de `footer` separado para dentro do grid de Regras+Botao
- Ou manter como footer mas com `max-w-6xl` em vez de `max-w-md`

---

## O Que NAO Muda

- Nenhuma logica de estado (selectedPreset, selectPreset, handleStart, etc.)
- Props do componente
- Valores dos presets (INTENSITY_PRESETS, BEST_OF_OPTIONS)
- Comportamento do slider
- Integracao com SoundContext

---

## Resumo Tecnico

- 1 arquivo alterado
- 0 arquivos novos
- Apenas CSS/Tailwind, nenhuma mudanca de logica
- Responsivo: coluna unica em mobile, dashboard em md+
- Segue padrao max-w-6xl para preencher tela 16:9

