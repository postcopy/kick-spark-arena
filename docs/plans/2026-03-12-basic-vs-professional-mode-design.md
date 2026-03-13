# Modo Básico vs Profissional — Design

## Problema

Muitos torneios não usam chaves (bracket) e preferem operar luta a luta de forma tradicional. O app atual força todos a passar pelo fluxo completo de torneio (categorias, chaves, atribuição de quadras), o que é desnecessário para eventos simples.

## Solução

Adicionar uma tela de seleção na home entre **Básico** e **Profissional**.

## Fluxo

### Home (ModeSelectorPage)

2 cards grandes lado a lado:

- **BÁSICO** — "Luta a luta, sem chaves". Ícone: Swords (vermelho). Clique → navega direto para `/championship/mat?mat=1` (modo standalone, sem torneio). O botão "ABRIR PLACAR TV" já existente no Mat permite projetar o placar.

- **PROFISSIONAL** — "Torneio com chaves e quadras". Ícone: Trophy (dourado). Clique → navega para `/professional` que mostra os 4 cards atuais (Central, Mat, TV, Chamada) com seleção de quadra.

### Fluxo Básico

```
Home → BÁSICO → /championship/mat?mat=1 (standalone)
                  └─ Botão "ABRIR PLACAR TV" → abre TV na mesma quadra
```

- 1 quadra apenas (mat=1 fixo)
- Sem torneio, sem chaves, sem categorias
- Operador configura luta manualmente (nomes, rounds, timer)
- TV sincroniza via BroadcastChannel

### Fluxo Profissional

```
Home → PROFISSIONAL → /professional (4 cards)
                        ├─ Central → /central
                        ├─ Mat → /championship/mat?mat=N
                        ├─ TV → /championship/tv?mat=N
                        └─ Chamada → /chamada
```

- Múltiplas quadras (1-7)
- Torneio completo com categorias, chaves, atribuição
- Central de comando, Chamada no aquecimento

## Arquitetura

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `ModeSelectorPage.tsx` | Reescrever: 2 cards (Básico / Profissional) |
| `ProfessionalSelectorPage.tsx` | **Novo** — os 4 cards atuais extraídos |
| `AppChampionship.tsx` | Adicionar rota `/professional` |

### O que NÃO muda

- ChampionshipMat.tsx (já suporta modo standalone)
- ChampionshipTV.tsx
- CentralPage.tsx
- ChamadaPage.tsx
- TournamentSetup.tsx
- Tipos, hooks, contextos

## Visual

### Home — 2 cards

```
┌──────────────────────────────────────────────────┐
│              [Logo SPE Sulsport]                 │
│         SISTEMA PROFISSIONAL DE EVENTOS          │
│                                                  │
│   ┌──────────────────┐  ┌──────────────────┐    │
│   │       ⚔          │  │       🏆         │    │
│   │     BÁSICO       │  │   PROFISSIONAL   │    │
│   │                  │  │                  │    │
│   │  Luta a luta,    │  │  Torneio com     │    │
│   │  sem chaves      │  │  chaves e quadras│    │
│   └──────────────────┘  └──────────────────┘    │
│                                                  │
│                    v1.0.0                        │
└──────────────────────────────────────────────────┘
```

### Profissional — 4 cards (layout existente)

```
┌──────────────────────────────────────────────────┐
│  ← Voltar     [Logo]    MODO PROFISSIONAL        │
│                                                  │
│   ┌──────────┐  ┌──────────┐                    │
│   │ CENTRAL  │  │   MAT    │                    │
│   └──────────┘  └──────────┘                    │
│   ┌──────────┐  ┌──────────┐                    │
│   │    TV    │  │ CHAMADA  │                    │
│   └──────────┘  └──────────┘                    │
└──────────────────────────────────────────────────┘
```
