

# Redesign: Tela de Conexao (System Boot) + Auto-Connect Fix

## Resumo

Duas mudancas: (1) expor estado de auto-reconexao no hook serial para que a UI saiba quando esta tentando reconectar automaticamente, e (2) redesign completo do EquipmentSetupScreen com visual "System Boot" estilo terminal/hardware.

---

## Arquivos

| Arquivo | Acao |
|---------|------|
| `src/hooks/useSerialPort.ts` | Editar - Adicionar estado `isAutoConnecting` |
| `src/types/serial.ts` | Editar - Adicionar `isAutoConnecting` ao `UseSerialPortReturn` |
| `src/components/game/EquipmentSetupScreen.tsx` | Reescrever - Novo visual "System Boot" |

---

## Parte 1: Auto-Connect com Feedback Visual

### useSerialPort.ts

O auto-reconnect ja existe (linhas 376-411), mas nao expoe estado visual. Alteracoes:

1. Adicionar `const [isAutoConnecting, setIsAutoConnecting] = useState(false)`
2. No `tryAutoReconnect()`:
   - Setar `setIsAutoConnecting(true)` antes de tentar
   - Setar `setIsAutoConnecting(false)` ao terminar (sucesso ou falha)
3. Retornar `isAutoConnecting` no objeto de retorno

### types/serial.ts

Adicionar `isAutoConnecting: boolean` ao `UseSerialPortReturn`.

---

## Parte 2: Redesign Visual - "System Boot"

### Conceito

Abandonar o visual de card/formulario. Adotar estetica de inicializacao de hardware com:
- Fundo escuro translucido com borda ciano
- Icone central grande (Cpu do lucide-react) com estados visuais distintos
- Checklist estilo terminal (font-mono)
- Botao de acao grande e luminoso

### Estados Visuais

**Auto-Conectando** (isAutoConnecting = true):
- Icone Cpu com `animate-pulse` em ciano
- Texto: "BUSCANDO HARDWARE..." em font-mono
- Barra de progresso indeterminada (animate-pulse)
- Botao escondido

**Desconectado** (aguardando acao manual):
- Icone Cpu grande (`w-20 h-20`) em cinza (`text-slate-600`)
- Titulo: "AGUARDANDO CONEXAO" em font-mono text-cyan-400
- Checklist terminal:
  - `[OK]` Compatibilidade do Navegador (se suportado)
  - `[..]` Permissao de Acesso USB
  - `[..]` Handshake do Equipamento
- Botao grande: "INICIALIZAR CONEXAO"
  - `bg-cyan-600 hover:bg-cyan-500 text-white font-bold tracking-widest uppercase py-4 px-8`
  - `shadow-[0_0_20px_rgba(8,145,178,0.4)]`

**Conectando** (isConnecting = true):
- Icone Cpu com `animate-spin` em amarelo
- Texto: "CONECTANDO..." 
- Botao desabilitado

**Conectado** (isConnected = true):
- Icone Cpu em verde com glow: `text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.8)]`
- Titulo: "SISTEMA ONLINE" com animacao de entrada
- Checklist tudo `[OK]` em verde
- Botao "CONTINUAR" grande em emerald
- Link discreto "Desconectar" abaixo

### Estrutura do Componente

```text
div (h-full w-full flex items-center justify-center)
  |-- OctagonBackground (mantido)
  |-- div (container central, max-w-lg, bg-[#0b1120]/90 backdrop-blur-md border-cyan-500/30)
  |     |-- header (botao Voltar + logo, compacto)
  |     |-- icone central (Cpu, tamanho grande, estados visuais)
  |     |-- titulo + subtitulo (font-mono)
  |     |-- checklist terminal (3 itens, font-mono text-sm)
  |     |-- botao de acao (ou feedback auto-connect)
  |     |-- link "Pular" (discreto, sempre visivel quando nao conectado)
```

### Checklist Terminal

Cada item usa prefixo de status colorido:

```text
[OK] = text-emerald-400
[..] = text-slate-500 (animate-pulse quando relevante)
[!!] = text-red-400 (erro)
```

Items:
1. "Compatibilidade do Navegador" - OK se `isSupported`, !! se nao
2. "Permissao de Acesso USB" - OK se conectado, .. se aguardando
3. "Handshake do Equipamento" - OK se conectado, .. se aguardando

### Alerta de Navegador Incompativel

Se `!isSupported`, substituir o checklist e botao por um alerta:
- Borda vermelha, texto informando para usar Chrome/Edge
- Sem botao de conectar (impossivel)

---

## O Que NAO Muda

- Props do componente (`serialPort`, `onContinue`, `onSkip`, `onBack`)
- Logica de conexao do `useSerialPort` (apenas exposicao de estado novo)
- Contexto `SerialPortContext` (passa `isAutoConnecting` transparentemente)
- Integracao com as paginas (`Index.tsx`, `ChampionshipMat.tsx`)

