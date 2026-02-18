
# Adicionar Aviso de Hardware (Instrucao Fisica)

## Resumo

Inserir um aviso sobre limitacao do sensor no rodape das 3 telas de configuracao, orientando o atleta a recolher a perna entre chutes.

## Alteracoes

### 1. `src/components/game/ArcadeSetupScreen.tsx` (linha ~226)

Adicionar um paragrafo de aviso do sensor logo apos as regras existentes (apos o `</ul>` na linha 226), dentro do mesmo `div.border-l-2`:

```tsx
<p className="mt-1 text-white/50 font-mono text-xs">
  <span className="text-orange-500 font-bold tracking-wider">SENSOR:</span>{" "}
  Detecta apenas impactos limpos. Chutes "colados" sao ignorados.
  <span className="text-white block mt-0.5 font-bold">
    ⚠️ Chute → Recolha a perna → Chute novamente.
  </span>
</p>
```

### 2. `src/components/game/ReactionSetupScreen.tsx` (linha ~300)

Adicionar apos as spans de config (linha 299), dentro do mesmo `div.border-l-2`:

```tsx
<p className="mt-1 text-white/50 font-mono text-xs">
  <span className="text-orange-500 font-bold tracking-wider">SENSOR:</span>{" "}
  Aguarde o reset. O sistema ignora impactos multiplos simultaneos.
</p>
```

### 3. `src/components/game/SetupScreen.tsx` (linha ~417)

O SetupScreen nao tem secao "REGRAS DO SISTEMA". Adicionar um bloco de aviso acima do botao "JOGAR!" (antes da linha 404), no step de duracao:

```tsx
<div className="border-l-2 border-cyan-500/50 pl-3 py-1 mt-2">
  <p className="text-white/50 font-mono text-xs">
    <span className="text-orange-500 font-bold tracking-wider">SENSOR:</span>{" "}
    Detecta apenas impactos limpos. Chutes "colados" sao ignorados.
    <span className="text-white block mt-0.5 font-bold">
      ⚠️ Chute → Recolha a perna → Chute novamente.
    </span>
  </p>
</div>
```

## Resultado

- Todos os 3 modos exibem aviso do sensor antes do inicio
- Arcade e Time Attack: mensagem sobre recolher a perna
- Reaction: mensagem sobre aguardar reset entre estimulos
- Visual consistente com o estilo mono/tecnico existente
