

# Adicionar Presets de Categoria na Tela de Calibragem

## O que muda

Uma barra de botoes de presets ("Infantil", "Cadete", "Juvenil", "Adulto") sera adicionada acima dos campos numericos na secao "Configuracao de Limiares". Ao clicar num preset, os 4 campos sao preenchidos automaticamente. Se o usuario editar qualquer campo manualmente, o preset desmarca.

## Valores dos Presets

| Preset   | Colete Hit | Colete Ponto | Capacete Hit | Capacete Ponto |
|----------|-----------|-------------|-------------|---------------|
| Infantil | 14        | 18          | 14          | 18            |
| Cadete   | 16        | 22          | 16          | 22            |
| Juvenil  | 18        | 25          | 18          | 25            |
| Adulto   | 20        | 30          | 20          | 30            |

## Detalhes Tecnicos

### Arquivo: `src/components/championship/DiagnosticsDialog.tsx`

1. **Novo state**: `activePreset` (string | null) -- guarda qual preset esta ativo ("infantil", "cadete", "juvenil", "adulto") ou `null` se manual.

2. **Constante PRESETS**: Objeto com os 4 presets e seus valores de threshold.

3. **Handler `applyPreset(key)`**: Seta os 4 campos numericos e marca `activePreset = key`.

4. **Nos onChange dos inputs**: Alem de atualizar o valor, seta `activePreset = null` (desmarca o preset ativo).

5. **UI**: Uma linha de 4 botoes (estilo toggle) entre o titulo "Configuracao de Limiares" e os inputs. O botao ativo fica destacado (ex: bg-blue com texto branco), os inativos ficam em zinc. Quando nenhum preset esta ativo (edicao manual), todos ficam em zinc.

Nenhum outro arquivo precisa ser alterado. As props e a interface com o OperatorPanel permanecem identicas.

