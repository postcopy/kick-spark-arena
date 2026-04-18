# USABILITY_CHANGES — rodada 18/abr/2026

Contexto para o Claude Code sobre **o que mudou no protótipo e por quê**. Use isso para calibrar o tom ao aplicar no código real.

## Critérios aplicados

1. **Simplicidade radical** — uma criança de 10 anos deve conseguir usar sem treinamento.
2. **Máximo 3 cliques** para qualquer ação principal.
3. **Linguagem clara** — zero jargão técnico na UI.
4. **Feedback visual imediato** — toda ação de salvar/confirmar mostra sucesso.

## Decisões-chave

### Linguagem
| ❌ Técnico | ✅ Humano |
|---|---|
| "Pareamento de hardware" | "Conectar equipamento" |
| "Modo Rápido / Completo" | "Começar uma luta" / "Torneio com chaves" |
| "Briefing pré-luta" | "Apresentação formal" |
| "Aguardando golpe" | "Dê um chutinho no capacete" |
| "RESETAR" | "Começar de novo" |
| "PULAR" | (removido — atalho perigoso) |
| "v0.4 protótipo" (header) | (removido — ruído) |

### Padrão de toast
- Curto, em PT-BR, com exclamação quando for celebração.
- Duração padrão 2.6s. Final celebratório (tudo pronto / luta salva) pode ser 3.5s.
- Exemplos: `"Regras salvas!"`, `"Capacete do atleta azul funcionando!"`, `"Tudo pronto! Boa luta."`

### Confirmações
- **Pedir confirmação** só quando ação perde dado (zerar testes, encerrar luta, desfazer tudo).
- **Não pedir** para: pausar, iniciar, trocar round, navegar.
- Usar `AlertDialog` do shadcn com título em pergunta ("Zerar todos os testes?") e ação confirmativa em voz ativa ("Sim, começar de novo").

### Hierarquia visual
- **3 botões grandes** para as ações do dia-a-dia (começar luta / testar equipamento / mostrar na TV).
- **"Mais opções (avançado)"** colapsado esconde as telas técnicas (config de pontos, briefing federado, bracket).
- Ações avançadas continuam acessíveis, só não dominam a tela inicial.

## O que **NÃO** fizemos no protótipo (e não precisa no código real)

- Não refazer o layout da tela inicial do repo (`ModeSelectorPage`) — o BÁSICO/PROFISSIONAL está ok.
- Não mudar o BroadcastChannel / sync TV — infra técnica não é problema de UX.
- Não adicionar tutoriais / tours — a UI deve ser autoexplicativa.
- Não adicionar sons novos (exceto se o usuário pedir).

## Filosofia

> "Mil nãos para cada sim."
> Cada elemento na tela precisa justificar sua existência. Se o operador tem que pensar "o que isso quer dizer?", é um fracasso.
