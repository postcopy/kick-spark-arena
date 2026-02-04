
# Mover "Luta Encerrada" para o Centro da Tela

## Situacao Atual

O feedback de fim de luta está no **OperatorPanel** (sidebar direita):
- Seção roxa com "LUTA ENCERRADA"
- Botão "INICIAR NOVA LUTA"
- Pequeno e pouco visível durante operação

```text
+---------------------------+----------+
|                           | LUTA     |
|      ScoreboardMain       | ENCERRADA|
|  (apenas vencedor pequeno)|          |
|                           | [BOTÃO]  |
+---------------------------+----------+
```

## Solucao Proposta

Criar um **overlay central** sobre o ScoreboardMain quando `status === 'MATCH_END'`:

```text
+-------------------------------------+
|          ScoreboardMain             |
|  +-------------------------------+  |
|  |     LUTA ENCERRADA            |  |
|  |                               |  |
|  |     HONG VENCEU               |  |
|  |     (ou estatísticas)         |  |
|  |                               |  |
|  |   [INICIAR NOVA LUTA]         |  |
|  +-------------------------------+  |
+-------------------------------------+
```

---

## Arquivos a Modificar

### 1. ScoreboardMain.tsx

Adicionar overlay de fim de luta centralizado:

```tsx
{isMatchEnd && (
  <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
    <div className="text-center">
      <h2 className="text-3xl font-bold text-purple-400 uppercase mb-4">
        LUTA ENCERRADA
      </h2>
      <p className="text-xl text-white mb-6">
        {winner} VENCEU
      </p>
      <Button onClick={onResetMatch}>
        INICIAR NOVA LUTA
      </Button>
    </div>
  </div>
)}
```

- Adicionar `onResetMatch` como prop do componente
- Adicionar `position: relative` no container pai

### 2. ChampionshipMat.tsx

Passar a função `resetMatch` para o ScoreboardMain:

```tsx
<ScoreboardMain 
  state={sync.state} 
  onResetMatch={() => setShowResetDialog(true)}
/>
```

### 3. OperatorPanel.tsx

Remover a seção "LUTA ENCERRADA" do topo (linhas 84-107), mantendo apenas na área de configurações o botão "NOVA LUTA" como opção secundária.

---

## Detalhes Visuais

O overlay central terá:
- Fundo semi-transparente escuro (`bg-black/80`)
- Texto "LUTA ENCERRADA" em destaque (roxo/dourado)
- Nome do vencedor com cor do lado (azul ou vermelho)
- Botão grande e claro para iniciar nova luta
- Estatísticas opcionais (pontos, gam-jeoms, etc)

## Benefícios

| Antes | Depois |
|-------|--------|
| Ação escondida na sidebar | Ação central e visível |
| Fácil de perder | Impossível de ignorar |
| Requer olhar para o lado | Foco natural no centro |
