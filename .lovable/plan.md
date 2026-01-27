

## Plano: Tela de Boas-Vindas com Background e Logo S-Fighter

### Resumo

Criar uma tela de boas-vindas imersiva para usuários não logados, com:
- Background dramático da arena (imagem enviada)
- Logo S-Fighter centralizada (imagem enviada)
- Breve descrição do sistema
- Botões de Login e Cadastro

Usuários logados são redirecionados direto para o seletor de modos (HomeScreen atual).

---

### Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/assets/bg-arena.jpg` | Imagem de background da arena |
| `src/assets/logo-sfighter.png` | Logo S-Fighter branca |
| `src/components/game/WelcomeScreen.tsx` | Nova tela de boas-vindas |

---

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Index.tsx` | Adicionar lógica para mostrar WelcomeScreen se não logado |
| `src/components/game/HomeScreen.tsx` | Remover botões de login (só usuários logados veem essa tela) |

---

### Design da Tela de Boas-Vindas

```text
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│              [Background: Arena com equipamentos]               │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │                   [LOGO S-FIGHTER]                      │   │
│   │                  (grande, centralizada)                 │   │
│   │                                                         │   │
│   │         Sistema de pontuação para Taekwondo             │   │
│   │      Conecte equipamentos e dispute com amigos!         │   │
│   │                                                         │   │
│   │         ┌────────────────────────────────┐              │   │
│   │         │           ENTRAR               │ ← Amarelo    │   │
│   │         └────────────────────────────────┘              │   │
│   │                                                         │   │
│   │         ┌────────────────────────────────┐              │   │
│   │         │      CRIAR CONTA GRÁTIS        │ ← Outline    │   │
│   │         └────────────────────────────────┘              │   │
│   │                                                         │   │
│   │              ⚡ 3 dias grátis para testar!              │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│          [Equipamentos azul/vermelho visíveis na base]          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 1. Copiar Assets

```text
user-uploads://TELA-SU.jpg → src/assets/bg-arena.jpg
user-uploads://LOGO_modo-s-fighter_Branca-2.png → src/assets/logo-sfighter.png
```

---

### 2. Componente `WelcomeScreen.tsx`

```typescript
import { Link } from 'react-router-dom';
import { Zap, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoSfighter from '@/assets/logo-sfighter.png';
import bgArena from '@/assets/bg-arena.jpg';

export function WelcomeScreen() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgArena})` }}
      />
      
      {/* Overlay gradiente para legibilidade */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
      
      {/* Conteúdo */}
      <div className="relative z-10 flex flex-col h-full items-center justify-center p-6">
        <div className="w-full max-w-md flex flex-col items-center text-center space-y-6">
          
          {/* Logo S-Fighter */}
          <img 
            src={logoSfighter} 
            alt="S-Fighter" 
            className="h-24 md:h-32 lg:h-40 w-auto drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]" 
          />
          
          {/* Descrição */}
          <div className="space-y-2">
            <h1 className="text-xl md:text-2xl font-bold text-white">
              Sistema de pontuação para Taekwondo
            </h1>
            <p className="text-base md:text-lg text-white/80">
              Conecte seus equipamentos e dispute com amigos em batalhas épicas!
            </p>
          </div>
          
          {/* Botões */}
          <div className="w-full space-y-3 pt-4">
            <Link to="/login" className="block w-full">
              <Button 
                size="lg"
                className="w-full h-14 md:h-16 text-lg font-bold rounded-xl 
                           bg-game-yellow text-background hover:bg-game-yellow/90"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Entrar
              </Button>
            </Link>
            
            <Link to="/signup" className="block w-full">
              <Button 
                size="lg"
                variant="outline"
                className="w-full h-14 md:h-16 text-lg font-bold rounded-xl
                           bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Criar Conta Grátis
              </Button>
            </Link>
          </div>
          
          {/* Badge de trial */}
          <div className="flex items-center gap-2 text-game-yellow text-sm">
            <Zap className="w-4 h-4" />
            <span>3 dias grátis para testar!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### 3. Atualizar `Index.tsx`

Adicionar verificação de usuário no início da lógica de renderização:

```typescript
import { WelcomeScreen } from '@/components/game/WelcomeScreen';

// ... existing code ...

// Build content based on state
let content: React.ReactNode;

// Show loading while auth is loading
if (authLoading || subscription.isLoading) {
  content = (
    <div className="flex h-full w-full items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-game-yellow" />
    </div>
  );
} else if (!user) {
  // ← NOVA CONDIÇÃO: Usuário não logado = WelcomeScreen
  content = <WelcomeScreen />;
} else if (showEquipmentSetup && pendingMode) {
  // Equipment setup screen
  content = (
    <EquipmentSetupScreen ... />
  );
} else if (!gameMode) {
  // Home screen - seletor de modos (só para logados agora)
  content = (
    <>
      <HomeScreen onSelectMode={handleSelectMode} serialPort={serialPort} />
      {!canPlay && <Paywall />}
    </>
  );
}
// ... rest of game logic
```

---

### 4. Simplificar `HomeScreen.tsx`

Remover a lógica de usuário não logado (já que só usuários logados chegam aqui):

```typescript
// ANTES: Tinha verificação de !user
{!user ? (
  <>
    <Link to="/login">...</Link>
    <Link to="/signup">...</Link>
  </>
) : (
  <MenuDrawer ... />
)}

// DEPOIS: Sempre mostra só o menu (user sempre existe aqui)
<div className="flex items-center gap-3">
  <span className="text-sm text-muted-foreground hidden sm:block">
    Olá, {user?.email?.split('@')[0]}
  </span>
  <MenuDrawer ... />
</div>
```

Também trocar a logo por S-Fighter no header (opcional, para consistência).

---

### Fluxo de Navegação Atualizado

```text
               ┌─────────────────┐
               │   Index (/)     │
               └────────┬────────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
          ▼             ▼             ▼
    [Não logado]   [Logado]      [Logado + Jogo]
          │             │             │
          ▼             ▼             ▼
    WelcomeScreen   HomeScreen    GameScreens
    (background +   (seletor de   (Time Attack,
     logo + botões)  modos)        Arcade, etc)
          │
   ┌──────┴──────┐
   │             │
   ▼             ▼
 /login       /signup
```

---

### Tratamento do Background

A imagem tem equipamentos na parte inferior. O overlay gradiente aproveita isso:

| Área | Opacidade | Razão |
|------|-----------|-------|
| Topo | 70% preto | Logo e texto legíveis |
| Meio | 50% preto | Transição suave |
| Base | 80% preto | Botões destacados, equipamentos sutis |

---

### Resultado Esperado

| Situação | O que aparece |
|----------|---------------|
| Primeira visita (não logado) | WelcomeScreen com arena e logo S-Fighter |
| Clica "Entrar" | Vai para /login |
| Clica "Criar Conta" | Vai para /signup |
| Após login bem-sucedido | Volta para / e vê HomeScreen (modos de jogo) |
| Usuário já logado acessa / | Vê HomeScreen direto |

---

### Seção Técnica

**Importação dos Assets:**
```typescript
// ES6 imports para bundling otimizado
import logoSfighter from '@/assets/logo-sfighter.png';
import bgArena from '@/assets/bg-arena.jpg';

// Uso no componente
<img src={logoSfighter} ... />
style={{ backgroundImage: `url(${bgArena})` }}
```

**Constraints de Layout:**
- `WelcomeScreen` usa `h-full w-full` (herda do Frame em Index.tsx)
- Background usa `bg-cover bg-center` para escalar em qualquer resolução
- Conteúdo centralizado com `items-center justify-center`

**Drop Shadow na Logo:**
```css
drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]
```
Cria um glow branco sutil que destaca a logo no fundo escuro.

