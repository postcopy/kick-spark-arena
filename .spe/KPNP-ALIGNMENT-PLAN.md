# SPE ↔ KPNP Alignment Plan

**Fonte:** https://www.kpnp.uk/pss-operation-manual/
**Objetivo:** Operador treinado em KPNP PSS transita pro SPE sem reaprender nada crítico.
**Escopo compartilhado:** `src/components/championship/QuickMatchLayout.tsx` é usado por competição (`competitionMode=true`) **E** treino. Toda melhoria aparece nos dois modos automaticamente.

---

## Status (2026-04-24)

| Fase | Status | Commit |
|------|--------|--------|
| A — Terminologia + atalhos visíveis + tooltips | ✅ FEITO | `6cb56c5` |
| B.1 — Event log + Score adjust + Mute toggle no header | ✅ FEITO | `5b80c6a` |
| B.2 — Categoria visível (wire `categoryLabel`) | ⏳ TODO | — |
| B.3 — Reverse Sides | ✅ FEITO | (próximo commit) |
| B.4 — FOB On/Off toggle | ✅ FEITO | (próximo commit) |
| B.5 — PSS Hit Level UI | ✅ FEITO | (próximo commit) |
| B.6 — Test Mode (KPNP) | ✅ FEITO (pré-existente + tooltip) | `HardwareTestOverlay` |
| C — Record Paper / IVR / Equipment Registration | 📋 BACKLOG | — |

---

## Tabela de equivalência KPNP ↔ SPE

| KPNP PSS (16 controles) | SPE hoje | Ação |
|-------------------------|----------|------|
| Shijak | `INICIAR` (␣) | ✅ Subtítulo SHIJAK adicionado (Fase A) |
| Kal-yeo | `PAUSAR` (␣) | ✅ Subtítulo KAL-YEO adicionado (Fase A) |
| Kyeshi | `T. MÉDICO` (M) | ✅ Renomeado KYESHI · MÉDICO (Fase A) |
| Completion | `ENCERRAR LUTA` | ✅ Tooltip (Fase A) |
| Reverse (undo) | `DESFAZER` (⌫) | ✅ Tooltip (Fase A) |
| Test Mode | Faltando | ⏳ Fase B — modo de teste de hardware |
| Doctor | `T. MÉDICO` | ✅ Mesma função |
| Record Paper | Faltando | 📋 Fase C — export PDF summary |
| IVR Chung / IVR Hong | Faltando | 📋 Fase C — Instant Video Review workflow |
| FOB On/Off | Faltando | ⏳ Fase B — toggle de exibição TV |
| Reverse Sides | Faltando | ⏳ Fase B — trocar CHUNG↔HONG no placar |
| Rule Setup | `MatchConfigDialog` | ✅ Já existe |
| Registration | `TournamentSetup` | ✅ Já existe (parcial) |
| Equipment status | `HardwarePanel` (sidebar) | ⚠️ Removido com sidebar — Fase B |
| PSS status + battery | `HardwarePanel` | ⚠️ Mesmo problema — Fase B |
| PSS Hit Level | Config serial (#COOLDOWN) | ⏳ Fase B — UI no MatchConfigDialog |

---

## Atalhos (SPE já match KPNP)

| Ação | SPE | KPNP |
|------|-----|------|
| Shijak / Kal-yeo | `␣` Space | Botão físico |
| Ponto CHUNG (1/2/3/4/6) | `1`–`5` | Botões físicos |
| Ponto HONG | `⇧`+`1`–`5` | Botões físicos |
| Gam-jeom CHUNG/HONG | `F1` / `F2` | Botões físicos |
| Próximo round | `N` | Avanço automático |
| Kyeshi (médico) | `M` | Botão físico |
| Reverse (undo) | `Ctrl+Z` / `⌫` | Botão físico |

**Legenda fixa no rodapé** do QuickMatchLayout (sempre visível, não só em HelpDialog) — feito Fase A.

---

## Fase A — FEITO (não commitado)

Arquivo: `src/components/championship/QuickMatchLayout.tsx`

1. Botão principal virou 2 linhas: label PT + subtítulo KO (SHIJAK / KAL-YEO)
2. `StatusPill MEDICAL` → "KYESHI · MÉDICO"
3. Rodapé com legenda de 7 atalhos (sempre visível)
4. `title=` em INICIAR/PAUSAR, RESET, PRÓX.R, DESFAZER, ENCERRAR com equivalência KPNP
5. `SmallBtn` aceita prop `title`
6. `PRÓX. R` ganhou `<Kbd>N</Kbd>` visível

**Validação:** `npx tsc --noEmit` clean, `npm test` 268/268 passing.

---

## Fase B — TODO

Objetivo: recuperar o que foi perdido com a remoção do `OperatorPanel` sidebar e completar os 16 controles KPNP.

### B.1 — Recuperar features da sidebar removida

Ao trocar a UI de competição pra layout unificado com treino, perdemos (acesso direto a):
- Diagnóstico de hardware (devices, RSSI, bateria)
- Shadow log (histórico de eventos serial)
- Mute global de som
- Botão "ajustar placar manualmente"

**Solução proposta:** botão único `⚙` (engrenagem) no header do QuickMatchLayout que abre um `Sheet`/drawer lateral com abas: Hardware · Log · Áudio · Placar Manual.

Arquivos: `QuickMatchLayout.tsx` (header), novo `OperatorDrawer.tsx`.

### B.2 — Categoria visível (competição)

Wire prop `categoryLabel` que já existe na interface. No `ChampionshipMat.tsx`, ler de `tournamentHook.tournament.currentCategory` ou similar e passar pro `QuickMatchLayout`.

### B.3 — Reverse Sides (KPNP: trocar CHUNG↔HONG)

Botão no drawer B.1, aba Placar. Swap dos atletas + scores. Gera evento `SIDES_REVERSED` no log.

### B.4 — FOB On/Off (exibição TV)

Toggle no drawer que controla visibilidade de elementos "fancy" na TV (logo federação, rodapé, etc). Persist em localStorage.

### B.5 — PSS Hit Level

UI slider/stepper no `MatchConfigDialog` aba Hardware. Envia `#COOLDOWN <ms>` pro receptor. Valor atual do firmware: 200ms anti-dupla.

### B.6 — Test Mode

Nova rota `/championship/test` ou modal no ChampionshipHub: recebe HITs do hardware sem scoring, só mostra device/level/timestamp. Útil pra setup pré-competição.

---

## Fase C — BACKLOG

### C.1 — Record Paper (KPNP gera folha oficial)

PDF export ao final da luta: placar por round, eventos com timestamp, gam-jeoms com motivo, vencedor, assinatura do juiz. Lib: `pdf-lib` ou `jspdf`. Template baseado em folha WT oficial.

### C.2 — IVR (Instant Video Review)

Fluxo:
1. Técnico pede IVR → operador clica `IVR CHUNG` ou `IVR HONG`
2. Estado `IVR_PENDING` trava scoring
3. Overlay na TV: "REVISÃO DE VÍDEO — CHUNG"
4. Decisão: `ACEITO` (aplica ponto) ou `REJEITADO` (gam-jeom ao requerente se WT exigir)
5. Log completo: timestamp, requester, decisão, motivo

Componente novo: `IVRDialog.tsx` + state machine estendida em `useMatchState`.

### C.3 — Equipment Registration UI

Associar serial dos coletes/capacetes aos atletas. Hoje manual via comando serial. Nova tela em `TournamentSetup` ou `ChamadaPage`.

### C.4 — Status labels estruturadas

KPNP mostra estado granular: "LIGADO · REGISTRADO · CALIBRADO · ATIVO". SPE hoje: só ON/OFF. Expandir `HardwarePanel` (dentro do drawer B.1).

---

## Invariantes (não quebrar)

1. **Treino e competição compartilham UI** — toda mudança em `QuickMatchLayout.tsx` aparece nos dois modos.
2. **Atalhos KPNP-compatible** — `␣ 1-5 ⇧1-5 F1 F2 N M ⌫` são sagrados.
3. **CHUNG esquerda, HONG direita** — convenção WT, nunca inverter sem toggle explícito (B.3).
4. **Testes verdes antes de commit** — `npm test` precisa ficar em 268+ passing.
5. **Karpathy §3** — mudanças cirúrgicas, não refatorar adjacente.

---

## Como continuar após compactação

Se a próxima sessão perder contexto, ler este arquivo + `.spe/SESSIONS.md` + `CLAUDE.md` e retomar pela Fase B.1 (drawer operador).

**Comandos de retomada:**
```bash
cd "C:/Users/User/Documents/JOGOS TAEKWONDO/kick-spark-arena-main"
git status                    # ver Fase A não commitada
npm test -- --run             # confirmar 268 passing
npx tsc --noEmit              # confirmar TS clean
```

---

## Changelog

- **2026-04-24** — v1.0 criado. Fase A entregue (não commitada). Plano persistente pós-KPNP manual review.
