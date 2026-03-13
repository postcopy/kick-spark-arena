# S-FIGHT PRO Redesign - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete visual redesign of the S-Fight app with professional sports aesthetic, new navigation system (sidebar + bottom tabs), and enhanced dashboard.

**Architecture:** Update CSS variables, Tailwind config, and font imports first (foundation). Then create the new AppShell layout with sidebar/bottom-tabs. Then restyle each page inside the new shell. Pages that are game-mode screens (Index game flow, Championship) are NOT restyled - only the management/dashboard pages.

**Tech Stack:** React 18, Tailwind CSS 3, Recharts, Radix UI (shadcn), Rajdhani font from Google Fonts, Lucide icons.

---

### Task 1: Foundation - Fonts, Colors, CSS Variables

**Files:**
- Modify: `index.html` (add Rajdhani font import)
- Modify: `src/index.css` (update CSS variables for new palette)
- Modify: `tailwind.config.ts` (add Rajdhani font family, new color tokens)

**Step 1: Add Rajdhani font to index.html**

In `index.html`, add inside `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

**Step 2: Update CSS variables in src/index.css**

Replace the `:root` block colors with the new S-FIGHT PRO palette:
```css
:root {
    --background: 240 20% 4%;        /* #0A0A0F */
    --foreground: 210 40% 98%;       /* #F8FAFC */

    --card: 240 17% 8%;              /* #141420 */
    --card-foreground: 210 40% 98%;

    --popover: 240 17% 8%;
    --popover-foreground: 210 40% 98%;

    --primary: 347 77% 50%;          /* #E11D48 - Vermelho S-Fight */
    --primary-foreground: 210 40% 98%;

    --secondary: 240 12% 12%;        /* #1E1E2E */
    --secondary-foreground: 210 40% 98%;

    --muted: 240 12% 12%;
    --muted-foreground: 215 16% 62%; /* #94A3B8 */

    --accent: 240 12% 15%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 84% 44%;
    --destructive-foreground: 210 40% 98%;

    --border: 240 12% 14%;
    --input: 240 12% 12%;
    --ring: 347 77% 50%;             /* Vermelho como ring */

    /* S-Fight PRO specific */
    --sfight-red: 347 77% 50%;       /* #E11D48 */
    --sfight-red-dark: 347 77% 37%;  /* #9F1239 */
    --sfight-gold: 38 92% 50%;       /* #F59E0B */
    --sfight-gold-light: 48 96% 53%; /* #FCD34D */
    --sfight-green: 160 84% 39%;     /* #10B981 */
    --sfight-blue: 217 91% 60%;      /* #3B82F6 */

    --sidebar-background: 240 17% 8%;
    --sidebar-foreground: 210 40% 98%;
    --sidebar-primary: 347 77% 50%;
    --sidebar-primary-foreground: 210 40% 98%;
    --sidebar-accent: 347 77% 50% / 0.15;
    --sidebar-accent-foreground: 210 40% 98%;
    --sidebar-border: 240 12% 14%;
    --sidebar-ring: 347 77% 50%;
}
```

Update body font-family:
```css
body {
    font-family: 'Rajdhani', 'Inter', system-ui, sans-serif;
}
```

**Step 3: Update tailwind.config.ts**

Add Rajdhani to fontFamily and new color tokens:
```typescript
fontFamily: {
    display: ["'Rajdhani'", "sans-serif"],
    body: ["'Rajdhani'", "sans-serif"],
    mono: ["'JetBrains Mono'", "monospace"],
},
colors: {
    // ... keep existing ...
    sfight: {
        red: "hsl(var(--sfight-red))",
        "red-dark": "hsl(var(--sfight-red-dark))",
        gold: "hsl(var(--sfight-gold))",
        "gold-light": "hsl(var(--sfight-gold-light))",
        green: "hsl(var(--sfight-green))",
        blue: "hsl(var(--sfight-blue))",
    },
}
```

**Step 4: Verify - run dev server, check font loads**

---

### Task 2: Create AppShell Layout with Sidebar + Bottom Tabs

**Files:**
- Create: `src/components/layout/AppShell.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/BottomTabs.tsx`
- Modify: `src/App.tsx` (wrap protected routes in AppShell)

**Step 1: Create Sidebar component**

`src/components/layout/Sidebar.tsx`:
```tsx
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Gamepad2, Trophy, Users, Swords,
  Settings, LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/', icon: Gamepad2, label: 'Modos de Jogo' },
  { to: '/ranking', icon: Trophy, label: 'Ranking' },
  { to: '/students', icon: Users, label: 'Alunos' },
  { to: '/championship/mat', icon: Swords, label: 'Campeonato' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-full border-r border-border bg-card transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 h-16 border-b border-border">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sfight-red to-sfight-red-dark flex items-center justify-center font-display font-bold text-white text-lg shrink-0">
          S
        </div>
        {!collapsed && (
          <span className="font-display font-bold text-lg tracking-wide">S-FIGHT PRO</span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative',
                isActive
                  ? 'bg-sfight-red/15 text-sfight-red'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-sfight-red rounded-r-full" />
                )}
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: user + collapse */}
      <div className="border-t border-border p-2 space-y-1">
        <button
          onClick={() => { signOut(); navigate('/login'); }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent w-full transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
```

**Step 2: Create BottomTabs component**

`src/components/layout/BottomTabs.tsx`:
```tsx
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Gamepad2, Trophy, Users, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/', icon: Gamepad2, label: 'Jogar', highlight: true },
  { to: '/ranking', icon: Trophy, label: 'Ranking' },
  { to: '/students', icon: Users, label: 'Alunos' },
  { to: '/menu', icon: Menu, label: 'Menu' },
];

export function BottomTabs() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="flex items-center justify-around h-16 px-2">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors min-h-0',
                isActive ? 'text-sfight-red' : 'text-muted-foreground',
                tab.highlight && !isActive && 'text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                {tab.highlight ? (
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center -mt-5',
                    isActive ? 'bg-sfight-red' : 'bg-sfight-red/80',
                    'text-white shadow-lg shadow-sfight-red/30'
                  )}>
                    <tab.icon className="w-5 h-5" />
                  </div>
                ) : (
                  <tab.icon className="w-5 h-5" />
                )}
                <span className="text-[10px] font-medium">{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
```

**Step 3: Create AppShell wrapper**

`src/components/layout/AppShell.tsx`:
```tsx
import { Sidebar } from './Sidebar';
import { BottomTabs } from './BottomTabs';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 min-h-0 overflow-y-auto pb-16 md:pb-0">
        {children}
      </main>
      <BottomTabs />
    </div>
  );
}
```

**Step 4: Update App.tsx routes**

Wrap all protected non-game routes in AppShell. Game routes (Index when in game mode, Championship TV) keep their own layout.

Create a new layout route in App.tsx that wraps Dashboard, Ranking, Students, StudentProfile with AppShell. Keep Index (game hub) wrapped too since it serves as the home.

```tsx
// Add import
import { AppShell } from '@/components/layout/AppShell';

// Wrap routes that use the shell:
<Route path="/dashboard" element={<ProtectedRoute><AppShell><Dashboard /></AppShell></ProtectedRoute>} />
<Route path="/ranking" element={<ProtectedRoute><AppShell><Ranking /></AppShell></ProtectedRoute>} />
<Route path="/students" element={<ProtectedRoute><AppShell><Students /></AppShell></ProtectedRoute>} />
<Route path="/students/:id" element={<ProtectedRoute><AppShell><StudentProfile /></AppShell></ProtectedRoute>} />
<Route path="/" element={<AppShell><Index /></AppShell>} />
```

**Step 5: Verify - check sidebar renders on desktop, bottom tabs on mobile**

---

### Task 3: Restyle Login Page

**Files:**
- Modify: `src/pages/Login.tsx`

**Step 1: Replace Login.tsx visual**

Replace the background image approach with a gradient background. Update colors to use the new palette. Update button to use red gradient CTA instead of yellow. Update logo area with "S-FIGHT PRO" text branding.

Key changes:
- Background: `bg-[#0A0A0F]` with radial gradient overlay
- Card: `bg-card border border-border` instead of black/40 backdrop-blur
- Primary button: `bg-gradient-to-r from-sfight-red to-sfight-red-dark`
- Links: `text-sfight-red` instead of `text-game-yellow`
- Font: Rajdhani applied globally, so titles use `font-display font-bold`
- Remove bgArena image dependency

**Step 2: Verify login page renders with new style**

---

### Task 4: Restyle Dashboard Page

**Files:**
- Modify: `src/pages/Dashboard.tsx`

This is the largest task. The Dashboard currently uses extensive inline styles. Replace with Tailwind classes using the new palette.

**Step 1: Update KPI cards section**

Replace inline style colors with Tailwind classes:
- Card backgrounds: `bg-card border border-border rounded-xl`
- Icon containers: colored circles using sfight palette (red, gold, green, blue)
- Numbers: `font-mono text-3xl font-bold`
- Trend indicators: green for positive, red for negative

**Step 2: Update chart colors**

Replace hardcoded hex in chart configs:
- Bar chart bars: `#E11D48` (sfight red)
- Pie chart: use sfight palette colors
- Line chart: sfight palette
- Tooltip: `background: '#141420', border: '1px solid #1E1E2E'`

**Step 3: Update tab navigation**

Style the tabs with the new design:
- Tab trigger: `text-muted-foreground` default, `text-sfight-red` when active
- Active indicator: red underline

**Step 4: Update athlete cards and ranking section**

- Top 3 cards: gold border/glow for #1, silver for #2, bronze for #3
- Avatar with belt color ring
- Stats in mono font

**Step 5: Update insight cards**

- Background: `bg-card`
- Icons: sfight palette colors
- Subtle border left with accent color

**Step 6: Remove SiteLayout wrapper from Dashboard (now uses AppShell)**

Dashboard currently may use SiteLayout. Remove it since AppShell handles the layout.

**Step 7: Verify dashboard renders with all charts and new styling**

---

### Task 5: Restyle Ranking Page

**Files:**
- Modify: `src/pages/Ranking.tsx`

**Step 1: Update ranking layout**

- Remove SiteLayout wrapper
- Add page header: `<h1 className="font-display text-3xl font-bold">Ranking</h1>`
- Top 3 podium with large cards: gold/silver/bronze backgrounds
- Table below with zebra striping using `bg-card` / `bg-secondary`
- Period filter buttons: pill shape, active = `bg-sfight-red text-white`
- Medal badges: gold/silver/bronze circles with position number

**Step 2: Verify ranking page with new styling**

---

### Task 6: Restyle Students Page

**Files:**
- Modify: `src/pages/Students.tsx`

**Step 1: Update students grid**

- Remove SiteLayout wrapper
- Page header with "Alunos" title + "Adicionar" button (red gradient)
- Search input: `bg-secondary border-border` with search icon
- Belt filter pills: colored circles matching real belt colors
- Student cards: `bg-card border border-border rounded-xl` with hover effect
- Avatar: larger, with belt color ring
- Status dot: green for active, gray for inactive

**Step 2: Verify students page**

---

### Task 7: Restyle Student Profile Page

**Files:**
- Modify: `src/pages/StudentProfile.tsx`

**Step 1: Update profile layout**

- Remove SiteLayout wrapper
- Header area with large avatar, name, belt badge, stats summary
- Stats cards row: total sessions, total kicks, best reaction, streak
- Performance charts with new palette colors
- Session history list with clean card design

**Step 2: Verify student profile page**

---

### Task 8: Polish - Transitions, Hover States, Responsive

**Files:**
- Modify: various component files as needed

**Step 1: Add smooth transitions**

- Sidebar collapse animation: `transition-all duration-300`
- Card hover: `hover:border-sfight-red/30 transition-colors`
- Page transitions: subtle fade-in using CSS

**Step 2: Responsive audit**

- Check all pages on mobile viewport (375px)
- Ensure bottom tabs don't overlap content
- Ensure charts resize properly
- Test sidebar collapse on tablet (768px)

**Step 3: Final visual verification across all pages**
