
# Refatorar SetupScreen (Contra o Tempo) para Layout Fullscreen

## Problema

A `SetupScreen` do modo "Contra o Tempo" usa um layout estreito (`max-w-lg`) com scroll, enquanto o modo "Duelo" (`ArcadeSetupScreen`) ocupa a tela inteira com `max-w-6xl`, `overflow-hidden` e fundo escuro `bg-[#0b1120]`. A experiencia visual fica inconsistente entre os dois modos.

## Alteracoes

### Arquivo: `src/components/game/SetupScreen.tsx`

Aplicar o mesmo padrao de layout do `ArcadeSetupScreen`:

1. **Container raiz**: trocar `bg-background` por `bg-[#0b1120]` e manter `overflow-hidden`
2. **Area de conteudo**: trocar `max-w-lg` por `max-w-6xl` para ocupar a largura da tela
3. **Cada step** sera redesenhado para usar o espaco horizontal disponivel:

**Step 1 (Quantos jogadores?):**
- Layout horizontal em desktop: dois cards lado a lado (`grid-cols-2`) ao inves de empilhados
- Cards maiores, com mais padding e icones maiores
- Titulo e subtitulo centralizados acima

**Step 2 (Selecao de atleta):**
- Grid de atletas expandido (`grid-cols-3 md:grid-cols-4 lg:grid-cols-6`) para usar a largura
- Busca e botoes mais largos

**Step 3 (Duracao):**
- Layout em duas colunas no desktop: opcoes de duracao a esquerda, preview + botao iniciar a direita
- Cards de duracao mais compactos verticalmente para caber sem scroll
- Botao de voltar no rodape, estilo tecnico como no Duelo (`text-white/30`)

4. **Botao Voltar**: mover do canto superior esquerdo (`absolute`) para o rodape, no estilo do Duelo (botao ghost pequeno com seta)
5. **Progress dots**: manter no topo, estilo ajustado para fundo escuro (dots brancos/amarelos)
6. **Cores de texto**: ajustar todos os textos para funcionar sobre fundo escuro (`text-white`, `text-white/60`, etc.) em vez de `text-foreground`/`text-muted-foreground`

### Arquivos nao alterados

- `ArcadeSetupScreen.tsx` -- ja esta no padrao correto
- `LoadingScreen.tsx`, `FinishedScreen.tsx` -- fora do escopo (nao sao "menus de setup")
- `Index.tsx` -- nenhuma alteracao de props necessaria
