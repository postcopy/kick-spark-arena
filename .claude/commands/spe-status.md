---
description: Diagnóstico rápido do SPE. Mostra branch atual, status dos testes, build, TypeScript e últimos commits em 10 segundos. Use no começo de toda sessão pra saber onde parou.
allowed-tools: Bash
---

# /spe-status — Onde estou no SPE?

Você está em **modo diagnóstico rápido do SPE**. Sua única tarefa é mostrar o estado atual do projeto em menos de 10 segundos.

## O que fazer

Execute em paralelo (single message com múltiplos Bash calls):

1. `git branch --show-current` → qual branch
2. `git log --oneline -5` → últimos 5 commits
3. `git status --short | head -20` → arquivos modificados
4. `git branch | head -15` → todos os branches
5. `npx tsc --noEmit 2>&1 | tail -3` → TypeScript compila?
6. `cat package.json | grep '"version"' | head -1` → versão atual
7. `ls -la release-championship/*.exe 2>/dev/null | tail -3` → últimos builds

**NÃO rode `npm test` aqui** — é lento. Só se o usuário pedir explicitamente.

## Formato de saída

Tabela compacta:

```
SPE • v1.4.9 • branch: master
─────────────────────────────────────────
Modificações:     5 arquivos uncommitted
TypeScript:       ✅ exit 0
Último commit:    6ffabbe feat(ux): apply Claude Design handoff
Branches:         master, fix/wt-2026-compliance, redesign-ui-v2, redesign-kpnp-style
Último build:     SPE-Sulsport-Setup-1.4.9.exe (14/04 13:35)
```

Depois, em uma frase: "Você parou em [contexto]. Próximo passo sugerido: [ação]."

Use o CLAUDE.md do projeto como fonte pra sugerir próximo passo (ex: "há P0 funcional pendente em WT 2026, talvez você quisesse resumir pelo branch `fix/wt-2026-compliance`").

## Regra

- Nunca mude código neste comando
- Nunca modifique arquivos
- Se algum comando falhar, reporta mas continua os outros
- Mensagem final **curta** — se o usuário quer mais detalhe, pede
