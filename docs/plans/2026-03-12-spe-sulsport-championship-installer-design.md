# SPE Sulsport — Standalone Championship Installer

## Overview
A separate Electron installer containing ONLY the championship mode from S-FIGHT PRO. Named "SPE Sulsport" with its own branding. Works 100% offline, no login required. Distributed to academies and tournament events.

## Architecture

### Same Repository, Separate Build Config
- No code duplication — championship components are shared
- Second Electron entry point + second electron-builder config
- Separate build script: `npm run electron:build:championship`

### New Files
| File | Purpose |
|------|---------|
| `electron/main-championship.ts` | Electron entry — loads `#/championship/mat` directly |
| `src/AppChampionship.tsx` | Minimal React app — no auth, no sidebar, no screensaver |
| `electron-builder-championship.yml` | Build config — name "SPE Sulsport", own appId + icon |

### Behavior
- Opens directly to Mat (operator) screen with button to open TV window
- No login, no sidebar, no other pages
- Serial hardware works normally
- Sound effects work normally
- Data persisted to localStorage only (Supabase persistence becomes no-op without auth)

### Providers Included
- `QueryClientProvider` (required by existing code)
- `SoundProvider` (sound effects)
- `SerialPortProvider` (hardware)

### Providers Removed
- `AuthProvider` — no login
- Screensaver — not needed

### Routes
- `/championship/mat` — operator panel (default)
- `/championship/tv` — TV/spectator display

### Build Identity
- Product name: `SPE Sulsport`
- App ID: `com.sulsport.spe`
- Icon: user-provided logo (pending)
- Installer output: `release/SPE-Sulsport-Setup-1.0.0.exe`
