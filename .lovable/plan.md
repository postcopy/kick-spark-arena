

# Guia de Ajuda para o Modo Campeonato

## Resumo

Criar um componente `HelpDialog` com conteudo organizado em abas (Tabs), acionado por um botao com icone de interrogacao no header da tela `ChampionshipMat`.

## Mudancas

### 1. Novo componente: `src/components/championship/HelpDialog.tsx`

Dialog modal com 4 abas usando o componente `Tabs` ja existente no projeto:

**Aba 1 - Hardware**
- Icone `Usb` -- como conectar a placa USB
- Significado dos indicadores de status (verde = conectado, cinza = desconectado)
- Dica: conectar antes de iniciar a luta

**Aba 2 - Calibragem**
- Icone `Activity` -- logica das cores:
  - Cinza = Ruido (ignorado)
  - Amarelo = HIT (registrado para desempate, sem ponto)
  - Verde = PONTO (soma no placar)
- Presets: Infantil (limiares mais baixos) / Adulto (limiares padrao)
- Explicacao de que os valores de limiar definem a faixa de classificacao

**Aba 3 - Pontuacao**
- Icone `Target` -- sistema de 3 faixas de intensidade (Ruido / HIT / PONTO)
- Desempate automatico por numero de HITs
- Valores de pontuacao manual (Soco: 1, Corpo: 2, Cabeca: 3, Giro Corpo: 4, Giro Cabeca: 6)

**Aba 4 - Atalhos**
- Icone `Keyboard` -- lista dos atalhos:
  - Espaco: Iniciar / Pausar round
  - ESC: Pausar imediatamente (emergencia)

Estilo: fundo escuro (`sulsport-dark`), textos em branco/cinza, consistente com os outros dialogs do campeonato. Cada secao usa icones Lucide para leitura rapida.

### 2. Alterar: `src/pages/ChampionshipMat.tsx`

- Importar `HelpDialog`
- Adicionar estado `showHelpDialog`
- Inserir botao `HelpCircle` no header (lado esquerdo, antes do logo, ou junto aos badges do lado direito) que abre o dialog
- Renderizar `<HelpDialog open={showHelpDialog} onOpenChange={setShowHelpDialog} />`

## Detalhes Tecnicos

### Estrutura do HelpDialog:

```text
Dialog
  DialogContent (max-w-2xl, bg-sulsport-dark)
    DialogHeader
      DialogTitle: "GUIA DE AJUDA"
    Tabs (defaultValue="hardware")
      TabsList (4 triggers)
        "Hardware" | "Calibragem" | "Pontuacao" | "Atalhos"
      TabsContent "hardware" -> secao com icones e texto
      TabsContent "calibragem" -> secao com icones e texto
      TabsContent "pontuacao" -> secao com icones e texto
      TabsContent "atalhos" -> secao com icones e texto
```

### Posicao do botao no header:

O botao sera adicionado no lado esquerdo do header (posicao absoluta `left-6`), ao lado do logo, como um icone discreto `HelpCircle` em tom cinza que clareia ao hover.

### Componentes reutilizados (ja existem no projeto):
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` de `@/components/ui/dialog`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` de `@/components/ui/tabs`
- `Button` de `@/components/ui/button`
- Icones Lucide: `HelpCircle`, `Usb`, `Activity`, `Target`, `Keyboard`

### Arquivos modificados:
1. `src/components/championship/HelpDialog.tsx` (novo)
2. `src/pages/ChampionshipMat.tsx` (botao + estado + render do dialog)

Nenhuma logica de luta ou pontuacao e alterada.
