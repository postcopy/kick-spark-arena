# S-FIGHT PRO Desktop App — Design Document

## Goal

Convert the S-FIGHT PRO React web app into a standalone Windows desktop application using Electron, with a `.exe` installer compatible with Windows 10/11. Zero changes to existing React code. Web Serial API for taekwondo sensors works natively.

## Architecture

```
kick-spark-arena-main/
  electron/
    main.ts            # Electron main process — window creation, lifecycle, auto-update
    preload.ts         # Secure bridge (contextBridge) between Node.js and renderer
  src/                 # Existing React app (unchanged)
  public/              # Static assets (unchanged)
  dist/                # Vite build output (renderer)
  release/             # electron-builder output (.exe installer)
  electron-builder.yml # Installer configuration
  vite.config.ts       # Modified: base path for Electron compatibility
  package.json         # Modified: add Electron deps and scripts
```

### Process Model

- **Main process** (`electron/main.ts`): Creates BrowserWindow, manages app lifecycle, handles auto-update checks.
- **Renderer process**: The existing React app loaded from Vite build output. No changes needed.
- **Preload script** (`electron/preload.ts`): Minimal — exposes app version to renderer via contextBridge.

### Build Pipeline

1. `vite build` compiles React app to `dist/`
2. `electron-builder` packages `dist/` + `electron/` + Chromium into `.exe` installer

## Window Behavior

- Fullscreen by default (arcade/training environment)
- No native menu bar (clean UI)
- Custom frameless window with minimize/close buttons in title area
- F11 toggles fullscreen
- ESC exits fullscreen (does not close app)
- Minimum size: 1024x768
- App icon: S-FIGHT logo as `.ico`

## Installer (NSIS)

- Format: NSIS `.exe` (standard Windows installer)
- Install path: `C:\Program Files\S-FIGHT PRO`
- Creates Desktop shortcut + Start Menu entry
- App name: "S-FIGHT PRO"
- Target: Windows 10+ x64
- Output filename: `S-FIGHT-PRO-Setup-{version}.exe`

## Auto-Update

- Uses `electron-updater` with GitHub Releases as update source
- On app start: checks for updates silently
- If update available: shows notification, downloads in background
- Applies on next restart (non-intrusive)

## Offline Resilience

- All game logic is client-side — training sessions continue if internet drops
- Supabase calls fail silently during offline periods
- Fonts bundled locally (no Google Fonts CDN dependency at runtime)
- Sensor connection (Web Serial API) is fully local, unaffected by network

## Web Serial API

- Chromium in Electron supports Web Serial API natively
- No changes to `useSerialPort.ts` or `SerialPortContext.tsx`
- User selects COM port on first connection (browser-style dialog)
- Port authorization persists across sessions

## Dependencies Added

- `electron` (~28.x) — runtime
- `electron-builder` — packaging and installer generation
- `electron-updater` — auto-update mechanism
- `concurrently` / `wait-on` — dev workflow (run Vite + Electron together)

## Scripts

- `npm run dev` — Vite dev server (existing, unchanged)
- `npm run electron:dev` — Vite + Electron in dev mode with hot reload
- `npm run electron:build` — Vite build + electron-builder → produces `.exe`

## What Does NOT Change

- All React components, hooks, contexts
- All Supabase integration
- All game logic and state management
- All styling (Tailwind, fonts, design system)
- Web Serial API usage
- Sound system
- Router and navigation
