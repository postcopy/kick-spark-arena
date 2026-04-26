# AUDIT.md — Pendências Funcionais

Source of truth de débitos funcionais do SPE. Ordenados por prioridade.

**Última atualização:** 2026-04-26
**Versão atual:** 1.5.2

---

## P0 — WT 2026 Compliance (homologação)

Bloqueiam paridade com regulamento atual da World Taekwondo. Prioridade sobre qualquer trabalho visual.

- [ ] **Scoring `spinBody`**: atualmente `3` → deveria ser `4` pontos
- [ ] **Scoring `spinHead`**: atualmente `4` → deveria ser `6` pontos
- [ ] **`pointGap`**: atualmente `12` → WT 2026 usa `15` a `20` (confirmar valor exato com regulamento publicado)
- [ ] **Anti-stalling**: gam-jeom nos últimos 10s do round = `+2 pts` ao adversário (não `+1`). Não implementado.
- [ ] **Audit trail de gam-jeom**: persistir `operatorId` + `reason` no DB. Schema já tem os campos (round 10), falta UI capturar e persistir.

**Branch dedicado sugerido:** `fix/wt-2026-compliance`

---

## P0 — Segurança

- [ ] **`SEC-001`** — PMK/LMK do firmware do receptor custom estão hardcoded em plaintext (`pmk1234567890123` / `lmk1234567890123`). Repo público = injeção de HITs falsos em competição. Mover pra NVS via comando serial `#SETPMK` / `#SETLMK`.
  - Componente: `firmware/receptor_custom/receptor_custom.ino:29-31`

---

## P1 — Reliability (silent failures em competição)

- [ ] **`AUD-001`** — `SoundContext` retorna stub no-op se provider não montar, sem feedback. Operador não ouve sons de HIT em competição sem perceber. Adicionar toast/banner visível quando som falhar.
  - Componente: `src/contexts/SoundContext.tsx:4-20`

- [ ] **`APP-001`** — Callback `onImpact` pode ser null e impactos são descartados silenciosamente com `logger.warn`. Perda de HITs sem alerta visível em produção. Error boundary ou toast quando callback ausente.
  - Componente: `src/hooks/useSerialPort.ts:235`

---

## P1 — Hardware (testes pendentes)

- [ ] **`HW-001`** — Capacetes (devices 3, 4) e juiz (devices 5-7) nunca foram testados com hardware real. Falha silenciosa em kits completos de competição.
  - Bloqueado por: receber kit completo

- [ ] **`FW-001`** — Firmware do colete v1.0 usa QMI8658 que não existe na placa VIEWE MD50ET. Inutil nessa placa.
  - Bloqueado por: ESP32-C3 + MPU6050 soldado (pessoa externa)

---

## P2 — UX

- [ ] **`UX-001`** — Anti-dupla de 200ms no firmware suprime rajadas rápidas válidas (dolyo duplo legítimo perdido). Comando `#COOLDOWN` existe mas sem UI. Adicionar UI no `MatchConfigDialog` aba Hardware.
  - Componente: `firmware/receptor_custom/receptor_custom.ino:145-159`

- [ ] **`UX-002`** — `HardwarePanel` não explica por que device fica "OFF" (timeout 30s). Operador confuso quando colete some momentaneamente. Adicionar tooltip.
  - Componente: `src/components/championship/HardwarePanel.tsx`

---

## P2 — Firmware (qualidade de vida)

- [ ] **`FW-002`** — Canal WiFi não persiste entre sessões do receptor. Rescan a cada boot causa delay de 10-65s pra travar. Persistir em NVS.

- [ ] **`HW-002`** — Dual serial (Serial + Serial0) duplica linhas, app filtra via regex. Cosmético mas consome bandwidth. Detectar automaticamente em runtime.

---

## P3 — Quality (debt acumulado)

- [ ] **`LOG-001`** — Logs `[FLUSH]` a cada 4.5s + linhas serial a cada 50 pacotes em produção. Overhead mesmo com `VITE_DEBUG=0`. Gatear via flag.
  - Componente: `src/hooks/useSerialPort.ts:207-208,301`

- [ ] **`TEST-001`** — `useSerialPort.test.ts` não cobre `parseStatusLine`, `parseAlertLine`, `sendCommand`. Regressão silenciosa se formato diagnóstico mudar.

- [ ] **`BUILD-001`** — Electron main process não é lintado por `npm run lint` nem testado. Bugs em `main-championship.ts` escapam até runtime.

- [ ] **`TYPE-001`** — 15+ `(window as any)` bypass strict mode em `src/components/game/*` e `src/components/IntroScreen.tsx`. Substituir por type guards.

---

## Como atualizar este arquivo

- Resolveu um item? Marca o checkbox `[x]` e move pra seção "Histórico" no fim com a data e o commit hash.
- Encontrou bug novo? Adicionar no nível de prioridade certo (P0 = bloqueia competição/homologação, P1 = silent failure, P2 = UX, P3 = quality).
- Round de auditoria descobriu issue? Linkar com ID `R<round>-H<n>`.

## Histórico

(Vazio — primeiro item resolvido entra aqui.)
