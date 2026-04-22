# CLAUDE.md — Project Guidelines

Project-level behavioral guidelines for the SPE (S-FIGHT PRO Electron) codebase.

Scope: applies to all tasks in this repository unless explicitly overridden by a session-specific instruction. Global user guidelines (`~/.claude/CLAUDE.md`) take precedence when in conflict.

---

# Karpathy Guidelines (behavioral)

Behavioral guidelines to reduce common LLM coding mistakes. These principles apply to all tasks in this project unless explicitly overridden.

Source: https://github.com/forrestchang/andrej-karpathy-skills (MIT).

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

**Reference:** Full examples in `.spe/skills/karpathy/EXAMPLES.md` (cheatsheet of anti-patterns and fixes).

**Override policy:** In case of conflict between a session-specific instruction and a Karpathy principle, the AI asks before assuming override. Principles are defaults, not decoration.

---

# SPE — Contexto do projeto (leitura obrigatória)

## O que é o SPE
Software de pontuação eletrônica para competição de Taekwondo, rodando em hardware EngFlex. Modo competição (SPE) é separado do modo arcade (S-Fight). Meta de longo prazo: homologação WT.

## Stack
- Frontend: React 18 + TypeScript 5 + Vite + Tailwind
- Desktop: Electron 41 (Windows-first)
- Sync: Supabase Realtime + BroadcastChannel + IPC cross-window
- Hardware: Serial port (EngFlex receiver) → ImpactDetector → scoring

## Estado atual (atualizar quando mudar)
- **Branch default**: `master`
- **Testes**: 239 passando (`npm test`)
- **Pontuação via serial**: funcional (pipeline testado end-to-end)
- **Branches paralelos existentes**: `fix/wt-2026-compliance`, `redesign-ui-v2`, `redesign-kpnp-style`
- **Regras WT 2026**: PARCIALMENTE conformes. Ver pendências abaixo.

## Pendências conhecidas (ordenadas por prioridade)

### Funcional (prioridade sobre visual)
- Scoring WT 2026: `spinBody`=3 (deveria 4), `spinHead`=4 (deveria 6)
- `pointGap`=12 (WT 2026 = 15 a 20, confirmar)
- Regra anti-stalling (gam-jeom últimos 10s = +2pts) não implementada
- PMK/LMK firmware hardcoded
- Audit trail de gam-jeom sem `operatorId` nem `reason`

### Visual
- 22% de aderência à skill `spe-ui-design v2.0` (ver UI-AUDIT.md se existir no branch)
- Rajdhani em vez de Bebas/Anton/Inter
- 3 paletas competindo (`--sulsport-*`, `--sfight-*`, `--game-*`)
- Retângulos full-bleed coloridos (cartaz de bingo) em scoreboards

## Regras de ouro pra QUALQUER mudança

### Regra 1 — Funcional sempre antes de visual
Nunca redesenhar UI sobre lógica errada. Se há P0 funcional pendente, resolver primeiro em `fix/wt-2026-compliance`, depois UI sobre master já conforme.

### Regra 2 — Sempre branch + backup antes de mexer em UI
```bash
cp -r release-championship release-championship-backup-$(date +%Y%m%d-%H%M)
git checkout -b nome-do-branch
```
Nunca alterar UI em `master` direto.

### Regra 3 — Usar a skill `spe-ui-design` em todo trabalho visual
Skill disponível como `anthropic-skills:spe-ui-design`. Tokens, tipografia, anti-padrões e checklist pixel-perfect estão lá. Nunca inventar cor/fonte/espaçamento — consultar skill primeiro.

### Regra 4 — Testes antes de merge
`npm test` precisa passar antes de qualquer PR pra master. Bug encontrado em produção que o teste não pegou = escrever o teste antes do fix.

### Regra 5 — Preview build antes de publicar release
Nunca `npm run release:*` sem antes abrir o `release-championship/win-unpacked/SPE Sulsport.exe` e validar visualmente.

## Comandos úteis (slash commands deste projeto)

- `/spe-status` — diagnóstico em 10s (branch, testes, build, últimos commits)
- `/spe-redesign` — menu interativo com as 3 opções de redesign (sequencial / pragmático / surgical)

## Arquivos importantes

- `.spe/context.md` — filosofia do produto, restrições, escopo
- `.spe/skills/` — skills projeto-side (karpathy, ui-design)
- `AUDIT.md` (se existir) — diagnóstico funcional WT 2026
- `UI-AUDIT.md` (se existir) — aderência visual à skill v2.0
- `RELEASE.md` — como publicar nova versão

## Invariantes inegociáveis (da `.spe/context.md`)

1. **Confiabilidade** — erro em competição real custa medalha. Nada shippa sem validação.
2. **Paridade antes de inovação** — o que concorrente WT faz, SPE faz igual ou melhor antes de inovar.
3. **Homologação WT** — decisões hoje não fecham essa porta.
