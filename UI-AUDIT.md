# UI-AUDIT.md — Aderência Visual

Source of truth de débitos visuais do SPE contra a skill `spe-ui-design v2.0` (`anthropic-skills:spe-ui-design`).

**Última atualização:** 2026-04-26
**Aderência atual estimada:** ~22%

---

## Filosofia

Tufte (densidade honesta) + Rams (funcionalidade sem ornamento) + Vignelli (grid e tipografia rigorosos) aplicados ao contexto SPE: placar legível em ginásio, hierarquia clara sob pressão, credibilidade federativa.

**Regra de ouro:** funcional sempre antes de visual (ver `AUDIT.md`). Não redesenhar UI sobre lógica errada.

---

## P1 — Sistema de Design (tokens)

- [ ] **Tipografia fora do sistema**: usar Rajdhani em vez de Bebas Neue / Anton (display) e Inter (UI). Skill define escala fixa (`text-score-xl/lg/md`, `text-timer-xl/md`, `text-label-lg/md/sm/xs`).
- [ ] **3 paletas competindo**: `--sulsport-*`, `--sfight-*`, `--game-*` coexistem. Skill define paleta única (`--chung`, `--hong`, `--bg-*`, `--fg-*`, `--manual-indicator`, etc). Consolidar.
- [ ] **Espaçamento ad-hoc**: instâncias de `margin/padding` fora do grid de 8px (ou 4px pra ajustes finos). Auditar e normalizar.

---

## P1 — Anti-padrões visuais

- [ ] **Retângulos full-bleed coloridos** (cartaz de bingo) em scoreboards. Skill seção 3.1 exige fundo escuro `--chung-bg`/`--hong-bg`, divisor central 2px `--divider`, sem gradientes nem imagem.
- [ ] **Cantos arredondados em placar de broadcast**: skill seção 2.4 — TV nunca tem `border-radius` em placar. Verificar `ChampionshipTV.tsx`.
- [ ] **Sombras decorativas**: usar só pra elevação funcional (skill seção 2.5). Auditar `text-shadow` e sombras coloridas.

---

## P2 — Honestidade técnica (Rams #6)

- [ ] **Botões manuais sem indicação**: SOCO (+1), GIRO CORPO (+4), GIRO CABEÇA (+6) precisam de borda dourada `--manual-indicator` + label "M"/"MANUAL" + tooltip "EngFlex não detecta esta técnica automaticamente". Skill seção 3.2.
- [ ] **Estado de hardware escondido em menu**: `HardwarePanel` deve ser sempre visível (barra lateral ou topo), nunca em menu. Skill seção 3.5.

---

## P2 — Ergonomia (P8 da skill)

- [ ] **Atalhos de teclado não visíveis**: cada botão de scoring deve mostrar atalho `[Q]`, `[W]`, etc no canto inferior. Skill seção 3.2.
- [ ] **Undo escondido**: deve ser barra superior fixa com contagem visível ("UNDO (3)"). Skill seção 3.4.
- [ ] **Gam-jeom em 1 clique sem confirmação** (risco de manipulação federativa). Skill seção 3.3 exige modal com motivos WT + botão "CONFIRMAR".

---

## P3 — Cronômetro

- [ ] **Sem destaque nos últimos 10s**: cor deve mudar pra `--warning` (amarelo) e piscar 1Hz nos últimos 3s. Skill seção 3.6.
- [ ] **Milissegundos visíveis em modo normal**: skill exige formato `M:SS` em uso normal (sem ms).

---

## P3 — Fim de luta (cerimônia)

- [ ] **Estado `AWAITING_CEREMONY` ausente**: skill seção 3.7 — após MATCH_END deve ter "CHARYEOT" 2s → "KYEONGNYE" 2s → botão "DECLARAR VENCEDOR" pra juiz central. Atualmente vai direto pra tela final.

---

## Como atualizar este arquivo

- Resolveu um item? Marca `[x]` e move pra "Histórico" com data, commit hash e nova % de aderência.
- Auditoria descobriu desvio novo? Adiciona no nível P1/P2/P3 certo, com referência à seção da skill.
- Re-medir aderência após cada batch de fixes (rodar checklist seção 4 da skill).

## Histórico

(Vazio — primeiro item resolvido entra aqui com diff de % aderência.)
