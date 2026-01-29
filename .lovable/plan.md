

## Plano: Corrigir Sons de Hit

### Problema Identificado
Os arquivos de som `hit.mp3` e `hit-heavy.mp3` em `public/sounds/` estão **vazios (0 bytes)**, causando o erro:
```
[Sound] Failed to play hit: The element has no supported sources.
```

### Solução
Copiar o arquivo `HIT_TRONCO.mp3` que você enviou para substituir os arquivos de hit.

---

### Arquivos a Modificar

| Ação | Arquivo |
|------|---------|
| Copiar | `user-uploads://HIT_TRONCO.mp3` → `public/sounds/hit.mp3` |
| Copiar | `user-uploads://HIT_TRONCO.mp3` → `public/sounds/hit-heavy.mp3` |

---

### Detalhes Técnicos

O sistema de áudio em `useSoundEffects.ts` já referencia corretamente:
```typescript
const FALLBACK_PATHS: Record<SoundName, string> = {
  hit: '/sounds/hit.mp3',        // <- arquivo vazio atualmente
  hitHeavy: '/sounds/hit-heavy.mp3', // <- arquivo vazio atualmente
  // ...
};
```

Ao substituir os arquivos vazios pelo `HIT_TRONCO.mp3`:
1. O pool de áudio vai carregar o som corretamente
2. O `readyState` vai alcançar >= 2 (HAVE_CURRENT_DATA)
3. Os hits vão tocar durante o jogo

---

### Observação

Se você tiver um som diferente para o "hit-heavy" (golpe forte), pode enviar outro arquivo. Caso contrário, usarei o mesmo `HIT_TRONCO.mp3` para ambos.

