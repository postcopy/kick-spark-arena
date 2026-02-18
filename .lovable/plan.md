

# Refatorar LoadingScreen: Imagem como Plano de Fundo

## Resumo

Transformar a imagem `S-FIGHT-MODO.jpg` de elemento centralizado para plano de fundo fullscreen com overlay escuro, barra de progresso na parte inferior e animacao de saida unificada.

## Alteracoes

### Arquivo: `src/components/game/LoadingScreen.tsx`

Reestruturar o JSX do `return` para:

1. **Container principal**: `div` com `fixed inset-0 z-50 overflow-hidden`. A animacao de fade-out (`opacity-0 scale-105 transition-all duration-700`) sera aplicada neste container, fazendo tudo desaparecer junto.

2. **Imagem de fundo**: `img` com `absolute inset-0 w-full h-full object-cover z-0` -- preenche toda a tela sem distorcao.

3. **Overlay escuro**: `div` com `absolute inset-0 bg-black/60 z-10` -- garante contraste para texto e barra.

4. **Barra de progresso + texto**: Container posicionado na parte inferior com `absolute bottom-10 left-0 right-0 z-20 flex flex-col items-center`. Barra com `max-w-[500px] w-full` (mais larga que os 400px atuais). Texto branco (`text-white/60`).

5. **Remover**: O wrapper centralizado atual (`flex flex-col items-center justify-center`) e o `max-w-[500px] px-4` da imagem.

6. **Manter**: Toda a logica de estados (`progress`, `isComplete`, `isFadingOut`), os useEffects de audio e a animacao de glow (removida pois nao faz sentido no fundo -- a imagem de fundo nao precisa de glow pulsante).

### Estrutura final do JSX

```text
<div className="fixed inset-0 z-50 overflow-hidden transition-all duration-700 [fade-out classes]">
  <!-- Imagem de fundo -->
  <img src={sfightLogo} className="absolute inset-0 w-full h-full object-cover z-0" />

  <!-- Overlay escuro -->
  <div className="absolute inset-0 bg-black/60 z-10" />

  <!-- Barra + texto no rodape -->
  <div className="absolute bottom-10 left-0 right-0 z-20 flex flex-col items-center px-6">
    <Progress value={progress} className="h-2 max-w-[500px] w-full" />
    <p className="text-sm text-white/60 font-mono mt-3">...</p>
  </div>
</div>
```

### Arquivos nao alterados
- `src/index.css` -- o keyframe `logo-glow` pode ficar (nao causa problemas), mas nao sera mais usado
- Nenhum outro arquivo afetado
