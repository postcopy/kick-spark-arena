
# Adicionar Som "Erro" no Modo Cognitivo

## Resumo
Copiar o arquivo `erro.mp3` para o projeto e usa-lo como som de erro de impulso (chute no vermelho) no Modo Cognitivo, substituindo o som `ko` nesse callback especifico.

## Alteracoes

### 1. Arquivo de Audio
- Copiar `user-uploads://erro.mp3` para `public/sounds/erro.mp3`

### 2. `src/hooks/useSoundEffects.ts`
- Adicionar `'erro'` ao tipo `SoundName` (linha 20)
- Adicionar `erro: '/sounds/erro.mp3'` ao `FALLBACK_PATHS` (apos linha 40)
- Adicionar `erro: 2` ao `POOL_SIZES` (apos linha 64)

### 3. `src/pages/Index.tsx`
Seguindo o padrao "Latest Ref" ja existente:

- **Criar Ref** (junto das outras, linha ~76):
```typescript
const playErrorRef = useRef(() => play('erro'));
```

- **Atualizar Effect** (dentro do useEffect que sincroniza refs, linha ~86):
```typescript
playErrorRef.current = () => play('erro');
```

- **Atualizar callback** (linha 143):
  - De: `onCommissionError: () => playKORef.current()`
  - Para: `onCommissionError: () => playErrorRef.current()`

## Impacto
- O som `ko` continua disponivel para outros usos (ex: modo principal)
- Apenas o callback `onCommissionError` do Modo Reacao/Cognitivo e alterado
- Nenhuma mudanca de logica ou interface
