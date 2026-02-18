
# Fix: Layout Duo Sobreposto (Spacing)

## Problema

Os numeros gigantes estao se sobrepondo aos labels "HITS" e "CPM" porque usam `leading-[0.8]` (line-height apertado) e `marginTop: '-4vw'` (margem negativa puxando os labels para dentro do numero).

## Alteracoes

### Arquivo: `src/components/game/GameScreen.tsx`

#### Painel Vermelho (linhas 324-333)

1. Trocar `leading-[0.8]` por `leading-none` no span do score
2. Remover `style={{ marginTop: '-4vw' }}` do container HITS/CPM
3. Adicionar `mt-2 relative z-20` no container HITS/CPM
4. Aumentar texto dos labels: `text-sm` para `text-2xl` (HITS) e `text-lg` para `text-xl` (CPM)
5. Trocar `tracking-[0.3em]` por `tracking-widest`

#### Painel Azul (linhas 363-372)

Mesmas alteracoes identicas ao painel vermelho.

### Codigo resultante (ambos os paineis)

```tsx
// Score - leading-none em vez de leading-[0.8]
<span className="text-red-500 font-black italic leading-none tracking-tighter tabular-nums" style={{ 
  fontSize: 'clamp(8rem, 20vw, 22rem)',
  filter: 'drop-shadow(0 0 30px rgba(239,68,68,0.4))'
}}>
  {scores.red}
</span>

// Labels - mt-2 positivo em vez de marginTop negativo, z-20 para ficar acima
<div className="flex flex-col gap-1 items-center mt-2 relative z-20">
  <span className="text-2xl text-white/40 uppercase tracking-widest font-mono">HITS</span>
  <span className="text-xl text-white/60 font-mono tabular-nums">CPM: {redCpm}</span>
</div>
```

## Resultado

- Numeros com respiro vertical adequado (leading-none)
- Labels HITS/CPM separados fisicamente com margem positiva
- Z-index garante que labels nunca fiquem cortados
- Texto dos labels maior e mais legivel
