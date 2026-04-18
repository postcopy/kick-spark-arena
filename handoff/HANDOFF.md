# 🎯 HANDOFF COMPLETO — Usabilidade SPE (18/abr/2026)

> **Para Claude Code:** aplicar no repositório `kick-spark-arena-main`.
> Projeto já é **Vite + React + TS + shadcn/ui + Electron**, com `sonner`, `lucide-react` e assets em `src/assets/`.
> **Siga `CLAUDE.md` do repo (Karpathy):** não invente features extras, não refatore o que não está listado. Mas **execute TODAS** as mudanças abaixo — elas são o produto da rodada de UX.

---

## 🧭 Princípios da rodada

> Uma criança de 10 anos deve conseguir usar sem treinamento.
> Máximo 3 cliques por ação principal · linguagem humana · feedback visual imediato · confirmação antes de perder dado.

---

## 📦 Stack já disponível (não reinventar)

| Precisa | Usar |
|---|---|
| Toast | `sonner` → `import { toast } from 'sonner'` |
| Diálogo de confirmação | shadcn `@/components/ui/alert-dialog` |
| Ícones | `lucide-react` (Check, RotateCcw, Zap, ArrowLeft, ArrowRight, etc.) |
| Assets | `@/assets/{capacete,colete}-{azul,vermelho}.png` e `logo-spe-branca.png` |

---

## 📋 TAREFA 1 — Toasts de sucesso globais

Plugar `toast.success(...)` em **todos os pontos de confirmação** do fluxo.

| Arquivo | Evento | Mensagem |
|---|---|---|
| `MatchConfigDialog.tsx` | ao salvar configuração | `"Regras salvas!"` |
| `ChampionshipMat.tsx` | ao encerrar luta | `"Luta registrada!"` (duration 3500) |
| `HardwareTestOverlay.tsx` | cada device testado pela 1ª vez | `"Capacete do atleta azul funcionando!"` (nome humano por device) |
| `HardwareTestOverlay.tsx` | os 4 devices OK | `"Tudo pronto! Boa luta."` (duration 3500) |
| `CalibrationWizardDialog.tsx` | concluir calibração | `"Calibração concluída!"` |
| `ModeSelectorPage` → ao entrar em BÁSICO | (opcional) | `"Modo básico iniciado. Boa luta!"` |

**Regra:** só em save / confirm / concluir. **Não** a cada golpe no placar, **não** em pause/play, **não** em navegação.

---

## 📋 TAREFA 2 — Reescrever `HardwareTestOverlay.tsx` (layout novo)

**Esta é a mudança de maior impacto visual.** O layout atual do overlay (2×2, sem passo sequencial) deve ser substituído pelo layout do protótipo. Código de referência em `handoff/prototype-reference/hardware-test.jsx`.

### Contratos a **preservar** (não mexer):
- Props: `onClose`, `onReset?`, `externalHits?`, `onRegisterHitCallback?`, `athleteBlue?`, `athleteRed?`, `hideControls?`
- Mapa de deviceId (lembrar inversão EngFlex):
  - `1` = Colete Azul · `2` = Colete Vermelho · `3` = **Capacete Vermelho** · `4` = **Capacete Azul**
- Sync via BroadcastChannel para TV (modo `hideControls`)
- `onRegisterHitCallback` continua recebendo `HardwareTestHit`

### Novo layout (Tailwind + shadcn)

**Estrutura vertical (4 camadas, do topo ao rodapé):**

1. **Top bar (~56px)** — `< Voltar` · logo · "Teste de equipamento · Mat N" · à direita: contador `1/4 verificados` + botão "Começar de novo" (só aparece se houver progresso) + botão final "Tudo pronto · Começar" (verde, desabilitado até 4/4).

2. **Faixa de instrução (~80px)** com 3 estados:
   - **Em andamento:** fundo amarelo translúcido, número grande do passo (1/2/3/4), texto grande:
     > "Atleta **CHUNG (azul)**: dê um chutinho no **capacete**."
     (nome e tipo em negrito colorido — azul/vermelho para o atleta, amarelo para o equipamento)
   - **Completo:** fundo verde translúcido, check grande:
     > "**Tudo pronto!** Todos os equipamentos estão funcionando. Os atletas podem subir no tatame."

3. **Grid 4 cards em uma fileira** (não 2×2). Cada card:
   - **Ativo (foco):** border âmbar + pulse + imagem com glow colorido + footer amarelo "AGUARDANDO CHUTINHO..."
   - **Inativo:** opacity 0.55, border cinza, footer "AGUARDA"
   - **Verificado:** border verde + fundo verde translúcido + check grande no canto + ring verde expandindo no momento do hit + footer "● VERIFICADO · FORÇA 72"
   - Header do card: número do passo + "CHUNG/HONG" colorido + "CAPACETE/COLETE" grande
   - Centro: imagem do equipamento (`@/assets/...`)

4. **Barra de progresso no rodapé (~52px)** — "PROGRESSO" à esquerda + 4 checkpoints conectados por linha (linha fica verde conforme avança). Cada checkpoint: círculo numerado (vira ✓ verde quando feito) + label curto ("AZUL CAP", "AZUL COL", "VERM CAP", "VERM COL"). Dica discreta à direita: "CLIQUE OU TECLE 1-4".

### Comportamento
- **Ordem sequencial:** `['blue-helmet','blue-chest','red-helmet','red-chest']` — `focus` é sempre o primeiro ainda não testado.
- **Atalhos 1-4:** mapeiam pra essa ordem (não pros deviceId físicos).
- **Clique no card também funciona** (se não `hideControls`).
- **AlertDialog** antes de "Começar de novo" se `doneCount > 0`. Título: "Zerar todos os testes?" Descrição: "Você vai precisar testar os 4 equipamentos novamente." Botões: "Cancelar" / "Sim, começar de novo".
- **Toast** a cada device verificado pela 1ª vez: `"Capacete do atleta azul funcionando!"` etc.
- **Toast** quando `doneCount === 4`: `"Tudo pronto! Boa luta."` duration 3500.
- **Animações CSS necessárias** (adicionar no global ou `index.css`):
  - `spe-pulse`: opacity 1 ↔ 0.35 (1s infinite) — usado no dot do card em foco
  - `spe-ring`: scale 0.4→1.4 + fade out (1.1s ease-out) — ripple no hit

### Verificação
- [ ] Abrir overlay → primeiro card (blue-helmet) com ring âmbar, os outros apagados
- [ ] Tecla `1` → card vira verde, toast aparece, ring expande, próximo card (blue-chest) vira ativo
- [ ] Repetir 2, 3, 4 → ao final, faixa azul vira verde com "Tudo pronto!"
- [ ] Botão "Começar de novo" com progresso → AlertDialog
- [ ] Botão "Começar de novo" sem progresso → zera direto
- [ ] No modo TV (`hideControls`), sem botões, recebe hits via `externalHits` e atualiza a mesma UI

---

## 📋 TAREFA 3 — Hub amigável (tela pós-intro)

### Estado atual
`ModeSelectorPage.tsx` já tem BÁSICO vs PROFISSIONAL — **manter**. Esses rótulos estão ok.

### O que falta
Quando a pessoa escolhe BÁSICO, cai em `ChampionshipMat.tsx` direto. Não há um **Hub** amigável onde ela escolhe "Começar luta / Testar equipamento / Mostrar na TV". No protótipo, isso é o Hub.

**Decisão:** adicionar um **Hub simples** antes do `ChampionshipMat`, ou dentro dele como um estado inicial. Sugestão: novo componente `ChampionshipHub.tsx` que é a tela inicial do modo básico.

### Layout do Hub
1. **Header:** logo + saudação humana "Olá! O que você quer fazer?" + sub "Mat N · [local] · [dia]"
2. **3 botões grandes em grid (1.6fr 1fr 1fr):**
   - **"Começar uma luta"** (verde, maior, ícone zap) — sub "Pega a próxima da fila e abre o placar." → navega pro placar
   - **"Testar equipamento"** (ciano, ícone stethoscope) — sub "Verifica capacete e colete dos dois atletas." → abre HardwareTestOverlay
   - **"Mostrar na TV"** (roxo, ícone monitor) — sub "Abre o placar grande para o público." → abre TV em janela/rota nova
3. **Seção "Mais opções (avançado)"** colapsável (padrão: fechado). Dentro, grid 3×2 com ações técnicas:
   - Ajustar regras (settings) · Ver todas as lutas (list) · Conectar equipamento (bluetooth)
   - Apresentação formal (users) · Resultado da luta (trophy) · Chaveamento (flag)

### Princípios
- **Sem CAPS exageradas.** Títulos em weight:700, não uppercase.
- **Sem "v1.0.0" visível.** Footer opcional bem discreto.
- **Linguagem humana** nos subtítulos. Nada de "pareamento", "briefing", "bracket".
- **Máximo 2 cliques** para começar uma luta (Hub → Começar).

### Verificação
- [ ] Abrir BÁSICO → aparece o Hub (não o placar direto)
- [ ] Clicar "Começar uma luta" → toast "Modo iniciado. Boa luta!" + abre placar
- [ ] Clicar "Mais opções" → expande com animação suave
- [ ] Não há mais de 3 botões principais na parte de cima

---

## 📋 TAREFA 4 — AlertDialog em ações destrutivas

Procurar no código botões que **perdem dado** sem aviso. Adicionar `AlertDialog` do shadcn.

Candidatos (confirmar cada um antes de mudar):

| Ação | Diálogo |
|---|---|
| "Encerrar luta" em `ChampionshipMat.tsx` | "Encerrar essa luta?" / "O placar atual será registrado." / "Sim, encerrar" |
| "Desfazer tudo" / "Clear" do placar | "Zerar o placar?" / "Todos os pontos dessa luta serão perdidos." / "Sim, zerar" |
| "Começar de novo" no teste de equipamento | (já descrito na Tarefa 2) |
| "Descartar" em configs não salvas | "Descartar mudanças?" / "As alterações não serão salvas." / "Sim, descartar" |

**NÃO pedir confirmação para:** pausar, retomar, trocar round, navegar entre telas, abrir dialog de config.

---

## 📋 TAREFA 5 — Linguagem humana (varredura global)

Procurar estes termos em **todo o `src/`** e trocar onde aparecem na UI:

| ❌ Técnico | ✅ Humano |
|---|---|
| "Pareamento de hardware" / "Pair hardware" | "Conectar equipamento" |
| "Briefing pré-luta" | "Apresentação formal" |
| "Aguardando golpe" / "Aguardando impacto" | "Dê um chutinho no capacete/colete" |
| "RESETAR" (botão) | "Começar de novo" |
| "PULAR" / "Skip" (atalho sem confirmação) | **remover** |
| "Bracket" (em UI pro usuário) | "Chaveamento" |
| Labels em UPPERCASE com letter-spacing enorme | Title Case ou sentence case |
| "v0.4 protótipo" / versões visíveis | Remover (ou footer muito discreto) |

**Cuidado:** não trocar termos em:
- Logs / console (usuário técnico)
- Nomes de arquivo, types, props (código)
- Textos oficiais de regulamento federativo (se existirem)

---

## 🧪 Roteiro de teste manual (depois de tudo aplicado)

```
1. npm run dev
2. Esperar intro cinematográfica (~9s) → clicar BÁSICO
3. Deve cair no HUB NOVO com 3 botões grandes
4. Clicar "Testar equipamento"
5. Tecla 1 → toast verde "Capacete do atleta azul funcionando!"
6. Tecla 2, 3, 4 → mais toasts + animações + ring verde no hit
7. Ao completar: toast "Tudo pronto! Boa luta." + faixa verde grande
8. Clicar "Começar de novo" (com progresso) → AlertDialog aparece
9. Voltar pro Hub → clicar "Começar uma luta"
10. No placar: encerrar luta → AlertDialog → confirmar → toast "Luta registrada!"
11. Abrir "Mais opções (avançado)" → Ajustar regras → salvar → toast "Regras salvas!"
```

Todas as etapas devem ser **autoexplicativas** sem tooltip/ajuda.

---

## 📦 Electron

Nenhuma mudança de Electron. Só UI/UX em React.

```bash
npm run electron:preview    # testar no container Electron
npm run electron:build      # empacotar .exe
```

---

## 🎯 Definição de pronto

- [ ] Tarefa 1 — toasts em config, fim de luta, equipamento, calibração
- [ ] Tarefa 2 — `HardwareTestOverlay` reescrito com layout sequencial, 4 cards fileira, faixa grande, progresso rodapé, AlertDialog, toasts, animações
- [ ] Tarefa 3 — Hub amigável com 3 botões + mais opções colapsável
- [ ] Tarefa 4 — AlertDialog em ações destrutivas (encerrar luta, zerar placar)
- [ ] Tarefa 5 — varredura de linguagem técnica substituída
- [ ] `npm run lint` passa
- [ ] `npm run test` passa
- [ ] Roteiro manual executado e todas as etapas funcionam
- [ ] Screenshot do Hub novo + overlay novo anexado

---

## 📚 Arquivos de referência neste pacote

- **`HANDOFF.md`** — este arquivo, com TODAS as tarefas
- **`USABILITY_CHANGES.md`** — filosofia e tabelas de linguagem
- **`prototype-reference/index.html`** — HTML raiz do protótipo (inclui Hub, animações CSS, sistema de toast)
- **`prototype-reference/shared.jsx`** — primitivos reutilizáveis (Icon, toast host, Screen, etc.)
- **`prototype-reference/hardware-test.jsx`** — overlay completo, **referência visual direta** da Tarefa 2

> Os JSX são React puro com inline styles (eram protótipo sem tooling). Ao portar, usar **Tailwind + shadcn** no lugar dos `style={{…}}`. Os tokens de cor podem ser convertidos:
> - `#10B981` → `green-500` / `emerald-500`
> - `#FACC15` → `yellow-400`
> - `#E11D48` → `red-600` / `rose-600`
> - `#3b82f6` / azul CHUNG → `blue-500`
> - `#ef4444` / vermelho HONG → `red-500`

---

**Quando houver dúvida:** pergunte antes de assumir. Siga Karpathy, mas a **escala** dessa rodada é maior que cirúrgica — é uma onda de UX inteira. Faça o que precisa ser feito pra bater o critério: "criança de 10 anos, sem treinamento".
