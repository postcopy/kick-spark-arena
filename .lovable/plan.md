

# Remover "Meus Alunos" do Menu

Remover o item "Meus Alunos" do menu lateral (`MenuDrawer`), já que o Dashboard agora cobre essa funcionalidade.

## O que será feito

**Arquivo:** `src/components/game/MenuDrawer.tsx`

- Remover o bloco do link "Meus Alunos" (com ícone Users e link para `/students`)
- Remover o import `Users` do lucide-react se não for usado em outro lugar

Mudança simples de remoção de ~10 linhas.

