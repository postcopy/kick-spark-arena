

# Ajuste na validacao dos sliders de sensibilidade

## Mudanca

Simplificar a logica de validacao dos sliders para usar uma unica regra clara:

**Regra: `sensPoint <= sensHit` (PONTO exige mais forca, logo menos sensivel)**

- Ao mudar HIT: se `sensPoint > sensHit`, entao `sensPoint = sensHit`
- Ao mudar PONTO: se `sensPoint > sensHit`, entao `sensHit = sensPoint`

Isso substitui qualquer logica baseada em "subiu/desceu" por uma verificacao direta da invariante apos cada mudanca.

## Detalhes tecnicos

### Arquivo: `src/components/championship/DiagnosticsDialog.tsx`

Nos handlers dos sliders de sensibilidade (que serao criados na implementacao dos sliders), usar:

```typescript
const handleVestHitSens = (val: number) => {
  setVestHitSens(val);
  if (vestPointSens > val) setVestPointSens(val);
};

const handleVestPointSens = (val: number) => {
  setVestPointSens(val);
  if (val > vestHitSens) setVestHitSens(val);
};

// Idem para helmet
const handleHelmetHitSens = (val: number) => {
  setHelmetHitSens(val);
  if (helmetPointSens > val) setHelmetPointSens(val);
};

const handleHelmetPointSens = (val: number) => {
  setHelmetPointSens(val);
  if (val > helmetHitSens) setHelmetHitSens(val);
};
```

A condicao e sempre `sensPoint > sensHit` -- corrige o outro slider apenas quando a regra e violada.

Este ajuste sera aplicado junto com a implementacao completa dos sliders (que ja foi aprovada anteriormente).

