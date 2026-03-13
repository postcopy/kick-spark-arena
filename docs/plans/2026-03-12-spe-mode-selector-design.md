# SPE Sulsport — Tela de Seleção de Modo + Arquitetura Multi-Mat

## Goal
Replace the current direct-to-Mat launch with a professional mode selector screen. The SPE app opens to a home screen where users choose their role: Central (organizer), Mat (operator), TV (scoreboard), or Chamada (call board). This eliminates the microphone bottleneck at events and sets the foundation for multi-mat tournament management.

## Context
- SPE Sulsport is the championship product, separate from S-FIGHT PRO (academia)
- Real events use 2-7 mats, each with an operator + TV
- Some mats use external systems (KPNP/Daedo) — results entered manually
- Today someone on a microphone calls athletes — this is the main bottleneck
- Phase 1: everything on one computer. Phase 2: multi-computer via WebSocket

## Architecture

### 4 App Roles

| Role | Who | Where | Purpose |
|------|-----|-------|---------|
| **Central** | Organizer | Main notebook | Create tournament, distribute categories to mats, track all progress, manual result entry for external mats |
| **Mat** | Operator | Notebook at court | Operate fights (timer, scoring, gamjeom). Receives fights from Central |
| **TV** | Automatic | Screen at court | Shows scoreboard during fights, bracket between fights |
| **Chamada** | Automatic | Screen at warm-up area | Shows upcoming fights for ALL mats — eliminates microphone |

### Routing

```
/                           → ModeSelectorPage (home screen)
/central                    → CentralPage (tournament management + mat overview)
/championship/mat           → ChampionshipMat (existing, unchanged)
/championship/tv            → ChampionshipTV (existing, unchanged)
/championship/tournament    → TournamentSetup (existing, accessed from Central)
/chamada                    → ChamadaPage (call board for warm-up area)
```

### Mode Selector Screen

- Background: `#0A0A0F` (consistent with app)
- Logo: `logo-spe-branca.png` centered top
- 4 cards in a 2x2 or 3+1 grid layout
- Each card: icon (Lucide), title, short description
- Hover: yellow border (`--sulsport-yellow`)
- Cards:
  - **CENTRAL** (icon: `Monitor`) — "Organizar torneio e gerenciar quadras"
  - **MAT** (icon: `Swords`) — "Operar lutas na quadra"
  - **TV** (icon: `Tv`) — "Placar e chaves no telão"
  - **CHAMADA** (icon: `Megaphone`) — "Próximas lutas no aquecimento"
- Mat and TV cards prompt for mat number selection (1-7) before entering

### Central Page

The organizer's command center. Sections:
1. **Tournament Setup** — reuses existing TournamentSetup (create, categories, athletes, brackets)
2. **Mat Assignment** — assign categories to specific mat numbers
3. **Live Overview** — see status of all mats (current fight, score, next fight)
4. **Manual Results** — for KPNP/Daedo mats, enter winner manually

### Chamada Page (Call Board)

Full-screen display for warm-up area TV:
- Dark background, large text readable from distance
- Shows next 2-3 fights per mat
- Format per row: `MAT 1 | Cadete Leve | João Silva vs Pedro Santos | PRÓXIMA`
- Auto-updates as fights finish
- Current fight highlighted, upcoming fights listed below

### Data Flow (Phase 1 — Same Computer)

```
Central (localStorage) ←→ BroadcastChannel ←→ Mat/TV/Chamada
```

- Tournament state lives in localStorage (existing pattern)
- BroadcastChannel syncs state changes (existing pattern)
- Mat assignment stored in tournament state: `tournament.matAssignments: Record<number, string[]>` (mat number → category IDs)
- Chamada reads tournament state + match states from all mats

### Mat Number Selection

When user clicks "Mat" or "TV", a dialog asks which mat (1-7). This sets:
- `matId` parameter used for BroadcastChannel name (`championship-mat-{N}`)
- `localStorage` key scoping (`championship-state-mat-{N}`)

This already exists in the system — just needs a UI selector.

### Changes Summary

**New files:**
- `src/pages/ModeSelectorPage.tsx` — home screen with 4 role cards
- `src/pages/CentralPage.tsx` — organizer command center
- `src/pages/ChamadaPage.tsx` — call board for warm-up area

**Modified files:**
- `src/AppChampionship.tsx` — add new routes, change default redirect to `/`
- `src/types/tournament.ts` — add `matAssignments` field to Tournament type
- `src/hooks/useTournament.ts` — add mat assignment functions

**Unchanged:**
- `src/pages/ChampionshipMat.tsx` — works as-is
- `src/pages/ChampionshipTV.tsx` — works as-is
- `src/pages/TournamentSetup.tsx` — reused inside Central page
- Electron main process — unchanged
- Build pipeline — unchanged (single championship build)

### Phase 2 (Future)
- WebSocket server for multi-computer sync on same WiFi network
- Each notebook runs SPE, connects to Central's WebSocket
- Real-time state sync replaces BroadcastChannel for cross-device
