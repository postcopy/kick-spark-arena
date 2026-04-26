# CLAUDE.md — SPE Project Guidelines

Behavioral guidelines for the SPE (S-FIGHT PRO Electron) codebase.

Scope: applies to all tasks in this repository. Global user guidelines (`~/.claude/CLAUDE.md`) — incluindo os 4 Princípios de execução — aplicam-se aqui também e têm precedência em conflitos.

---

## O que é o SPE

Software de pontuação eletrônica para competição de Taekwondo, rodando em hardware EngFlex. Modo competição (SPE) é separado do modo arcade (S-Fight). Meta de longo prazo: homologação WT.

## Stack

- Frontend: React 18 + TypeScript 5 + Vite + Tailwind
- Desktop: Electron 41 (Windows-first)
- Sync: Supabase Realtime + BroadcastChannel + IPC cross-window
- Hardware: Serial port (EngFlex receiver) → ImpactDetector → scoring

## Estado dinâmico (não persistir aqui)

- Status atual (branch, testes, build): rodar `/spe-status`
- Pendências funcionais (WT 2026): ver [`AUDIT.md`](./AUDIT.md)
- Pendências visuais (skill v2.0): ver [`UI-AUDIT.md`](./UI-AUDIT.md)

## Invariantes inegociáveis

1. **Confiabilidade** — erro em competição real custa medalha. Nada shippa sem validação.
2. **Paridade antes de inovação** — o que concorrente WT faz, SPE faz igual ou melhor antes de inovar.
3. **Homologação WT** — decisões hoje não fecham essa porta.

## Regras de ouro pra QUALQUER mudança

### Regra 1 — Funcional sempre antes de visual
Nunca redesenhar UI sobre lógica errada. Se há P0 funcional pendente em `AUDIT.md`, resolver primeiro em branch dedicado, depois UI sobre master já conforme.

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

## Comandos do projeto

- `/spe-status` — diagnóstico em 10s (branch, testes, build, últimos commits)
- `/spe-redesign` — menu interativo com as 3 opções de redesign (sequencial / pragmático / surgical)
- `/spe-release` — publicar nova versão no GitHub Releases

## Arquivos importantes

- [`AUDIT.md`](./AUDIT.md) — pendências funcionais (WT 2026 + segurança + reliability)
- [`UI-AUDIT.md`](./UI-AUDIT.md) — aderência visual à skill `spe-ui-design v2.0`
- `.spe/context.md` — filosofia do produto, restrições, escopo
- `.spe/skills/` — skills projeto-side (ui-design)
- `RELEASE.md` — como publicar nova versão
