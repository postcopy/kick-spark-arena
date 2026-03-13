# Tournament Bracket System — Design Doc

## Goal

Add a tournament bracket (chaves eliminatorias) system to SPE Sulsport championship mode. Operators create a tournament with categories (age/belt/weight/gender), register athletes (manual + CSV import), generate single-elimination brackets, and run fights sequentially. The TV automatically shows the bracket between fights.

## Architecture

**Approach A — Bracket as Global State.** A new `TournamentState` lives in localStorage alongside the existing `MatchState`. The bracket is a pre-generated tree of matches. When a fight ends, the sync hook updates the bracket and advances the winner. The TV receives bracket updates via the existing BroadcastChannel (typed messages).

**Key decisions:**
- Single elimination only (repechage deferred to v2)
- Categories: Age Group + Belt + Weight + Gender
- Athletes: manual entry + CSV import
- TV shows bracket automatically between fights
- Winner advancement: automatic + manual override
- Persistence: 100% localStorage, offline-first
- No new dependencies

## Data Model

### Tournament
```typescript
interface Tournament {
  id: string;
  name: string;              // "Copa Sulsport 2026"
  date: string;              // "2026-03-15"
  location?: string;
  categories: Category[];
  status: 'SETUP' | 'IN_PROGRESS' | 'FINISHED';
  createdAt: number;
}
```

### Category
```typescript
interface Category {
  id: string;
  name: string;              // auto-generated: "Adulto / Preta / Até 68kg / M"
  ageGroup: string;          // "Adulto", "Juvenil", "Cadete", "Infantil"
  belt: string;              // "Preta", "Vermelha", "Colorida"
  weightClass: string;       // "Até 54kg", "Até 58kg", etc.
  gender: 'M' | 'F';
  athletes: Athlete[];
  bracket: BracketMatch[];
  status: 'PENDING' | 'IN_PROGRESS' | 'FINISHED';
}
```

### BracketMatch
```typescript
interface BracketMatch {
  id: string;                // "cat1-r1-m1"
  round: number;             // 1 = first round, 2 = semi, 3 = final
  position: number;          // position within round (0, 1, 2...)
  athleteRed?: Athlete;
  athleteBlue?: Athlete;
  winnerId?: string;
  winnerSide?: 'RED' | 'BLUE';
  status: 'PENDING' | 'READY' | 'IN_PROGRESS' | 'FINISHED' | 'BYE';
  nextMatchId?: string;
  matchNumber: number;       // global sequential number (1, 2, 3...)
}
```

### Athlete
```typescript
interface Athlete {
  id: string;
  name: string;
  academy?: string;
  weight?: number;
}
```

## Bracket Generation Algorithm

```
Input: N athletes
1. Calculate next power of 2 >= N (e.g., 5 athletes -> 8 slots)
2. BYEs = slots - N (e.g., 3 BYEs)
3. Shuffle athletes randomly
4. Distribute BYEs in top slots (seeds 1-3 get BYE)
5. Generate match tree:
   - Round 1: slots/2 matches
   - Round 2: slots/4 matches
   - ...down to final (1 match)
6. BYE matches -> status 'BYE', winner advances immediately
```

Numbering: sequential per category (finish one category, start next).

## BroadcastChannel Sync

Typed messages on existing channel `championship-mat-{matId}`:

```typescript
type SyncMessage =
  | { type: 'MATCH_STATE'; payload: MatchState }
  | { type: 'TOURNAMENT_STATE'; payload: TournamentState }
  | { type: 'SHOW_BRACKET'; payload: { categoryId: string } }
  | { type: 'SHOW_SCOREBOARD' };
```

- Mat sends `TOURNAMENT_STATE` when bracket updates
- Mat sends `SHOW_BRACKET` automatically 5s after match ends
- Mat sends `SHOW_SCOREBOARD` when next fight starts
- TV alternates between `<BracketView />` and scoreboard

## localStorage Keys

```
sulsport:tournament          -> TournamentState
championship-state-mat-1     -> MatchState (existing)
```

## Operator Flow

```
/championship/tournament  ->  Create tournament, categories, athletes, generate brackets
/championship/mat         ->  Run fights (existing, enhanced with bracket context)
/championship/tv          ->  Spectator display (existing, enhanced with bracket view)
```

Default route: if no active tournament -> `/championship/tournament`. If active -> `/championship/mat`.

### Tournament Setup Page

1. Tournament info (name, date, location)
2. Add categories (3 selects: age + belt + weight + gender)
3. Add athletes per category (manual typing + CSV import)
4. Generate brackets (preview, re-shuffle option)
5. Start tournament -> redirect to Mat

### Mat Enhancements

- Header: "Luta 3/16 — Semi-final — Adulto Preta Até 68kg"
- Match end: winner auto-advances in bracket
- After result: auto-loads next fight (or "Próxima Luta" button)
- Override button to manually change winner
- Athletes pre-filled from bracket (no manual name entry)

### TV Enhancements

- When Mat is IDLE: show bracket of current category
- Bracket: tree with names, winners highlighted, next fight pulsing
- When fight starts (RUNNING): switch back to scoreboard

## Files

### New (10):
- `src/types/tournament.ts`
- `src/hooks/useTournament.ts`
- `src/hooks/useBracketGenerator.ts`
- `src/utils/csvParser.ts`
- `src/pages/TournamentSetup.tsx`
- `src/components/championship/BracketView.tsx`
- `src/components/championship/CategoryPanel.tsx`
- `src/components/championship/AthleteList.tsx`
- `src/components/championship/TournamentHeader.tsx`
- `src/components/championship/NextMatchBar.tsx`

### Modified (5):
- `src/types/championship.ts` — SyncMessage union type
- `src/hooks/useChampionshipSync.ts` — typed BroadcastChannel messages
- `src/pages/ChampionshipMat.tsx` — bracket context header + auto-load next fight
- `src/pages/ChampionshipTV.tsx` — alternate bracket/scoreboard
- `src/AppChampionship.tsx` — add /championship/tournament route

## Future (v2)
- Web portal for academy athlete registration
- Repechage bracket type
- Multi-mat federation
- PDF export of results
- Athlete photos and profiles
