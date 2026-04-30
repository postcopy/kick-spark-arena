# SISTEMA.md — Documentação técnica completa do produto Sulsport SPE

**Single source of truth.** Hardware → firmware → software, ponta a ponta. Para entender exatamente o que é o produto.

> Esse doc é descritivo (estado atual), não prescritivo. Pendências = [AUDIT.md](../AUDIT.md). UI = [UI-AUDIT.md](../UI-AUDIT.md). Filosofia/processo = [.spe/SESSIONS.md](../.spe/SESSIONS.md).

---

## 1. Visão geral

### O que é o produto

**SPE Sulsport** é um sistema eletrônico de pontuação (PSS — Protector & Scoring System) para competições oficiais de Taekwondo. Compete com KPNP, Daedo, LaJust no mercado mundial. Meta de longo prazo: homologação World Taekwondo (WT).

O produto se desdobra em dois modos comercializados num único binário Electron:

| Modo | Público | Ativação | Build |
|---|---|---|---|
| **S-FIGHT PRO** | Academias/treino — modo arcade gamificado | `npm run electron:build` | `release/` |
| **SPE Sulsport** | Competição oficial — placar profissional | `npm run electron:build:championship` | `release-championship/` |

Este doc foca **no modo competição (SPE)**. O modo arcade compartilha hardware mas tem fluxo de UI próprio.

### Cadeia de valor

```
[Atleta chuta] → [Bobina no colete induz tensão] → [ESP32-S3 Sulsport amostra ADC]
   → [SGCP frame ESP-NOW criptografado] → [Receptor ESP32-S3]
   → [USB Serial 115200 8N1] → [Web Serial API no Electron]
   → [parseLine → ImpactDetector → classifyImpact]
   → [setState master] → [BroadcastChannel + Supabase Realtime + localStorage]
   → [Placar operador + TV broadcast + LiveScore mobile]
```

Tudo em < 200 ms da pancada até pixel atualizado.

### Stack resumido

- **Hardware:** placa Sulsport V2-C (fab TECNOFLEX/EngFlex), ESP32-S3-WROOM-1, sensor indutivo (bobina + ímã na sapatilha)
- **Firmware:** SGCP proprietário (TECNOFLEX) + receptor custom v5.1 nosso
- **Frontend:** React 18 + TypeScript 5 + Vite 5 + Tailwind 3 + shadcn/ui
- **Desktop:** Electron 41, builds duplos (regular + championship), auto-updater
- **Backend:** Supabase (auth + Postgres + Realtime)
- **Sync local:** BroadcastChannel (entre janelas) + IPC (Electron)
- **Comm hardware:** Web Serial API

---

## 2. Hardware

### 2.1 Plataforma física

**Placa Sulsport V2-C** — datada `25/09/2024`, fabricada pela TECNOFLEX (= EngFlex, mesma empresa, razão social vs marca comercial). Modelo OEM/white-label: Sulsport especifica e revende; TECNOFLEX produz.

**Característica fundamental:** uma única topologia de PCB serve **três funções** distintas, configuradas só por firmware:

| Função | Cabo no J5 | Firmware base | Comunicação saída |
|---|---|---|---|
| **Colete (transmissor)** | sim — 4 bobinas via cabo blindado | `firmware_colete_*.bin` | ESP-NOW (SGCP) → receptor |
| **Receptor** | não usa | `firmware_receptor_*.bin` | USB Serial → PC |
| **Capacete (transmissor)** | similar ao colete, sensor diferente | derivado do colete | ESP-NOW (SGCP) → receptor |

Implicação: BOM única, linha de produção única, identificação por firmware. Vantagem operacional grande, manutenção simples.

### 2.2 Componentes principais (front da placa)

| Item | Designator | Função |
|---|---|---|
| **MCU + RF** | ESP32-S3-WROOM-1 (8MB Flash + 8MB PSRAM) | Wi-Fi 2.4 GHz (ESP-NOW PHY), USB nativo, dual-core Xtensa |
| FCC ID | `2AC7Z-ESP32S3WROOM1` | Certificação |
| IC | `21098-ESP32S3WROOM1` | Identificação módulo |
| CMIIT | `2022DP2892` | Certificação CN |
| **Conector USB** | J1 | Micro-B (V2 antigas) ou USB-C (V2-C+) |
| **Conector sensor** | J5 com 4 entradas `A`, `B`, `C`, `D` | 4 zonas independentes (bobinas) |
| **Charger LiPo** | U9 (TP4056-family) | Carga via USB |
| **Indutores** | L1, L4, L5 | DC-DC + filtragem |
| **Botão** | TACT vermelho (`S1`) | Power / pareamento |
| **LEDs** | D5, D7, D8, D9 | Status (link, hit, bateria) |
| **Pad haptic** | silkscreen `GND_HMOTOR` | Footprint pra motor de vibração (não populado em todas as placas) |
| **Headers expansão** | `EXJ43`/`EXJ60` lateral direita | Debug + GPIO extras |
| **ICs analógicos** | quadrante inferior direito (não identificados visualmente) | Op-amps + ADS1115 (confirmado por firmware decompilado) condicionando sinal das bobinas |

### 2.3 Componentes do verso

Header de expansão **`I2C-EXP0`**: `SDA`, `SCL`, `3V3`, GND implícito. **I²C dedicado já exposto** — qualquer periférico I²C (RFID PN532/MFRC522, IMU, display OLED) pluga sem revisar PCB.

Header lateral 8 pinos: `GND`, `3V3`, `GPIO37`, `GPIO38`, `GPIO39`, `GPIO40`, `GPIO41`, `GPIO42` — **6 GPIOs livres** + alimentação.

Silkscreens importantes do verso:
- `Sulsport` (logo + texto vertical)
- `TECNOFLEX` (sticker QC colorido com lote — ex: `ts3` no kit #23)
- `SulsportV2-C 25/09/2024` (revisão + data)
- `BATT0+ Bateria` (entrada bateria LiPo)
- `TE OK` (marker QC aprovado)

### 2.4 Topologia de uso em competição

Um kit completo numa quadra (mat) = **8 dispositivos**:

| Device ID | Equipamento | Lado | Notas |
|---|---|---|---|
| `1` | Colete Azul (CHUNG) | esquerda | Lê chute do atleta vermelho |
| `2` | Colete Vermelho (HONG) | direita | Lê chute do atleta azul |
| `3` | Capacete Azul | esquerda | Lê chute do atleta vermelho (ímpar = azul, igual aos coletes) |
| `4` | Capacete Vermelho | direita | Lê chute do atleta azul (par = vermelho, igual aos coletes) |
| `5` | Juiz 1 | tatame | Botões pontuação manual / IVR |
| `6` | Juiz 2 | tatame | Idem |
| `7` | Juiz 3 | tatame | Idem |
| — | Receptor | mesa do operador | Conecta ao PC via USB |

Mapeamento e regras: [src/lib/deviceMapping.ts](../src/lib/deviceMapping.ts).

### 2.5 Princípio de sensoriamento (indutivo: rede de fios + ímã)

**Confirmado pelo proprietário (2026-04-28)** + corroborado por firmware decompilado (uso de ADS1115 via I²C — ADC delta-sigma 16-bit com PGA, característico de leitura de mV-range de circuitos indutivos, NÃO de piezo).

#### Componentes físicos

- **Meia protetora de Taekwondo** (foot protector WT-style) — contém **ímãs embutidos** (provavelmente neodímio). É o "transmissor passivo" do golpe.
- **Colete** — possui uma **rede de fios** que passam por todo o tecido, formando bobinas distribuídas nas zonas válidas de pontuação (frente + lateral E + lateral D + costas em algumas variantes).
- **Conector J5** com 4 entradas (`A`, `B`, `C`, `D`) — agrupa a rede de fios em **4 zonas/segmentos** que entram na placa como 4 canais analógicos independentes.
- **Placa Sulsport V2-C** — amplifica + condiciona + amostra cada canal via ADS1115 sobre I²C.

#### Cadeia de detecção

```
[atleta chuta com a meia] → [ímã na meia se aproxima e passa pela rede de fios]
   → [variação de fluxo magnético induz tensão nos fios]
   → [tensão chega ao J5 (uma das 4 zonas)] → [op-amp amplifica]
   → [ADS1115 amostra @ I²C] → [TASK_HIT_COMPUTING agrega 4 canais → 1 intensidade]
   → [frame SGCP via ESP-NOW para receptor]
```

#### Características relevantes (fonte: Julio Tecnoflex, engenheiro responsável, 06/02/2026)

- **`intensity` é energia, não pico.** "Como se fosse a área entre o pulso e o eixo de tempo" (integral). Aproximadamente proporcional à força do golpe.
- **Escala não tem limite definido — "tende ao infinito".** Não é 0-255 nem 0-1023. Mínimo varia com o nível de ruído do colete (pode ser unidades muito baixas). Sem unidade de medida.
- **Reduções podem ocorrer**: oscilações no sinal (ex: raspagem) reduzem a energia integrada percebida. Anti-raspagem nativo.
- **1 pacote por detecção, não burst por chute.** A placa emite um pacote sempre que percebe um sinal válido. Vários pacotes por chute acontecem se houver múltiplos picos no impulso — a agregação é responsabilidade do receptor/software.
- **Filtragem em hardware é não-trivial.** Inclui filtros analógicos + análise do formato da curva de tensão. Só pulsos com formato esperado são aceitos. Falsos positivos por vibração/ruído ambiente já são rejeitados antes de virar pacote.
- **Hardware NÃO classifica toque/hit/golpe.** Só mede e empacota. Classificação é 100% software (vide [src/lib/impactDetector.ts](../src/lib/impactDetector.ts) + thresholds em [MatchConfigDialog.tsx](../src/components/championship/MatchConfigDialog.tsx)).
- **Bateria não afeta medição.** Em níveis muito baixos pode aumentar ruído base (mas o sistema desliga logo). Valor `battery` no protocolo é estimativa "grosseira", oscila mas serve como indicador.
- **Anti-fraude físico parcial** — só material magnético dispara. Joelho/cotovelo/mão sem ímã = nenhum hit. Mas atleta poderia esconder ímã extra fora do pé — gap fechado por concorrência via RFID HF.
- **Sem contato elétrico** — sensor totalmente passivo. Sem desgaste de eletrodos, sobrevive a suor.
- **Bobina = rede distribuída**, não bobinas discretas. Cobertura ampla por zona.

#### Família arquitetural

Mesma escola de Daedo (sistema TKStrike Gen 2/3) e KPNP. Diferenciais ainda **inexistentes** vs concorrência:

| Feature | Sulsport V2-C | KPNP V2.0 (2012) | KPNP K2 (atual) | Daedo Gen 3 |
|---|:---:|:---:|:---:|:---:|
| Indução magnética (bobina + ímã) | ✓ | ✓ | ✓ | ✓ |
| Validação RFID (anti-fraude tag) | ✗ | ✓ (3ALogics TRH033M-S) | ✓ | ✓ |
| IMU/giroscópio (chute giratório real) | ✗ | ✗ | ✓ | ✓ |
| Display no colete | ✗ | ✗ | ✓ | ✓ |
| Motor haptic (feedback ao atleta) | footprint só (`GND_HMOTOR` no PCB) | ✗ | ✓ | ✓ |

**Estratégia natural pra próxima revisão (V3?):** RFID HF via header `I2C-EXP0` (já exposto), motor haptic populando o footprint existente, IMU via I²C também. Tudo cabe sem rever PCB significativamente.

### 2.6 Numeração de kits (rastreabilidade)

Kits são numerados (ex: **Kit #23** = uma SulsportV2-C com QC `ts3`). Sistema de inventário e MACs ainda não está formalizado em planilha — recomendação aberta.

**MACs do kit reparado (abr/2026, vide engenharia reversa):**

| Equipamento | MAC |
|---|---|
| Receptor | `48:CA:43:9D:D3:4C` |
| Colete Azul | `48:CA:43:9D:D9:18` |
| Colete Vermelho | `48:CA:43:9D:D6:B0` |
| Capacete Azul | `48:CA:43:9C:3C:FC` |
| Capacete Vermelho | `48:CA:43:9D:D6:C0` |
| ESP32-S3 avulsa (receptor v5.1 nosso) | `1C:DB:D4:99:D4:B0` |

---

## 3. Firmware

### 3.0 Documentação oficial do fabricante (TECNOFLEX/EngFlex)

Existem **duas fontes primárias do fabricante** registradas no projeto:

#### 3.0.1 PDF — "Documentação de Software · Sul Sport"
Arquivo: [release-championship-backup-20260423-144550/Mensagens SulSport.pdf](../release-championship-backup-20260423-144550/Mensagens%20SulSport.pdf)  
Versão: **Primeira versão, 20/01/2026**  
Logo: **EngFlex**

Define o **protocolo de mensagens** entre placas e software. Conteúdo essencial:

- **Baud rate: 115200**
- **Coletes/capacetes**: formato `X,Y,Z` = `Intensidade, ID da Placa, % Bateria`
- **Juízes (IDs 5-7)**: formato `X,Y,0` = `Botão pressionado, ID da Placa, Valor nulo`
- Critério de classificação golpe/HIT/toque é **definido em software**, não em hardware
- HIT desempata; golpe pontua (regra WT)

**Identificação oficial das placas (segundo o PDF):**
| ID | Equipamento (PDF EngFlex) |
|----|---|
| 1 | Colete azul |
| 2 | Colete vermelho |
| 3 | **Capacete azul** |
| 4 | **Capacete vermelho** |
| 5 | Juiz 1 |
| 6 | Juiz 2 |
| 7 | Juiz 3 |

⚠️ **Discrepância documental** (não é bug — pontuação validada em produção 2026-04-28): o código atual ([src/lib/deviceMapping.ts](../src/lib/deviceMapping.ts) e [useSerialPort.ts:73](../src/hooks/useSerialPort.ts#L73)) inverte os capacetes — `3 = vermelho`, `4 = azul` — com comentário "Helmets inverted in EngFlex HW". O **código está correto** (validado empiricamente); o **PDF tem erro ou desatualização**. Item registrado em [AUDIT.md](../AUDIT.md) `HW-003` (P3 Quality) — pedir EngFlex pra atualizar a doc.

**Exemplo de log real (do PDF):**
```
21,4,86    <- intensity=21, dev=4 (capacete), battery=86%
14,4,86
27,4,86
1,5,0      <- juiz 1, botão 1
0,5,0      <- juiz 1, botão 0  (semântica indefinida — release? reset?)
3,5,0      <- juiz 1, botão 3
```

#### 3.0.2 Mensagens — Julio Tecnoflex (engenheiro), 06/02/2026

Conversa via mensagens com Julio (engenheiro responsável pelo hardware na TECNOFLEX). Pontos-chave (texto preservado para citação):

> **Sobre `intensity`:** "A escala tende ao infinito e o valor mínimo costuma ser muito baixo (poucas unidades), depende do nível de ruído do colete. Não tem unidade de medida."

> **Sobre o que é medido:** "A gente consegue mensurar a 'energia' percebida pela bobina. Como se fosse a área que fica entre o pulso e o eixo de tempo. Mas tem alguns fatores que podem 'reduzir' essa energia, quando há oscilações por exemplo (que ocorrem na raspagem)."

> **Sobre detecção:** "É enviado um pacote por detecção. A detecção acontece sempre que um sinal é percebido pela placa. O receptor tem a responsabilidade de classificar | ruído | hit | golpe."

> **Sobre filtros:** "Existe e é bastante complexo. Envolve filtragem de hardware e análise do formato da curva de tensão gerada pelo impacto. Existem umas 'regras' que o sinal precisa respeitar para ser aceito."

> **Sobre classificação:** "O hardware não faz nenhum juízo a respeito da regra ou de classificação. Simplesmente identifica o fenômeno físico e mensura a sua intensidade, tantas vezes quantas acontecerem."

> **Sobre níveis de atleta (parametrização):** "Valores maiores deixam o 'colete mais duro', tendo que bater mais forte. São usados para atletas mais experientes. Valores menores para infantil. Até onde sei, esse ajuste é feito 'no feeling'."

> **Sobre bateria:** "A tensão da bateria não influencia na medição. Pode acontecer de, em percentuais muitíssimo baixos, o nível de ruído geral do sistema aumentar, mas isso não dura muito pois logo o sistema se desliga. O valor de bateria é uma estimativa 'grosseira' e pode oscilar, mas dá uma boa ideia do estado da carga."

**Implicação no código** (não é bug ativo — pontuação validada em produção 2026-04-28): [src/hooks/useSerialPort.ts:60](../src/hooks/useSerialPort.ts#L60) descarta packets com `intensity > 255`. Conflita com a fala "tende ao infinito" do Julio, mas o range típico real fica bem abaixo de 255 nas condições atuais — por isso não impacta. Item registrado em [AUDIT.md](../AUDIT.md) `HW-004` (P3 Quality) — observabilidade preventiva: adicionar log de "packet rejected by cap" e confirmar range com Julio numa próxima conversa.

### 3.1 Firmware original Sulsport (compilado pela TECNOFLEX)

**Não temos source.** Temos:
- Dump binário de 4 MB (full flash do ESP32-S3): `firmware_receptor_bom.bin`, `firmware_colete_bom.bin`
- Decompilação Ghidra: 4445 funções em `firmware_decompiled.c` (4.5 MB, 169K linhas)
- ELF reconstruído com 5 segmentos: `receptor_app.elf`

Localização de tudo: `C:\Users\User\Documents\JOGOS TAEKWONDO\` (pasta pai do projeto SPE).

**Assinatura no binário:** string literal `TECNOFLEX_port_esp32_drv_serial` aparece no decompilado, confirmando autoria.

### 3.2 Protocolo SGCP (decodificado abr/2026)

**SGCP** = nome interno do protocolo proprietário Sulsport/TECNOFLEX sobre ESP-NOW.

#### Encriptação
- **PMK** (Pairwise Master Key): `pmk1234567890123` — hardcoded
- **LMK** (Local Master Key): `lmk1234567890123` — hardcoded, per-peer
- AES-128/CCMP (padrão ESP-NOW), `encrypt=true` em todos os peers
- ⚠️ **Vulnerabilidade documentada** ([AUDIT.md](../AUDIT.md) `SEC-001`): chaves em plaintext em repo público permitem injeção de HITs falsos em competição

#### Frame
Sempre **25 bytes (0x19)** via ESP-NOW:

```
byte[0]    = node_id  (0=HIT, 8=KEEPALIVE)
byte[1]    = msg_type (0=SCORE, 1=COMMAND, 2=DISPLAY)
byte[2..24] = payload (23 bytes)
```

#### Tipos de mensagem
| msg_type | Significado | Payload |
|---|---|---|
| `0` | SCORE | `payload[1]` = intensidade (int32 LE). Format serial saída: `"%ld,%d,%d"` (intensity, deviceId, battery) |
| `1` | COMMAND | Posição de sensor, comando de config |
| `2` | DISPLAY | `"%d,%d,%d"` (score, round, period) |

#### Estrutura de Node SGCP (0x44 bytes)
```
offset 0x00: node_id (byte)
offset 0x04: list_item pointer
offset 0x08-0x0D: MAC address (6 bytes)
offset 0x10: rx_queue handle
offset 0x14: task stack
offset 0x18: callback function pointer
offset 0x1C: tx_queue handle
offset 0x20-0x27: zeros (payload buffer start)
offset 0x28-0x3F: payload (24 bytes)
offset 0x40: payload length (byte)
```

#### Tasks no firmware original
- `TASK_SerialComunication` — programação de MACs via UART
- `TASK_RadioComunication` — RX handling
- `TASK_Advertise` — broadcast advertisement (descoberta)
- `TASK_HIT_COMPUTING` — ADC + compensação de impacto (4 zonas → 1 intensidade)
- `TASK_Behavior_main` — state machine (idle/ready/fighting/stopped)
- `sgcp_parseFrame` — parsing per-node

#### Funções-chave mapeadas em Ghidra
| Função (decompilada) | Nome real | Descrição |
|---|---|---|
| `FUN_4200b544` | `sgcp_sendPayload` | Envia dados (ref `SGCP.c:0x89`) |
| `FUN_4200b65c` | `__sgcp_add_node` | Adiciona node, copia MAC nos bytes 8-13 |
| `FUN_4200b87c` | `sgcp_add_unknowNode` | Cria node desconhecido |
| `FUN_4200b9f0` | `sgcp_init` | Inicialização |
| `FUN_4200b438` | `Parser_task` | Loop principal (recebe frames, compara MAC, despacha) |
| `FUN_4200b39c` | `IS_MY_FRAME` | Compara MAC src com node MAC |
| `FUN_4200bad0` | I²C write ADS1115 | Comunicação com ADC externo (lê bobinas) |

### 3.3 Engenharia reversa — pipeline e scripts

Localização: `C:\Users\User\Documents\JOGOS TAEKWONDO\`

**Binários:**
- `firmware_receptor_bom.bin` — dump original doador (NÃO MODIFICAR)
- `firmware_colete_bom.bin` — dump colete vermelho original
- `backup_firmware_receptor.bin` — cópia de segurança (mar/2026)
- `firmware_receptor_REPARADO_v{1..4}.bin` — tentativas iterativas
- `firmware_receptor_FINAL.bin` / `FINAL2.bin` — receptor reparado funcional
- `firmware_colete_AZUL.bin` — colete azul reparado (firmware do vermelho + MAC trocado)
- `colete_app.bin` / `receptor_app.bin` — slice do APP partition
- `seg0_*.bin` … `seg4_*.bin` — 5 segmentos de memória extraídos

**Análise:**
- `firmware_decompiled.c` — 4.5 MB, fonte master decompilada
- `all_decompiled.txt` — 2 MB, mesmo conteúdo plain text
- `receptor_app.elf` — 826 KB, ELF reconstruído pra Ghidra
- `sgcp_protocol.txt` — strings + funções SGCP mapeadas
- `sgcp_decompiled.txt` — funções SGCP isoladas

**Scripts Ghidra (Python):**
- `ghidra_import.py` / `ghidra_proper_import.py` — importam firmware
- `ghidra_add_drom.py` — adiciona segmento DROM
- `ghidra_export_all.py` / `ghidra_export_sgcp.py` — exporta strings
- `ghidra_find_sgcp.py` / `ghidra_deep_sgcp.py` — caça funções SGCP
- `ghidra_decompile_all.py` / `ghidra_decompile_sgcp.py` — decompila massa
- `ghidra_final.py` — fluxo consolidado
- `esp32s3_to_elf.py` — converte APP image em ELF
- Total: 11 scripts (10 ghidra_*.py + 1 esp32s3_to_elf.py)

**Ferramentas:**
- Ghidra 11.3 + JDK 21 (`$HOME/ghidra_install/`)
- Projeto Ghidra: `$HOME/ghidra_projects/EngFlexFirmware`
- esptool v5.2.0
- Arduino CLI v1.4.1
- ESP32 core v3.3.7

### 3.4 Firmware custom v5.1 (nosso receptor)

Firmware proprietário Sulsport substituindo o receptor original, escrito sobre o protocolo SGCP decodificado. **Não está no repo público SPE** — fica fora desta árvore (referência em [AUDIT.md](../AUDIT.md): `firmware/receptor_custom/receptor_custom.ino`, mas o arquivo não está no repo Git desta máquina, está com a ESP32-S3 avulsa MAC `1C:DB:D4:99:D4:B0`).

**Features (validadas em produção):**
- ESP-NOW encriptado com PMK+LMK corretos (compatibilidade total com coletes Sulsport)
- Peers registrados com `encrypt=true`
- Canal 1 (confirmado por teste, NVS indicava 13 mas estava errado)
- **Standby mode** — rádio desligado até app enviar `#START` (resolve timing issues)
- **App envia `#START` ao conectar USB, `#STOP` ao desconectar**
- Keepalive staggered: 1 peer/100 ms (receptor envia keepalives pros coletes)
- Coletes só transmitem ao detectar impacto (não enviam keepalive)
- **Anti-dupla:** first-hit-immediate + suppress 200 ms (ajustável via `#COOLDOWN`)
- **RSSI tracking** por device via modo promiscuo
- `#STATUS` a cada 2 s com canal/lock/RSSI/bateria/hits/uptime/cooldown
- `#WARN`/`#INFO` para alertas de sinal perdido/restaurado
- **Race condition** protegida com `portENTER_CRITICAL` (dual-core safe)
- Buffer serial limitado a 64 bytes (previne heap overflow)
- Dual serial (`Serial` + `Serial0`) pra compatibilidade com diferentes placas
- 149+ HITs validados de ColeteAzul (dev:1) e ColeteVerm (dev:2)
- **Compatível com S-FIGHT PRO e SPE** (mesmo formato wire da Sulsport original)

**Comandos serial reconhecidos pelo receptor v5.1:**
| Comando | Efeito |
|---|---|
| `#START` | Liga rádio, começa a parear coletes |
| `#STOP` | Desliga rádio (standby) |
| `#COOLDOWN <ms>` | Ajusta janela anti-dupla (default 200 ms) |
| `#STATUS` | Força emissão de status agora (normal: a cada 2 s) |

---

## 4. Software (App SPE)

### 4.1 Stack

Definido em [package.json](../package.json):

| Categoria | Tecnologia |
|---|---|
| Linguagem | TypeScript 5.8 |
| Framework | React 18.3 (com SWC) |
| Bundler | Vite 5.4 |
| UI Kit | shadcn/ui (Radix UI primitives) + Tailwind 3.4 |
| Roteamento | react-router-dom 6.30 |
| Form/Validação | react-hook-form 7.61 + Zod 3.25 |
| Cache server state | @tanstack/react-query 5.83 |
| Toast | sonner 1.7 |
| Ícones | lucide-react 0.462 |
| Auth/DB/Realtime | @supabase/supabase-js 2.90 |
| Desktop | electron 41 + electron-builder 26.8 |
| Updater | electron-updater 6.8 |
| Charts | recharts 2.15 |
| Testes | vitest 4.1 |

### 4.2 Arquitetura Electron multi-janela

Definida em [electron/main-championship.ts](../electron/main-championship.ts).

**Duas janelas:**

1. **Main window (operador)** — 1400×900, frame nativo Windows, `backgroundColor: #050507`
   - URL: `http://localhost:8081` (dev) ou `dist-championship/index-championship.html` (prod)
   - Carrega rotas `/championship/mat`, `/championship/hub`, etc
   - `backgroundThrottling: false` — não atrasa quando minimizada/desfocada (operador pode estar vendo TV)

2. **TV window (broadcast)** — fullscreen, frame oculto, abre em monitor secundário se disponível
   - Aberta sob demanda via IPC `open-tv-window`
   - Detecta múltiplos displays automaticamente (`screen.getAllDisplays()`)
   - Carrega rota `/championship/tv?mat=N&mode=...`

**IPC handlers definidos em main:**
- `open-tv-window(matId, mode?)` — abre TV em segundo monitor
- `close-tv-window` — fecha TV
- `get-displays` — info de todos os displays
- `check-for-updates` / `download-update` / `install-update` — auto-updater
- `get-app-version` / `get-updater-log-path` — diagnóstico

**File logger do updater:** `userData/updater.log` (rotação em ~256 KB).

**Auto-update:** electron-updater, `autoDownload=false`, `autoInstallOnAppQuit=true`. Check 5 s após boot em produção.

### 4.3 Roteamento e páginas

24 páginas em [src/pages/](../src/pages/). Principais do modo competição:

| Rota | Página | Função |
|---|---|---|
| `/` | [Index.tsx](../src/pages/Index.tsx) | Landing |
| `/login`, `/signup` | Login, Signup | Auth Supabase |
| `/mode-selector` | [ModeSelectorPage.tsx](../src/pages/ModeSelectorPage.tsx) | BÁSICO vs PROFISSIONAL |
| `/championship/hub` | [ChampionshipHub.tsx](../src/pages/ChampionshipHub.tsx) | Hub modo BÁSICO (3 botões grandes) |
| `/championship/mat` | [ChampionshipMat.tsx](../src/pages/ChampionshipMat.tsx) | **Placar do operador (página principal)** |
| `/championship/tv` | [ChampionshipTV.tsx](../src/pages/ChampionshipTV.tsx) | TV broadcast |
| `/championship/setup` | [TournamentSetup.tsx](../src/pages/TournamentSetup.tsx) | Chaveamento |
| `/championship/chamada` | [ChamadaPage.tsx](../src/pages/ChamadaPage.tsx) | Chamada de atletas |
| `/championship/central` | [CentralPage.tsx](../src/pages/CentralPage.tsx) | Central de comando do torneio |
| `/live/:academyId/:matId` | [LiveScore.tsx](../src/pages/LiveScore.tsx) | Placar online (mobile) |

Páginas de gestão acadêmica: `Dashboard`, `Students`, `StudentProfile`, `Ranking`, `Pricing`, `Admin`, `AdminSounds`, `Settings`, `PublicRegistration`, `DemoSetupPage`, `ProfessionalSelectorPage`, `HelpPage`, `NotFound`.

**Componentes do modo competição** (18 em [src/components/championship/](../src/components/championship/)):

| Componente | Função |
|---|---|
| `QuickMatchLayout` | UI principal compartilhada treino/competição |
| `ScoreboardMain` | Placar grande |
| `ScoringButtons` | Botões de pontuação manual |
| `EventLog`, `EventLogDialog` | Histórico de eventos da luta |
| `HardwarePanel` | Status dos 4 dispositivos + RSSI + bateria |
| `HardwareTestOverlay` | Teste sequencial dos 4 equipamentos |
| `DiagnosticsDialog` | Diagnóstico ImpactDetector |
| `CalibrationWizardDialog` | Wizard calibração noiseFloor |
| `MatchConfigDialog` | Config regras WT/local |
| `ScoreAdjustDialog` | Ajuste manual placar |
| `BracketView`, `NextMatchBar`, `TournamentHeader` | Chaveamento |
| `HelpDialog`, `OperatorPanel`, `StrikeIcon`, `NewSampleDialog` | Suporte |

### 4.4 Pipeline de impacto (end-to-end)

**Fluxo testado** em [src/lib/impactPipeline.test.ts](../src/lib/impactPipeline.test.ts) (35+ casos passando).

#### Estágio 1 — Web Serial (parsing)
[src/hooks/useSerialPort.ts](../src/hooks/useSerialPort.ts):

- Conexão: `navigator.serial.requestPort()` em 115200 baud, `8N1`
- Linha esperada: `"intensity,deviceId,battery"` (regex `/^\d+,\d+,\d+$/`)
- Validação: `intensity 0-255`, `deviceId 1-7`, `battery 0-100` — protege contra packets malformados/maliciosos
- Auto-reconnect: imediato + backoff exponencial (1s, 3s, 5s)
- Stage A: tentar portas conhecidas (sem popup); Stage B: `requestPort()` com 2 retries
- `sendCommand(cmd)` envia comando ao receptor (`#START` etc) — ASCII com `\n`

#### Estágio 2 — ImpactDetector (hysteresis + filtros)
[src/lib/impactDetector.ts](../src/lib/impactDetector.ts):

Algoritmo:
1. **Noise floor** (calibrado por device, salvo em localStorage)
2. **`startThreshold = noiseFloor[dev] + deltaStart(=4)`** — só inicia novo impact se intensity > threshold
3. **`continueThreshold = noiseFloor[dev] + deltaContinue(=2)`** — continua acumulando se intensity > threshold
4. **`silenceGapMs(=200)`** — finaliza impact se sem novos packets por 200 ms
5. **`maxDurationMs(=2000)`** — força finalização mesmo sem silence
6. **Wizard mode** — relaxa filtros pra calibração

Output: `FinalizedImpact` com `peakIntensity`, `avgIntensity`, `durationMs`, `packetCount`.

Flush a cada **30 ms** ([useSerialPort.ts:162](../src/hooks/useSerialPort.ts#L162)) durante conexão ativa.

#### Estágio 3 — classifyImpact (decisão de ponto)
Lógica em [ChampionshipMat.tsx](../src/pages/ChampionshipMat.tsx) (replicada em [impactPipeline.test.ts](../src/lib/impactPipeline.test.ts) pra teste isolado):

| Condição | Decisão |
|---|---|
| `matchStatus !== 'RUNNING'` | `NOT_RUNNING` (impact ignorado) |
| `deviceId` inválido (0, 5-7, 8+) | `INVALID_DEVICE` |
| `peakIntensity < hitMin` | `IGNORED` |
| Mesmo device, `endTs - lastTs < antiDupMs(=300)` | `DUPLICATE` |
| `peakIntensity >= pointMin` | `POINT` (+2 BODY ou +3 HEAD) |
| Caso restante | `HIT` (incrementa contador, não pontua) |

Thresholds atuais (defaults): `vestHitMin=5`, `vestPointMin=5`, `helmetHitMin=3`, `helmetPointMin=3`. Configuráveis em `MatchConfigDialog`.

⚠️ **Bug recorrente coberto por teste:** thresholds altos (30/30) salvos em localStorage de calibração corrompida → bloqueiam todos os chutes médios em produção. Cobertura: `'cenario bug real: thresholds altos (30/30) rejeitam chutes medios'`.

#### Estágio 4 — Sound + State update
[ChampionshipMat.tsx:78-103](../src/pages/ChampionshipMat.tsx#L78):

`soundActions` envolve `sync` proxy: ao chamar `addScore`, dispara também o som KPNP-style adequado:
- `speHitBody` — colete (+2)
- `speHitHead` — capacete (+3)
- `speHitPunch` — soco
- `speGamjeom` / `speGamjeomRemove` — punição
- `speManualAdd` / `speManualRemove` — ajuste manual
- `speRefereeCall` — tempo médico

### 4.5 Sincronização (3 camadas)

**Hook central:** [src/hooks/useChampionshipSync.ts](../src/hooks/useChampionshipSync.ts)

Modelo `master/listener`:
- **Master** = janela operador. Detém autoridade do estado, escreve em todos os canais.
- **Listener** = TV broadcast, LiveScore mobile. Só lê.

Camada | Mecanismo | Quando usa | Latência
---|---|---|---
**1. BroadcastChannel** | API web nativa | Mesma máquina, entre janelas (operador ↔ TV) | <5 ms
**2. Supabase Realtime** | Postgres `pg_notify` via WebSocket | Entre máquinas (operador ↔ LiveScore mobile, multi-mat) | ~100-300 ms
**3. localStorage** | Persistência | Reload de janela / recovery | imediato

Throttling:
- BroadcastChannel: throttle por delta de tempo pra evitar flood
- localStorage: throttle durante timer ticks (100ms)
- live_scores Supabase upsert: a cada 2 s

**Skip BC quando Realtime ativo:** se BroadcastChannel está rodando (mesma máquina), Realtime é ignorado pra evitar dupla aplicação.

### 4.6 Estado da partida

[src/types/championship.ts](../src/types/championship.ts) define `MatchState`:

- `config` — regras WT/local (rounds, tempo, gam-jeom rules, scoring presets)
- `status` — `IDLE | RUNNING | PAUSED | MEDICAL | ROUND_END | MATCH_END`
- `roundCurrent`, `timeLeftMs`, `roundScoreRed/Blue`, `gamjeomRed/Blue`
- `roundHistoryRed/Blue` — vencedores por round
- `events` — log até 500 eventos com timestamp + descrição
- Identificação: `matId`, `categoryId`, `matchId` (locked após sair de IDLE — vide [ChampionshipMat.tsx:135](../src/pages/ChampionshipMat.tsx#L135))

### 4.7 Persistência e hidratação

**localStorage** com chave `getStorageKey(matId)`:

- TTL 4 horas — descarta como abandono se mais antigo
- **Hidratação segura**: nunca resume `RUNNING`/`MEDICAL` (delta wall-clock incorreto durante downtime). Força `PAUSED` na restauração — operador resume conscientemente.
- Migration de configs antigas (rulesetVersion) via [src/lib/matchConfigMigration.ts](../src/lib/matchConfigMigration.ts)
- Default: `INITIAL_MATCH_STATE` se não houver state salvo

### 4.8 Hardware na UI

[src/components/championship/HardwarePanel.tsx](../src/components/championship/HardwarePanel.tsx):

- 4 cards (1 por device) com bateria + RSSI + flash visual ao receber hit
- Online se `lastSeen < 30 s atrás`
- Botão CONECTAR USB / CONECTADO (auto-reconnect on mount)
- Indicador "pacotes recebidos" (debug)

[src/components/championship/HardwareTestOverlay.tsx](../src/components/championship/HardwareTestOverlay.tsx) (refeito na rodada UX 18/abr/2026 — vide [handoff/HANDOFF.md](../handoff/HANDOFF.md)):
- Sequência forçada: `[blue-helmet, blue-chest, red-helmet, red-chest]`
- Atalhos `1-4` mapeiam pra ordem (não pros deviceId físicos)
- AlertDialog antes de "Começar de novo" se já há progresso
- Toasts a cada device verificado + toast final "Tudo pronto!"
- BroadcastChannel sync com TV pra mostrar mesmo overlay no segundo monitor

---

## 5. Modelo de produto

### 5.1 Dois modos no mesmo binário

**S-FIGHT PRO** (modo arcade) e **SPE Sulsport** (modo competição) compartilham:
- Mesma stack de UI
- Mesmo hardware
- Mesma camada de comunicação serial
- Mesmos sons (`speHit*`)
- `QuickMatchLayout` compartilhado (treino vs competição via prop)

Diferem em:
- Build separado (`vite.config.championship.ts` + `electron-builder-championship.yml`)
- Páginas dedicadas (modo competição tem chaveamento, IVR, Record Paper backlog)
- Auto-updater apontando pra repo público próprio (`postcopy/spe-releases`)

### 5.2 Versionamento

- **Versão atual:** 1.5.2 (vide [package.json](../package.json) + [CHANGELOG.md](../CHANGELOG.md))
- Releases via `/spe-release` slash command → `npm run electron:build:championship` + upload pro GitHub Releases (`postcopy/spe-releases`)
- Pré-publicação obrigatória: abrir `release-championship/win-unpacked/SPE Sulsport.exe` e validar (regra de ouro #5 do [CLAUDE.md](../CLAUDE.md))

### 5.3 Invariantes inegociáveis (do [CLAUDE.md](../CLAUDE.md))

1. **Confiabilidade** — erro em competição real custa medalha. Nada shipa sem validação.
2. **Paridade antes de inovação** — o que concorrente WT faz, SPE faz igual ou melhor antes de inovar.
3. **Homologação WT** — decisões hoje não fecham essa porta.

---

## 6. Limitações conhecidas

Source of truth: [AUDIT.md](../AUDIT.md). Resumo das categorias:

| Prioridade | Itens em aberto |
|---|---|
| **P0 WT 2026 Compliance** | `spinBody=4`, `spinHead=6`, `pointGap=15-20`, anti-stalling +2pts, audit trail gam-jeom |
| **P0 Segurança** | `SEC-001` PMK/LMK em plaintext no firmware custom |
| **P1 Reliability** | `AUD-001` SoundContext silent failure, `APP-001` callback `onImpact` null sem alerta |
| **P1 Hardware** | `HW-001` capacetes (devices 3,4) e juízes (5-7) nunca testados, `FW-001` firmware colete usa QMI8658 inexistente na placa VIEWE |
| **P2 UX** | `UX-001` anti-dupla 200 ms suprime dolyo duplo válido (UI faltante), `UX-002` `HardwarePanel` sem tooltip OFF |
| **P2 Firmware** | `FW-002` canal Wi-Fi não persiste em NVS, `HW-002` dual serial duplica linhas |
| **P3 Quality** | `LOG-001` overhead de logs, `TEST-001` cobertura faltante em parsers, `BUILD-001` Electron main não lintado, `TYPE-001` 15+ `(window as any)` |

UI: [UI-AUDIT.md](../UI-AUDIT.md) cobre aderência à skill `spe-ui-design v2.0`.

---

## 7. Glossário

| Termo | Significado |
|---|---|
| **WT** | World Taekwondo (federação internacional) |
| **PSS** | Protector & Scoring System (categoria de produto) |
| **CHUNG** | Atleta azul (sempre à esquerda no placar) |
| **HONG** | Atleta vermelho (sempre à direita) |
| **Shijak** | "Comece" (início de luta/round) |
| **Kal-yeo** | "Pare" (pausa) |
| **Kyeshi** | Tempo médico |
| **Gam-jeom** | Punição (-1 pra quem errou, +1 pro adversário) |
| **Dolyo chagi** | Chute circular |
| **PMK / LMK** | Pairwise/Local Master Key (ESP-NOW encryption) |
| **SGCP** | Protocolo proprietário Sulsport/TECNOFLEX (decodificado abr/2026) |
| **EngFlex** | Marca comercial da TECNOFLEX (fabricante OEM da placa) |
| **TECNOFLEX** | Razão social do fabricante OEM |
| **IVR** | Instant Video Review (revisão por vídeo solicitada por técnico) |
| **FOB** | Fancy On/Off Bar (toggle elementos de exibição da TV) |
| **Mat** | Tatame (em competição com múltiplas áreas, cada uma é um Mat) |
| **Bracket** | Chaveamento |
| **Record Paper** | Folha oficial WT do final da luta (PDF) |

---

## 8. Referências

### Docs do projeto
- [CLAUDE.md](../CLAUDE.md) — guidelines comportamentais (raiz)
- [AUDIT.md](../AUDIT.md) — pendências funcionais
- [UI-AUDIT.md](../UI-AUDIT.md) — pendências visuais
- [.spe/SESSIONS.md](../.spe/SESSIONS.md) — log de decisões de processo
- [.spe/KPNP-ALIGNMENT-PLAN.md](../.spe/KPNP-ALIGNMENT-PLAN.md) — alinhamento com KPNP PSS
- [handoff/HANDOFF.md](../handoff/HANDOFF.md) — handoff usabilidade abr/2026
- [docs/RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) — release process
- [docs/DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md) — DoD por tipo de feature

### Código central
- [package.json](../package.json) — stack
- [electron/main-championship.ts](../electron/main-championship.ts) — Electron entry (modo competição)
- [src/hooks/useSerialPort.ts](../src/hooks/useSerialPort.ts) — Web Serial API
- [src/hooks/useChampionshipSync.ts](../src/hooks/useChampionshipSync.ts) — sync master/listener
- [src/lib/impactDetector.ts](../src/lib/impactDetector.ts) — hysteresis pipeline
- [src/lib/impactPipeline.test.ts](../src/lib/impactPipeline.test.ts) — testes E2E pipeline
- [src/lib/deviceMapping.ts](../src/lib/deviceMapping.ts) — IDs ↔ atletas
- [src/types/serial.ts](../src/types/serial.ts) — tipos protocolo wire
- [src/types/championship.ts](../src/types/championship.ts) — tipos MatchState
- [src/contexts/SerialPortContext.tsx](../src/contexts/SerialPortContext.tsx) — provider serial
- [src/pages/ChampionshipMat.tsx](../src/pages/ChampionshipMat.tsx) — página principal operador

### Engenharia reversa firmware
Localização: `C:\Users\User\Documents\JOGOS TAEKWONDO\` (fora do projeto)

- `firmware_decompiled.c` — 4445 funções decompiladas
- `firmware_*_bom.bin` — dumps originais
- `firmware_*_FINAL2.bin` — versões reparadas funcionais
- `receptor_app.elf` — ELF reconstruído
- `ghidra_*.py` — 10 scripts de automação Ghidra
- `sgcp_protocol.txt` — strings + funções SGCP

### Hardware
Sem schematic em arquivo — controlado pelo fabricante (TECNOFLEX). Dependência aberta.

---

## Changelog deste doc

- **2026-04-28** — v1.0 criado. Síntese inicial cobrindo hardware Sulsport V2-C (descoberto após confusão com "EngFlex"), firmware SGCP, app Electron + React + Supabase, pipeline de impacto. Base pra futuras decisões de produto e adaptações vs concorrência (KPNP, Daedo).
