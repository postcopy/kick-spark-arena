

## Plano: Simplificar Tela de Preparar Equipamentos

### Objetivo

Remover a seção de dispositivos (coletes/capacetes) e manter apenas a conexão da placa USB, já que os equipamentos se conectam automaticamente quando ligados.

---

### Layout Simplificado

```text
┌─────────────────────────────────────────────────────────────────┐
│  ← Voltar                    [LOGO]                             │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│                   Conectar Placa USB                            │
│           Conecte a placa no USB do computador                  │
│                                                                 │
│     ┌─────────────────────────────────────────────────────┐     │
│     │  Placa USB                              [Conectada] │     │
│     │  Clique para permitir o acesso no navegador         │     │
│     │                                                     │     │
│     │  ● Navegador: Web Serial OK                         │     │
│     │  ● Placa: Conectada                                 │     │
│     │                                                     │     │
│     │  [Conectar placa USB]  ou  [Desconectar]           │     │
│     └─────────────────────────────────────────────────────┘     │
│                                                                 │
│─────────────────────────────────────────────────────────────────│
│            [Continuar →]  ou  [Pular (modo teste)]              │
└─────────────────────────────────────────────────────────────────┘
```

---

### O que será removido

| Elemento | Status |
|----------|--------|
| Card "2) Dispositivos" inteiro | REMOVER |
| Lista de coletes e capacetes | REMOVER |
| Componentes VestIcon, HelmetIcon | REMOVER |
| Componente IndicadorBateria | REMOVER |
| Constante EQUIPAMENTOS | REMOVER |
| Constante STALE_MS | REMOVER |
| Lógica useMemo para lista | REMOVER |
| Contagem `onlineCount` | REMOVER |
| Condições `prontoTotal`/`prontoMinimo` | SIMPLIFICAR |

---

### O que será mantido

| Elemento | Status |
|----------|--------|
| Card "Placa USB" | MANTER |
| Verificação do navegador (Web Serial) | MANTER |
| Botão "Conectar placa USB" | MANTER |
| Botão "Desconectar" | MANTER |
| Link "Pular e usar teclado" | MANTER |
| Componentes BolinhaStatus e Selo | MANTER |

---

### Nova Lógica do Footer

Simplificar para apenas duas condições:

1. **Placa conectada** → Mostrar botão "Continuar →" verde
2. **Placa não conectada** → Mostrar mensagem + link "Pular (modo teste)"

---

### Arquivo a Modificar

**`src/components/game/EquipmentSetupScreen.tsx`**

**Mudanças principais:**
1. Remover linhas 14-33 (constantes STALE_MS e EQUIPAMENTOS)
2. Remover linhas 69-108 (componentes IndicadorBateria, VestIcon, HelmetIcon)
3. Remover linhas 116-145 (lógica useMemo e contagens)
4. Remover linhas 243-298 (Card "2) Dispositivos")
5. Simplificar footer (linhas 301-354) para apenas verificar `placaConectada`
6. Atualizar título e descrição

---

### Código Simplificado do Footer

```typescript
{/* Footer / CTA */}
<div className="mt-auto pt-6">
  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur">
    {placaConectada ? (
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2 text-emerald-200">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-lg font-semibold">PLACA CONECTADA!</span>
        </div>
        <button
          type="button"
          onClick={onContinue}
          className="w-full max-w-md min-h-12 rounded-2xl bg-emerald-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          Continuar →
        </button>
      </div>
    ) : (
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="text-sm text-white/70">
          Conecte a placa USB para começar.
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="text-xs text-white/60 underline hover:text-white/80"
        >
          Pular e usar teclado (modo teste)
        </button>
      </div>
    )}
  </div>
</div>
```

---

### Seção Técnica

**Arquivo:** `src/components/game/EquipmentSetupScreen.tsx`

**Linhas a remover/modificar:**
- Linhas 14-33: Remover STALE_MS e EQUIPAMENTOS
- Linhas 69-108: Remover IndicadorBateria, VestIcon, HelmetIcon
- Linhas 116-118: Remover `agora`, `mapa`, `versao`
- Linhas 120-145: Remover useMemo e contagens (onlineCount, prontoTotal, prontoMinimo)
- Linhas 169-172: Atualizar texto de instrução (remover passo 2)
- Linhas 243-298: Remover Card "2) Dispositivos" inteiro
- Linhas 301-354: Simplificar footer

**Impacto:**
- Arquivo fica ~200 linhas mais curto
- Tela mais limpa e focada na conexão USB
- Props `serialPort.equipment` e `serialPort.equipmentVersion` não serão mais usadas neste componente (mas permanecem disponíveis para uso futuro)

