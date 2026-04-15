# .spe/SESSIONS.md — Log de decisões de processo e marcos

**Propósito:** registrar decisões importantes que mudam a forma como o trabalho é feito no projeto SPE. Não é log de tasks individuais (isso é papel dos commits), e sim de **processo** — adoção de guidelines, mudanças de política, incidentes que geraram aprendizado, reset de rumo.

Convenção: entradas em ordem reversa cronológica (mais recente primeiro), cada uma com data + resumo + razão.

---

## 2026-04-15 — Adoção das Karpathy Guidelines

**O que:** instalação das 4 guidelines comportamentais (Think Before Coding, Simplicity First, Surgical Changes, Goal-Driven Execution) como processo default do projeto.

**Artefatos criados neste commit:**
- `CLAUDE.md` raiz — guidelines injetadas como contexto em toda task
- `.spe/skills/karpathy/SKILL.md` — skill instalável invocável explicitamente ("aplique karpathy nesta task")
- `.spe/skills/karpathy/EXAMPLES.md` — cheatsheet de anti-padrões com código wrong/right

**Razão — incidentes recentes que motivaram a adoção:**

1. **Commit inflated em A.2 (fix/wt-2026-compliance, 6d30ec6)** — commit de escopo "adicionar rulesetVersion" acabou carregando WIP de Stage B e Sprint 2 acidentalmente. Precisou `git reset --soft` + cirurgia manual pra isolar A.2 puro em `74a65df`. Violação direta do princípio #3 (Surgical Changes).

2. **"Verde fabricado" em A.1 — WT-LEGACY-2022 scoring (fix/wt-2026-compliance)** — valores `spinBody=2, spinHead=3` no preset e `expect(spinHead).toBe(3)` no teste estavam coerentemente errados (teste espelhava impl errada). Passou verde mas sem validar regra WT. Fix em `704f744`. Violação do princípio #4 (Goal-Driven Execution — test-sem-contrato-claro vira verde fabricado).

3. **Scope creep do WIP de sessão anterior** — championship.ts e useChampionshipSync.ts chegaram na sessão com 667 e 95 linhas de diff "órfãos" de sessões anteriores não documentadas. Levou a procedimento custoso de backup + cirurgia + restore (documentado em `.spe/WIP_PRESERVED.md`). Violação preventiva do princípio #1 (Think Before Coding — não identificamos assunções sobre o estado do working dir).

4. **A.2 v1 com CDN rejeitado (redesign-ui-v2, 9a361d9)** — commit anterior carregou fontes via Google Fonts CDN como "workaround temporário". Decisão silenciosa de tradeoff (offline vs speed) que Felipe vetou. Reset + redo com woff2 locais em `4771b90`. Violação do princípio #1 (não surfaceamos o tradeoff antes de decidir).

**Política de override:** em conflito entre instrução pontual (Felipe ou outro contexto) e um princípio Karpathy, a AI pergunta antes de assumir override. Princípios são defaults, não decoração.

**Efeito esperado:**
- Commits mais atômicos (surgical changes)
- Menos "commit inflated" por arrastar WIP
- Mais perguntas antes de implementação, menos rework depois
- Testes com critério de sucesso claro, não meramente verdes

**Fonte:** https://github.com/forrestchang/andrej-karpathy-skills (MIT).

---
