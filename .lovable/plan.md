

# Layout Responsivo - Modo Reacao

## Diagnostico

### ReactionSetupScreen.tsx - JA ESTA OK
O arquivo ja possui a estrutura flex correta com header fixo (`flex-shrink-0`), area central com scroll (`flex-1 min-h-0 overflow-y-auto`), e footer fixo (`flex-shrink-0`). Nenhuma alteracao necessaria neste arquivo.

### ReactionScreen.tsx - Precisa de ajuste
As unidades `vw` causam elementos gigantes em telas widescreen que cortam verticalmente.

## Alteracoes (apenas ReactionScreen.tsx)

### 1. Container principal (linha 112)
- Adicionar `overflow-hidden` para evitar scrollbar fantasma
- De: `h-full w-full flex flex-col bg-slate-950 pb-24 relative`
- Para: `h-full w-full flex flex-col bg-slate-950 pb-24 relative overflow-hidden`

### 2. Timer gigante (linha 139)
- De: `fontSize: 'clamp(4rem, 12vw, 8rem)'`
- Para: `fontSize: 'clamp(4rem, 15vh, 10rem)'`

### 3. Circulo de estimulo (linhas 153-154)
- De: `width/height: 'clamp(180px, 40vw, 350px)'`
- Para: `width/height: 'clamp(150px, 35vmin, 320px)'`

### 4. Timer de descanso (linha 100)
- De: `text-[clamp(80px,22vw,200px)]`
- Para: `text-[clamp(60px,20vh,180px)]`

### 5. Container de descanso (linha 88)
- Adicionar `overflow-hidden` ao container de descanso tambem

## Resumo
- 1 arquivo alterado: `ReactionScreen.tsx`
- 0 arquivos criados
- Apenas mudancas de CSS (unidades de medida), sem logica alterada
- O setup screen ja esta correto e nao precisa de mudancas

