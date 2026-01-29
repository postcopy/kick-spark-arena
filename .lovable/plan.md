

## Plano: Substituir Música de Fundo por Versão de Melhor Qualidade

### Objetivo
Substituir a música de fundo do modo de jogo pela nova versão de maior qualidade agora que o sistema de buffering está funcionando.

---

### Arquivo a Modificar

| Ação | Arquivo |
|------|---------|
| Copiar | `user-uploads://Fight_Mode_-_Sulsport-2.mp3` → `public/sounds/fight-mode-bg.mp3` |

---

### Detalhes Técnicos

O sistema de áudio em `useSoundEffects.ts` já referencia corretamente:
```typescript
const FALLBACK_PATHS: Record<SoundName, string> = {
  fightModeBg: '/sounds/fight-mode-bg.mp3',  // <- será substituído
  // ...
};
```

A nova música será carregada automaticamente pelo sistema de buffering (`LoadingScreen`) que:
1. Aguarda o `readyState >= 3` antes de iniciar o countdown
2. Mostra progresso de carregamento em tempo real
3. Garante que a música toca sem delay

---

### Resultado Esperado

- Música de fundo com melhor qualidade sonora
- Mesmo comportamento de carregamento (buffering antes de iniciar)
- Nenhuma mudança de código necessária

