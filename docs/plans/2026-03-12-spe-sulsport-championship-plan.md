# SPE Sulsport Championship Installer — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a standalone Electron installer named "SPE Sulsport" that only contains the championship mode (Mat + TV screens), works 100% offline, no login required.

**Architecture:** Same repository, separate Electron entry point (`main-championship.ts`) + separate React root (`AppChampionship.tsx`) + separate electron-builder config (`electron-builder-championship.yml`). New build script `electron:build:championship`. Shares all championship components and hooks unchanged.

**Tech Stack:** Electron 41, React 18, Vite 5, electron-builder, TypeScript

**Key Insight:** `useChampionshipPersistence` calls `useAuth()` which requires `AuthProvider`. We keep `AuthProvider` in the tree — it initializes with `user: null` (no session), so persistence becomes a silent no-op. No code changes needed in existing hooks.

---

### Task 1: Save SPE Sulsport logo assets

**Files:**
- User must save: `src/assets/logo-spe.png` (full logo, black version)
- User must save: `src/assets/icon-spe.png` (star icon, black version)
- User must save: `public/icon-spe.ico` (ICO for Windows installer — convert from icon-spe.png)

**Step 1:** Ask user to save the logos they sent to the paths above. The black versions are needed (the white `logo-spe-branca.png` already exists and is used inside the Mat screen). For the `.ico`, use an online PNG-to-ICO converter (256x256).

**Step 2:** Verify files exist:
```bash
ls src/assets/logo-spe.png src/assets/icon-spe.png public/icon-spe.ico
```

---

### Task 2: Create `src/AppChampionship.tsx`

**Files:**
- Create: `src/AppChampionship.tsx`

**Step 1: Create the minimal React app**

This is a stripped-down version of `src/App.tsx` with only championship routes. Keeps AuthProvider (needed by useChampionshipPersistence — will be null/no-op offline), SoundProvider, SerialPortProvider.

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SoundProvider } from "@/contexts/SoundContext";
import { SerialPortProvider } from "@/contexts/SerialPortContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import ChampionshipMat from "./pages/ChampionshipMat";
import ChampionshipTV from "./pages/ChampionshipTV";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 1000 * 60 * 60 * 24,
      retry: false,
    },
  },
});

const AppChampionship = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SoundProvider>
        <SerialPortProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <HashRouter>
              <Routes>
                <Route path="/championship/mat" element={<ChampionshipMat />} />
                <Route path="/championship/tv" element={<ChampionshipTV />} />
                <Route path="*" element={<Navigate to="/championship/mat" replace />} />
              </Routes>
            </HashRouter>
          </TooltipProvider>
        </SerialPortProvider>
      </SoundProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default AppChampionship;
```

**Step 2: Verify TypeScript compiles**
```bash
npx tsc --noEmit
```

---

### Task 3: Create `src/main-championship.tsx` (Vite entry point)

**Files:**
- Create: `src/main-championship.tsx`

**Step 1: Create the Vite entry for championship**

```tsx
import { createRoot } from 'react-dom/client';
import AppChampionship from './AppChampionship.tsx';
import './index.css';

createRoot(document.getElementById("root")!).render(<AppChampionship />);
```

---

### Task 4: Create `index-championship.html`

**Files:**
- Create: `index-championship.html` (root of project, next to existing `index.html`)

**Step 1: Create the HTML entry**

Copy `index.html` but change the script src:

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SPE Sulsport</title>
    <link rel="icon" type="image/x-icon" href="/icon-spe.ico" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main-championship.tsx"></script>
  </body>
</html>
```

---

### Task 5: Create `vite.config.championship.ts`

**Files:**
- Create: `vite.config.championship.ts`

**Step 1: Create Vite config for championship build**

This overrides the input to use `index-championship.html`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: "./",
  build: {
    outDir: "dist-championship",
    rollupOptions: {
      input: path.resolve(__dirname, "index-championship.html"),
    },
  },
  server: {
    port: 8081,
  },
});
```

---

### Task 6: Create `electron/main-championship.ts`

**Files:**
- Create: `electron/main-championship.ts`

**Step 1: Create the Electron entry for championship**

Based on `electron/main.ts` but loads `index-championship.html` and navigates to `#/championship/mat`:

```ts
import { app, BrowserWindow } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    fullscreen: false,
    frame: true,
    icon: path.join(__dirname, '../public/icon-spe.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#0A0A0F',
    show: false,
  });

  // Enable Web Serial API permissions
  mainWindow.webContents.session.on('select-serial-port', (event, portList, _webContents, callback) => {
    event.preventDefault();
    if (portList && portList.length > 0) {
      callback(portList[0].portId);
    } else {
      callback('');
    }
  });

  mainWindow.webContents.session.setPermissionCheckHandler((_webContents, permission) => {
    if (permission === 'serial') return true;
    return true;
  });

  mainWindow.webContents.session.setDevicePermissionHandler((details) => {
    if (details.deviceType === 'serial') return true;
    return false;
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:8081');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist-championship/index-championship.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Keyboard shortcuts
  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (input.key === 'F11') {
      mainWindow?.setFullScreen(!mainWindow.isFullScreen());
    }
    if (input.key === 'Escape' && mainWindow?.isFullScreen()) {
      mainWindow.setFullScreen(false);
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
```

Note: No `autoUpdater` — standalone app doesn't auto-update.

---

### Task 7: Create `electron-builder-championship.yml`

**Files:**
- Create: `electron-builder-championship.yml`

**Step 1: Create the builder config**

```yaml
appId: com.sulsport.spe
productName: SPE Sulsport
directories:
  output: release-championship
  buildResources: build
files:
  - dist-championship/**/*
  - dist-electron/**/*
  - package.json
  - "!node_modules/**/*"
  - node_modules/**/*.node
extraMetadata:
  main: dist-electron/main-championship.js
win:
  target: nsis
  icon: public/icon-spe.ico
nsis:
  oneClick: true
  perMachine: false
  allowToChangeInstallationDirectory: false
  artifactName: "SPE-Sulsport-Setup-${version}.exe"
```

---

### Task 8: Add build scripts to `package.json`

**Files:**
- Modify: `package.json`

**Step 1: Add championship build scripts**

Add these scripts:

```json
"build:championship": "vite build --config vite.config.championship.ts",
"electron:dev:championship": "npm run electron:compile && concurrently \"vite --config vite.config.championship.ts\" \"wait-on http://localhost:8081 && electron --main dist-electron/main-championship.js .\"",
"electron:build:championship": "npm run build:championship && npm run electron:compile && electron-builder --win --config electron-builder-championship.yml"
```

---

### Task 9: Verify TypeScript + Build

**Step 1: TypeScript check**
```bash
npx tsc --noEmit
```
Expected: No errors

**Step 2: Build the championship Vite bundle**
```bash
npm run build:championship
```
Expected: Output in `dist-championship/`

**Step 3: Build the Electron installer**
```bash
npm run electron:build:championship
```
Expected: `release-championship/SPE-Sulsport-Setup-1.0.0.exe`

---

### Task 10: Dev test

**Step 1: Run dev server**
```bash
npm run electron:dev:championship
```
Expected: Electron window opens showing ChampionshipMat screen directly, with full serial + sound support.

**Step 2: Verify TV window opens** — click the "Abrir TV" button, second window should open.

**Step 3: Verify no login screen** — app should go straight to Mat, never show login.
