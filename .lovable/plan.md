
# Redesign: Loading Screen — System Boot Sequence

## Resumo

Substituir a tela de carregamento atual (imagem S-FIGHT-MODO.jpg com barra fina) por uma sequencia de boot cinematica no estilo Industrial Cyber/Brutalista, com porcentagem gigante, barra industrial, logs de terminal animados e branding tecnico.

## Alteracoes

### 1. `src/components/game/LoadingScreen.tsx` — Reescrever o componente

**Remover:**
- Import e uso da imagem `S-FIGHT-MODO.jpg`
- Componente `Progress` do radix
- Layout antigo (imagem fullscreen + overlay + barra fina)

**Adicionar:**

- **Background**: Fundo `bg-[#0b1120]` (Dark Slate do projeto) com vinheta pesada via `box-shadow inset` e efeito sutil de scanlines via pseudo-elemento CSS

- **Header tecnico**: Texto `S-FIGHT ARENA OS [VERSION 2.1.0]` em `font-mono text-xs text-white/40` no topo

- **Porcentagem gigante central**: Numero `{Math.round(progress)}%` em `text-[120px] font-mono font-black italic text-[#FFD700]` com efeito de glitch/tremor via animacao CSS

- **Barra de progresso industrial**: `h-6` com bordas retas (sem rounded), trilho cinza escuro com marcacoes de regua (ticks a cada 10%), preenchimento amarelo `#FFD700` com efeito de pulso eletrico na ponta

- **Logs do sistema**: Estado local com array de mensagens de terminal que vao aparecendo progressivamente conforme o progresso avanca. Fonte `font-mono text-xs text-cyan-500/60`. Mensagens como:
  ```
  > INITIALIZING CORE KERNEL... OK
  > LOADING ARENA ASSETS [MODULE 1/4]...
  > ESTABLISHING NEURAL LINK PROTOCOL...
  > CALIBRATING SENSORS...
  > SYSTEM INTEGRITY CHECK... PASSED
  > WARNING: HIGH VOLTAGE DETECTED
  > ALL SYSTEMS OPERATIONAL
  ```

- **Fade-out**: Manter a transicao `opacity-0 scale-105` de 700ms ao completar

### 2. `src/index.css` — Adicionar animacoes

Adicionar no bloco de utilities:

- `@keyframes glitch-shake` — tremor sutil e rapido para o numero de porcentagem (translateX alternando entre -2px e 2px com intervalos irregulares)
- `@keyframes scanline` — linhas horizontais translucidas descendo lentamente pela tela
- `@keyframes pulse-tip` — brilho pulsante na ponta da barra de progresso
- `.boot-scanlines::after` — pseudo-elemento com gradiente repeating-linear para efeito de monitor antigo

### Estrutura do novo componente (simplificada)

```text
+-----------------------------------------------+
|  S-FIGHT ARENA OS [VERSION 2.1.0]             |  <- header mono
|                                                 |
|                                                 |
|                  75%                            |  <- gigante, amarelo, glitch
|          [=======>          ]                   |  <- barra grossa, industrial
|                                                 |
|  > INITIALIZING CORE KERNEL... OK               |  <- logs cyan
|  > LOADING ARENA ASSETS [MODULE 2/4]...         |
|  > CALIBRATING SENSORS...                       |
+-----------------------------------------------+
```

### Arquivos alterados

| Arquivo | Acao |
|---------|------|
| `src/components/game/LoadingScreen.tsx` | Reescrever visual completo |
| `src/index.css` | Adicionar keyframes glitch-shake, scanline, pulse-tip |
