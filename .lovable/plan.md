

# Plano: Adicionar Logo SPE nas Telas do Campeonato

## Objetivo
Adicionar a logo SPE branca em duas localizacoes:
1. **Mesa de Luta** (`/championship/mat`): No header, substituindo o texto "MESA DE LUTA • MAT 1"
2. **Placar TV** (`/championship/tv`): Centralizada acima do "MATCH" na coluna central

---

## Passo 1: Copiar a Logo para o Projeto

Copiar o arquivo `user-uploads://logo-SPE-branca.png` para `src/assets/logo-spe-branca.png`

---

## Passo 2: Modificar ChampionshipMat.tsx

**Localizacao**: Header (linhas 88-94)

**Antes**:
```tsx
<div className="flex items-center gap-4">
  <Trophy className="w-5 h-5 text-purple-500" />
  <h1 className="text-lg font-bold text-white uppercase">
    MESA DE LUTA • MAT {matId}
  </h1>
</div>
```

**Depois**:
```tsx
import logoSpe from '@/assets/logo-spe-branca.png';

// No header:
<div className="flex items-center gap-4">
  <img 
    src={logoSpe} 
    alt="SPE" 
    className="h-8 w-auto object-contain"
  />
</div>
```

O icone Trophy e o texto serao substituidos pela logo. A logo tera altura fixa de 32px (`h-8`) para caber no header de 56px.

---

## Passo 3: Modificar ChampionshipTV.tsx

**Localizacao**: Centro - acima do "MATCH" (linhas 174-181)

**Antes**:
```tsx
{/* MATCH header + number */}
<div className="flex-1 flex flex-col items-center justify-center border-b border-[hsl(var(--sulsport-gray))]">
  <span className="text-2xl font-bold text-white uppercase tracking-[0.3em]">MATCH</span>
  <span className="text-4xl font-bold text-white tabular-nums">
    {state.config.matchNumber || '001'}
  </span>
</div>
```

**Depois**:
```tsx
import logoSpe from '@/assets/logo-spe-branca.png';

{/* Logo SPE + MATCH header + number */}
<div className="flex-1 flex flex-col items-center justify-center border-b border-[hsl(var(--sulsport-gray))]">
  {/* Logo SPE - Centralizada acima do MATCH */}
  <img 
    src={logoSpe} 
    alt="SPE" 
    className="h-12 w-auto object-contain mb-4"
  />
  <span className="text-2xl font-bold text-white uppercase tracking-[0.3em]">MATCH</span>
  <span className="text-4xl font-bold text-white tabular-nums">
    {state.config.matchNumber || '001'}
  </span>
</div>
```

A logo tera altura de 48px (`h-12`) e margem inferior (`mb-4`) para separar visualmente do texto "MATCH".

---

## Arquivos Modificados

| Arquivo | Acao |
|---------|------|
| `src/assets/logo-spe-branca.png` | COPIAR do upload do usuario |
| `src/pages/ChampionshipMat.tsx` | EDITAR - Substituir header por logo |
| `src/pages/ChampionshipTV.tsx` | EDITAR - Adicionar logo acima do MATCH |

---

## Resultado Visual Esperado

### Mesa de Luta (Header)
```text
+----------------------------------------------------------+
| [LOGO SPE]                        USB | STATUS | ROUND 1 |
+----------------------------------------------------------+
```

### Placar TV (Coluna Central)
```text
+----------------+
|                |
|   [LOGO SPE]   |
|                |
|     MATCH      |
|      001       |
|                |
+----------------+
```

---

## Criterios de Aceite

| # | Criterio |
|---|----------|
| 1 | Logo aparece no header da Mesa de Luta |
| 2 | Logo aparece centralizada acima de MATCH no Placar TV |
| 3 | Logo esta bem dimensionada e proporcional em ambas as telas |
| 4 | Importacao ES6 usada para melhor otimizacao |

