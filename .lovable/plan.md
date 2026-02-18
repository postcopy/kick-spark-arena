

# Adicionar Imagem de Fundo ao Menu de Selecao de Modos

## Resumo

Usar a imagem `menu-modos.jpg` como plano de fundo fullscreen na `HomeScreen` (tela de selecao de modos), substituindo o fundo solido `#0b1120` atual. Adicionar overlay escuro para manter legibilidade dos cards e textos.

## Alteracoes

### 1. Copiar imagem para o projeto

Copiar `user-uploads://menu-modos.jpg` para `src/assets/menu-modos.jpg`.

### 2. `src/components/game/HomeScreen.tsx`

- Importar a imagem: `import bgMenuModos from '@/assets/menu-modos.jpg'`
- No container raiz, remover o `style={{ background: '#0b1120' }}` e tornar o fundo `relative`
- Adicionar a imagem como fundo absoluto (`absolute inset-0 w-full h-full object-cover z-0`)
- Adicionar overlay `absolute inset-0 bg-black/60 z-0` sobre a imagem
- Envolver header, main e footer em um wrapper `relative z-10` para ficarem acima do overlay
- Manter toda a logica e estilos dos cards, header e footer inalterados

### Estrutura final

```text
<div className="flex flex-col h-full w-full overflow-hidden relative">
  <!-- Imagem de fundo -->
  <img src={bgMenuModos} className="absolute inset-0 w-full h-full object-cover z-0" />
  <!-- Overlay -->
  <div className="absolute inset-0 bg-black/60 z-[1]" />

  <!-- Conteudo existente com z-10 -->
  <div className="relative z-10 flex flex-col h-full w-full">
    <header>...</header>
    <main>...</main>
    <footer>...</footer>
  </div>
</div>
```

### Arquivos alterados
- `src/assets/menu-modos.jpg` -- novo asset
- `src/components/game/HomeScreen.tsx` -- fundo com imagem + overlay

