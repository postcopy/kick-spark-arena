

# Simplificar Tela de Diagnostico de Hardware

## Objetivo

Transformar o painel de engenharia atual (685 linhas, com tabelas P90/P95, toggle RAW/IMPACTOS, amostras, sliders de sensibilidade) em um painel operacional limpo com apenas duas secoes.

## Novo Layout

### Secao 1: Monitor de Teste (topo)

Um card central mostrando o ultimo impacto detectado:
- Numero grande da forca (peakIntensity)
- Nome do equipamento usando o deviceMapping existente (ex: "Colete Azul", "Capacete Vermelho")
- Badge colorida com a classificacao baseada nos thresholds atuais:
  - Verde: "PONTO" (>= pointMin do equipamento)
  - Amarelo: "HIT" (>= 15 e < pointMin)
  - Cinza: "RUIDO" (< 15)
- Status de conexao USB e botao conectar/desconectar (mantido)

### Secao 2: Configuracao de Limiares (abaixo)

Quatro campos numericos (Input type="number") em grid 2x2:
- Colete - Forca Minima para PONTO (default: 20)
- Colete - Forca Minima para HIT (default: 15)
- Capacete - Forca Minima para PONTO (default: 20)
- Capacete - Forca Minima para HIT (default: 15)

Botao "SALVAR CONFIGURACAO" que chama `onThresholdsApplied` com os valores editados.

## O que sera removido

- Toggle RAW/IMPACTOS
- Tabela de eventos/impactos recentes
- Tabela de stats por device (P90, P95, MIN, MAX, AVG)
- Secao de amostras e NewSampleDialog
- Sliders de sensibilidade e presets (BAIXA/MEDIA/ALTA)
- Botoes de exportar JSON/CSV
- Botao "LIMPAR TUDO/EVENTOS/IMPACTOS"
- Calibracao de noise floor
- Avisos de escala observada

## Detalhes Tecnicos

### Arquivo: `src/components/championship/DiagnosticsDialog.tsx`

Reescrita completa do componente. Reducao de ~685 linhas para ~180 linhas.

**Props mantidas** (sem quebrar a interface):
- `open`, `onOpenChange` -- controle do dialog
- `diagnostics` -- para ler `uiRecentImpacts[0]` (ultimo impacto) e `thresholds` atuais
- `serialPort` -- para conectar/desconectar USB
- `onThresholdsApplied` -- callback para salvar thresholds

**State local simplificado**:
- `vestPointMin`, `vestHitMin`, `helmetPointMin`, `helmetHitMin` -- quatro numeros, inicializados dos `diagnostics.thresholds` atuais

**Classificacao do impacto** (funcao helper local):
```
function classifyImpact(peak, deviceId, thresholds):
  equipType = deviceId <= 2 ? 'vest' : 'helmet'
  pointMin = equipType === 'vest' ? thresholds.vestPointMin : thresholds.helmetPointMin
  if peak >= pointMin: return 'PONTO'
  if peak >= 15: return 'HIT'
  return 'RUIDO'
```

**Nome do equipamento** (funcao helper local usando deviceMapping):
```
deviceId 1 -> "Colete Azul"
deviceId 2 -> "Colete Vermelho"  
deviceId 3 -> "Capacete Azul"
deviceId 4 -> "Capacete Vermelho"
```

**Botao Salvar**: Monta o objeto `HardwareThresholds` e chama `diagnostics.setThresholds()` + `onThresholdsApplied()`.

### Arquivo: `src/components/championship/OperatorPanel.tsx`

Sem alteracoes na interface. O DiagnosticsDialog continua sendo chamado com as mesmas props.

### Imports removidos

Table, ScrollArea, ToggleGroup, Slider, NewSampleDialog, e icones nao usados (FileJson, FileSpreadsheet, Plus, Radio, etc.)

