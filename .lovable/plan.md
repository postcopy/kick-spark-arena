

# Fix: Conexao Serial Unica Compartilhada Entre Todos os Modos

## O Problema

Existem duas instancias independentes de `useSerialPort`:
- `Index.tsx` (modos Time Attack, Arcade, Reaction) em `/`
- `ChampionshipMat.tsx` (modo Campeonato) em `/championship/mat`

Quando o usuario navega entre as paginas, a instancia anterior e destruida e uma nova e criada, exigindo reconexao manual.

## A Solucao: SerialPortContext (Provider Global)

Criar um React Context que encapsula `useSerialPort` no nivel do App, acima de todas as rotas. Todas as paginas consomem a mesma instancia via `useContext`.

---

## Arquivos

| Arquivo | Acao |
|---------|------|
| `src/contexts/SerialPortContext.tsx` | **NOVO** - Context + Provider |
| `src/App.tsx` | Editar - Envolver rotas com `SerialPortProvider` |
| `src/pages/Index.tsx` | Editar - Trocar `useSerialPort()` local por `useSerialPortContext()` |
| `src/pages/ChampionshipMat.tsx` | Editar - Trocar `useSerialPort()` local por `useSerialPortContext()` |

---

## Detalhes Tecnicos

### 1. SerialPortContext.tsx (Novo)

```text
SerialPortProvider
  |-- useSerialPort({ onKick: noop, onRawPacket, onImpact })
  |-- Expoe: serialPort (connect/disconnect/equipment/etc)
  |-- Expoe: registerKickHandler(fn) / registerImpactHandler(fn)
  |-- Expoe: registerRawPacketHandler(fn)
```

O desafio principal: os callbacks `onKick` e `onImpact` precisam variar conforme o modo ativo. A solucao e usar **refs de callback** dentro do Provider:

- O Provider cria o `useSerialPort` com callbacks que delegam para refs
- Cada pagina registra seus callbacks via `registerKickHandler(fn)` e `registerImpactHandler(fn)` no mount
- Quando o usuario navega, a pagina nova registra seus handlers — a conexao serial permanece intacta

### 2. App.tsx

Envolver `<BrowserRouter>` com `<SerialPortProvider>`:

```text
QueryClientProvider
  AuthProvider
    SoundProvider
      SerialPortProvider    <-- NOVO
        TooltipProvider
          BrowserRouter
            Routes...
```

### 3. Index.tsx

- Remover a chamada local `useSerialPort({ onKick, debounceMs })`
- Importar `useSerialPortContext()`
- No mount, registrar o `handleSerialKick` como kick handler
- Usar `serialPort` do context (connect/disconnect/equipment)

### 4. ChampionshipMat.tsx

- Remover a chamada local `useSerialPort({ onKick, onRawPacket, onImpact, ... })`
- Importar `useSerialPortContext()`
- No mount, registrar `handleImpact` como impact handler e `onRawPacket` como raw handler
- Usar `serialPort` do context (connect/disconnect/equipment)

---

## Fluxo do Usuario (Depois)

1. Usuario abre o app (`/`)
2. Clica "Conectar placa USB" na EquipmentSetupScreen
3. Conexao estabelecida (uma unica vez)
4. Joga Time Attack, Arcade, etc — tudo funciona
5. Navega para Campeonato (`/championship/mat`) — **conexao permanece ativa**
6. Volta para `/` — **conexao permanece ativa**
7. Nunca mais precisa reconectar (a menos que desconecte manualmente ou desplugue o USB)

---

## Configuracao do ImpactDetector

O `useSerialPort` aceita `impactDetectorConfig` que hoje so e usado no Championship. No Provider global, teremos duas opcoes:

- **Opcao A**: Sempre ativar o ImpactDetector globalmente (custo computacional minimo)
- **Opcao B**: Expor `setImpactDetectorConfig(config)` no context para cada pagina configurar quando necessario

Recomendacao: **Opcao B** — o Championship registra seu config ao montar, e ao desmontar ele desativa. Os outros modos nao precisam do ImpactDetector.

---

## O Que NAO Muda

- API do `useSerialPort` hook (permanece identica internamente)
- Logica de parsing serial, debounce, equipment tracking
- EquipmentSetupScreen (ja recebe `serialPort` via props)
- Diagnostics, calibration wizard
- Nenhuma tabela ou backend

