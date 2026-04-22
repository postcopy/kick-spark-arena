---
description: Menu interativo para continuar o redesign UI do SPE. Apresenta 3 opções (sequencial, pragmático, surgical), cria branch + backup automaticamente, carrega skill spe-ui-design. Use quando quiser mexer em qualquer elemento visual do SPE.
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion, Skill
---

# /spe-redesign — Continuar o redesign UI do SPE

Você está agora em **modo redesign UI do SPE**. Sua tarefa é conduzir o usuário pelo caminho mais seguro pra aplicar a skill `spe-ui-design v2.0` sem quebrar produção.

## Regras inegociáveis

1. **NUNCA** tocar código em `master`. Sempre branch isolado.
2. **SEMPRE** backup de `release-championship/` antes de compilar nova versão.
3. **SEMPRE** carregar skill `spe-ui-design` antes de escrever qualquer CSS/JSX visual.
4. **NUNCA** pular a regra "funcional antes de visual" (se há P0 WT 2026 pendente, avisar).
5. **SEMPRE** preview build separado — zero risco em produção.

## Fluxo

### Passo 1 — Diagnóstico inicial

Execute em paralelo:
- `git branch --show-current` (qual branch)
- `git status --short | wc -l` (quantos arquivos modificados)
- `git branch | grep -E "redesign|fix" | wc -l` (quantos branches de trabalho)

Mostra estado em 2 linhas. Se branch ≠ `master`, avisa.

### Passo 2 — Alerta funcional vs visual

Se `git log --all --oneline | grep -iE "WT 2026|spinHead|pointGap|anti-stalling" | wc -l` retornar 0, significa que P0 funcional não foi feito ainda. Avisar:

> ⚠ Regras WT 2026 ainda não aplicadas. Redesign UI sobre lógica errada é risco.
> Recomendado: resolver `fix/wt-2026-compliance` primeiro.
> Quer seguir mesmo assim?

Se usuário confirmar que quer seguir, continua. Se não, sugere retomar AUDIT funcional.

### Passo 3 — Escolha do caminho (AskUserQuestion)

Use `AskUserQuestion` com 3 opções:

**Opção A — Disciplinado (sequencial, ~2 semanas)**
- Audit completo → Proposal → Execução em fases A/B/C/D
- Cada fase gera preview build, usuário aprova antes da próxima
- Maior rigor, menor risco

**Opção B — Pragmático (skill direta, ~1 semana)**
- Pula audits formais, aplica skill v2.0 em ordem: tokens → ScoreboardTV → ChampionshipMat → modais → estados
- Backup + branch automático, preview a cada fase
- Balanço entre velocidade e segurança

**Opção C — Surgical (1 tela, ~4-6h)**
- Redesenha UMA tela crítica (ScoreboardTV por padrão) em branch próprio
- Compara lado a lado com produção atual
- Teste de hipótese antes de investir em redesign completo

### Passo 4 — Execução do caminho escolhido

**Comum a todos os caminhos:**

```bash
# Backup
cp -r release-championship release-championship-backup-$(date +%Y%m%d-%H%M)
```

**Opção A — cria branch `redesign-ui-v2` se não existir, checkout. Depois:**

```
Inicie AUDIT de aderência.
Leia skill spe-ui-design v2.0 via Skill tool.
Gere UI-AUDIT.md na raiz mapeando file:line.
NÃO modifique código.
PARE ao final e aguarde OK do usuário.
```

**Opção B — cria branch `redesign-ui-v2` se não existir, checkout. Depois:**

```
Invoque skill spe-ui-design via Skill tool.
Fase 1: migrar tokens em src/index.css + tailwind.config.ts + src/fonts/fonts.css.
- Criar --ink-0..8, --chung, --hong, --gold-*, semânticas
- Adicionar Bebas Neue + Anton via Google Fonts
- Manter --sulsport-* como alias temporário (compat)
Não tocar componentes ainda.
No final: npm test + npx tsc --noEmit. Preview build via npm run electron:build:championship.
PARE e peça aprovação antes da Fase 2.
```

**Opção C — cria branch `redesign-ui-tv`, checkout. Depois:**

```
Invoque skill spe-ui-design via Skill tool.
Redesenhe APENAS src/pages/ChampionshipTV.tsx seguindo seção 3.1 da skill.
Não tocar outros componentes. Se precisar token novo, inline no próprio componente por enquanto.
Preview build. Mostra print/comparação lado a lado com produção.
```

### Passo 5 — Comandos de preview

Após implementação, rode:

```bash
npx tsc --noEmit
npm test
npm run electron:build:championship
```

Se tudo OK, aponte o caminho do preview .exe (em `release-championship/win-unpacked/SPE Sulsport.exe`).

Se falhar: reporta o erro exato, não tenta consertar sozinho em mudança estrutural de design.

### Passo 6 — Próximos passos

Depois que o usuário testa o preview:
- **Aprovou:** commit no branch, pergunta se quer abrir PR pra master ou seguir pra próxima fase
- **Reprovou parcialmente:** ajusta só o que foi reprovado
- **Reprovou total:** descarta branch com `git branch -D`, sem tocar master

## Comunicação

- Use português brasileiro (usuário é brasileiro)
- Seja conciso — usuário é CTO, não precisa de explicação longa
- Se bloqueado, PERGUNTA. Nunca assumir em decisão visual estratégica.
- Cite file:line quando referenciar código

## Proibições absolutas

- Não rodar `npm run release:*` neste comando (publicação é `/spe-release`)
- Não mexer em firmware (`firmware/`)
- Não mexer em modo S-Fight (arcade — escopo separado)
- Não criar commits sem pedir permissão explícita
