

# Presets de Sensibilidade (Baixa, Media, Alta)

## Resumo

Adicionar 3 botoes de preset acima dos sliders no card "SENSIBILIDADE" do DiagnosticsDialog. Cada preset ajusta os 4 sliders de uma vez, respeitando a regra `sensPoint <= sensHit`.

## Valores dos presets

| Preset | HIT (colete/capacete) | PONTO (colete/capacete) |
|--------|----------------------|------------------------|
| Baixa  | 30                   | 15                     |
| Media  | 50                   | 35                     |
| Alta   | 80                   | 60                     |

- "Baixa" = menos sensivel, exige golpes mais fortes
- "Alta" = mais sensivel, detecta golpes mais leves
- Os valores de PONTO sao sempre menores que HIT, mantendo a invariante

## Mudanca na UI

Tres botoes em linha (estilo toggle/chip) logo abaixo do titulo "SENSIBILIDADE" e acima do aviso de calibracao. O preset ativo fica destacado. Se o operador ajustar manualmente qualquer slider, o destaque do preset some (estado "custom").

## Detalhes tecnicos

### Arquivo: `src/components/championship/DiagnosticsDialog.tsx`

**Adicionar:**
- Constante com os 3 presets e seus valores
- Estado `activePreset` (null | 'low' | 'mid' | 'high')
- Funcao `applyPreset(preset)` que seta os 4 sliders de uma vez
- Nos handlers dos sliders, setar `activePreset = null` (custom)
- 3 botoes entre o CardHeader e o aviso de calibracao, com estilo condicional para o preset ativo

```text
Linha ~563 (apos CardTitle, antes do CardContent.space-y-4):

[  BAIXA  ] [  MEDIA  ] [  ALTA  ]
```

Estilo: botoes pequenos com borda, o ativo recebe fundo verde (sulsport-green). Inativos ficam com borda cinza.

