
# Polimento Industrial Cyber — Time Attack HUD

## Resumo

Aplicar 4 refinamentos visuais ao HUD Arena Monitor do modo Time Attack individual em `GameScreen.tsx`, reforçando a estética "Industrial Cyber / HUD de vidro".

## Alterações

### Arquivo: `src/components/game/GameScreen.tsx`

#### 1. Cards da Esquerda — Estilo "HUD de vidro"

Remover `bg-white/5 backdrop-blur rounded-xl` dos dois cards de estatística. Manter apenas `border border-white/10 p-6` com texto alinhado à esquerda, para parecerem dados projetados em vidro transparente.

#### 2. Barra de Tempo — Trilho + Glow Neon

Adicionar trilho visível `bg-white/8 rounded-full` como container da barra de progresso. Aplicar `box-shadow` neon na barra colorida com a mesma cor dinâmica (verde/amarelo/vermelho) para efeito luminoso.

#### 3. Background — Imagem dos Modos com Opacidade

Importar `bgMenuModos` (já disponível em `src/assets/menu-modos.jpg`) e adicioná-lo como imagem de fundo absoluta com `opacity-[0.07]` atrás de todo o conteúdo individual, substituindo o fundo sólido vazio.

#### 4. Hero Counter — Aumentar 15%

Escalar o `font-size` do número central de `clamp(10rem, 15vw, 20rem)` para `clamp(11.5rem, 17.25vw, 23rem)` (~15% maior).

### Detalhes Técnicos

**Cards (linhas 203, 212):**
- De: `bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6`
- Para: `border border-white/10 p-6`

**Barra de tempo (linhas 178-186):**
- Trilho: mudar `bg-white/10` para `bg-white/[0.08]`
- Barra interna: adicionar `style` com `boxShadow` dinâmico baseado na cor atual (verde: `0 0 20px rgba(74,222,128,0.4)`, amarelo: `0 0 20px rgba(250,204,21,0.4)`, vermelho: `0 0 20px rgba(239,68,68,0.4)`)

**Background (linha 173):**
- Importar `bgMenuModos` (já importado na HomeScreen, mas precisa ser importado neste arquivo também)
- Dentro do container individual, adicionar: `<img src={bgMenuModos} className="absolute inset-0 w-full h-full object-cover opacity-[0.07] z-0 pointer-events-none" />`
- Todo o conteúdo existente receberá `relative z-[1]` para ficar acima

**Hero counter (linha 230):**
- De: `fontSize: 'clamp(10rem, 15vw, 20rem)'`
- Para: `fontSize: 'clamp(11.5rem, 17.25vw, 23rem)'`

### Arquivos alterados
- `src/components/game/GameScreen.tsx` — 4 refinamentos visuais no bloco individual
