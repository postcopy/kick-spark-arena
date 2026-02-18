
# Redesign da LoadingScreen com Logo S-FIGHT MODO

## Resumo

Substituir o layout atual (icone spinner + barra de progresso) por uma splash screen cinematografica centrada na logo "S-FIGHT MODO", com efeito de brilho pulsante durante o carregamento e transicao fade-out + scale-up ao finalizar.

## Alteracoes

### 1. Copiar imagem para o projeto

Copiar `user-uploads://S-FIGHT-MODO.jpg` para `src/assets/S-FIGHT-MODO.jpg` e importar como modulo ES6 no componente.

### 2. `src/components/game/LoadingScreen.tsx` -- Redesign completo

**Layout:**
- Fundo escuro `bg-[#0b1120]` em tela cheia
- Logo centralizada (max-width ~500px, responsivo)
- Barra de progresso fina e discreta abaixo da logo (mantida para feedback visual)
- Texto de status pequeno abaixo da barra

**Efeito de brilho pulsante (durante carregamento):**
- Aplicar animacao CSS `animate-pulse` customizada na logo com `drop-shadow` cyan/azul brilhante, similar ao estilo da propria imagem
- Usar classe com keyframes que alterna opacidade do glow (ex: `0% -> shadow forte`, `50% -> shadow suave`, `100% -> shadow forte`)

**Transicao ao completar (onReady):**
- Quando `isComplete = true`, ao inves de chamar `onReady()` imediatamente, adicionar estado `isFadingOut`
- Aplicar classes `opacity-0 scale-110` com `transition-all duration-700` na logo
- Apos a transicao CSS terminar (~700ms), chamar `onReady()`

**Fluxo de estados:**

```text
[Carregando]                    [Completo]                [Fade-out]
Logo pulsando brilho     ->     setIsComplete(true)  ->   isFadingOut=true
Barra de progresso               Progresso 100%           opacity-0 scale-110
Texto "Carregando..."                                     Apos 700ms -> onReady()
```

### 3. `src/index.css` -- Keyframe de glow (opcional)

Adicionar keyframe `logo-glow` para o efeito de brilho pulsante:

```text
@keyframes logo-glow {
  0%, 100% { filter: drop-shadow(0 0 20px rgba(34,211,238,0.6)) drop-shadow(0 0 40px rgba(34,211,238,0.3)); }
  50% { filter: drop-shadow(0 0 10px rgba(34,211,238,0.2)) drop-shadow(0 0 20px rgba(34,211,238,0.1)); }
}
```

### Arquivos alterados
- `src/components/game/LoadingScreen.tsx` -- redesign visual
- `src/index.css` -- keyframe `logo-glow`
- `src/assets/S-FIGHT-MODO.jpg` -- novo asset (copia)
