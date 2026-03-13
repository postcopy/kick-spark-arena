# Electron Desktop App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Package the S-FIGHT PRO React app as a standalone Windows desktop application with `.exe` installer.

**Architecture:** Electron wraps the existing Vite-built React app. Main process creates a fullscreen BrowserWindow that loads the built `index.html`. electron-builder generates an NSIS installer for Windows x64.

**Tech Stack:** Electron 28+, electron-builder, electron-updater, Vite 5, React 18, TypeScript

---

### Task 1: Install Electron dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install Electron and build tools**

Run:
```bash
npm install --save-dev electron electron-builder concurrently wait-on
npm install electron-updater
```

**Step 2: Verify installation**

Run:
```bash
npx electron --version
```
Expected: `v28.x.x` or similar

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add Electron and build dependencies"
```

---

### Task 2: Create Electron main process

**Files:**
- Create: `electron/main.ts`

**Step 1: Create the electron directory**

Run:
```bash
mkdir -p electron
```

**Step 2: Write `electron/main.ts`**

```typescript
import { app, BrowserWindow, globalShortcut, session } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    fullscreen: true,
    frame: false,
    icon: path.join(__dirname, '../public/favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#0A0A0F',
    show: false,
  });

  // Enable Web Serial API
  mainWindow.webContents.session.on('select-serial-port', (event, portList, webContents, callback) => {
    event.preventDefault();
    // Show native port picker by returning empty string — Electron will show its own picker
    if (portList && portList.length > 0) {
      callback(portList[0].portId);
    } else {
      callback('');
    }
  });

  mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    if (permission === 'serial') return true;
    return true;
  });

  mainWindow.webContents.session.setDevicePermissionHandler((details) => {
    if (details.deviceType === 'serial') return true;
    return false;
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:8080');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Keyboard shortcuts
  mainWindow.webContents.on('before-input-event', (event, input) => {
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

  // Auto-update (production only)
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }

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

**Step 3: Verify file exists**

Run:
```bash
cat electron/main.ts | head -5
```
Expected: First 5 lines of the file.

**Step 4: Commit**

```bash
git add electron/main.ts
git commit -m "feat: add Electron main process with fullscreen window and serial support"
```

---

### Task 3: Create Electron preload script

**Files:**
- Create: `electron/preload.ts`

**Step 1: Write `electron/preload.ts`**

```typescript
import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  appVersion: process.env.npm_package_version || 'dev',
});
```

**Step 2: Commit**

```bash
git add electron/preload.ts
git commit -m "feat: add Electron preload script with version info bridge"
```

---

### Task 4: Configure TypeScript for Electron files

**Files:**
- Create: `electron/tsconfig.json`

**Step 1: Write `electron/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "outDir": "../dist-electron",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": false,
    "sourceMap": true
  },
  "include": ["./**/*.ts"]
}
```

**Step 2: Commit**

```bash
git add electron/tsconfig.json
git commit -m "chore: add TypeScript config for Electron main process"
```

---

### Task 5: Configure electron-builder

**Files:**
- Create: `electron-builder.yml`

**Step 1: Write `electron-builder.yml`**

```yaml
appId: com.sfight.pro
productName: S-FIGHT PRO
copyright: Copyright © 2026 S-Fight

directories:
  output: release
  buildResources: build

files:
  - dist/**/*
  - dist-electron/**/*
  - public/favicon.ico

extraMetadata:
  main: dist-electron/main.js

win:
  target:
    - target: nsis
      arch:
        - x64
  icon: public/favicon.ico
  artifactName: S-FIGHT-PRO-Setup-${version}.${ext}

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: S-FIGHT PRO
  installerIcon: public/favicon.ico
  uninstallerIcon: public/favicon.ico
  installerHeaderIcon: public/favicon.ico

publish:
  provider: github
  owner: OWNER
  repo: kick-spark-arena
```

**Step 2: Commit**

```bash
git add electron-builder.yml
git commit -m "chore: add electron-builder config for Windows NSIS installer"
```

---

### Task 6: Update Vite config for Electron compatibility

**Files:**
- Modify: `vite.config.ts`

**Step 1: Update `vite.config.ts` to set base path for Electron**

The key change: in production Electron, files are loaded from disk via `file://` protocol, so `base` must be `'./'` (relative paths). Add this to the existing config:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? './' : '/',
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
```

**Step 2: Verify the change**

Run:
```bash
npx vite build
```
Expected: Build succeeds. Check that `dist/index.html` uses relative paths (`./assets/...` instead of `/assets/...`).

**Step 3: Commit**

```bash
git add vite.config.ts
git commit -m "fix: set relative base path for Electron file:// protocol"
```

---

### Task 7: Bundle Google Fonts locally

**Files:**
- Create: `src/fonts/rajdhani-400.woff2` (download)
- Create: `src/fonts/rajdhani-500.woff2` (download)
- Create: `src/fonts/rajdhani-600.woff2` (download)
- Create: `src/fonts/rajdhani-700.woff2` (download)
- Create: `src/fonts/jetbrains-mono-400.woff2` (download)
- Create: `src/fonts/jetbrains-mono-500.woff2` (download)
- Create: `src/fonts/jetbrains-mono-700.woff2` (download)
- Create: `src/fonts/fonts.css`
- Modify: `index.html` (remove Google Fonts CDN links)
- Modify: `src/index.css` (import local fonts)

**Step 1: Download font files**

Run:
```bash
mkdir -p src/fonts

# Rajdhani
curl -L -o src/fonts/rajdhani-400.woff2 "https://fonts.gstatic.com/s/rajdhani/v15/LDIxapCSOBg7S-QT7p4HM-S.woff2"
curl -L -o src/fonts/rajdhani-500.woff2 "https://fonts.gstatic.com/s/rajdhani/v15/LDI2apCSOBg7S-QT7pasEcOsc-b.woff2"
curl -L -o src/fonts/rajdhani-600.woff2 "https://fonts.gstatic.com/s/rajdhani/v15/LDI2apCSOBg7S-QT7pb4FsOsc-b.woff2"
curl -L -o src/fonts/rajdhani-700.woff2 "https://fonts.gstatic.com/s/rajdhani/v15/LDI2apCSOBg7S-QT7pa8F8Osc-b.woff2"

# JetBrains Mono
curl -L -o src/fonts/jetbrains-mono-400.woff2 "https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxTOlOV.woff2"
curl -L -o src/fonts/jetbrains-mono-500.woff2 "https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8SD8yKxTOlOV.woff2"
curl -L -o src/fonts/jetbrains-mono-700.woff2 "https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxTOlOV.woff2"
```

**Step 2: Create `src/fonts/fonts.css`**

```css
@font-face {
  font-family: 'Rajdhani';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('./rajdhani-400.woff2') format('woff2');
}
@font-face {
  font-family: 'Rajdhani';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('./rajdhani-500.woff2') format('woff2');
}
@font-face {
  font-family: 'Rajdhani';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('./rajdhani-600.woff2') format('woff2');
}
@font-face {
  font-family: 'Rajdhani';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('./rajdhani-700.woff2') format('woff2');
}
@font-face {
  font-family: 'JetBrains Mono';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('./jetbrains-mono-400.woff2') format('woff2');
}
@font-face {
  font-family: 'JetBrains Mono';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('./jetbrains-mono-500.woff2') format('woff2');
}
@font-face {
  font-family: 'JetBrains Mono';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('./jetbrains-mono-700.woff2') format('woff2');
}
```

**Step 3: Remove Google Fonts CDN from `index.html`**

In `index.html`, remove these 3 lines:
```html
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

**Step 4: Import local fonts in `src/index.css`**

Add at the very top of `src/index.css`:
```css
@import './fonts/fonts.css';
```

**Step 5: Verify fonts load locally**

Run:
```bash
npm run dev
```
Open browser, inspect — fonts should load from local files, not Google CDN.

**Step 6: Commit**

```bash
git add src/fonts/ index.html src/index.css
git commit -m "feat: bundle Google Fonts locally for offline desktop support"
```

---

### Task 8: Add npm scripts for Electron dev and build

**Files:**
- Modify: `package.json`

**Step 1: Add scripts and main entry to `package.json`**

Add to `package.json` root:
```json
"main": "dist-electron/main.js",
```

Add to `scripts`:
```json
"electron:compile": "tsc -p electron/tsconfig.json",
"electron:dev": "npm run electron:compile && concurrently \"npm run dev\" \"wait-on http://localhost:8080 && electron .\"",
"electron:build": "npm run build && npm run electron:compile && electron-builder --win",
"electron:preview": "npm run build && npm run electron:compile && electron ."
```

**Step 2: Verify dev workflow**

Run:
```bash
npm run electron:dev
```
Expected: Vite starts, then Electron window opens loading the app fullscreen.

**Step 3: Commit**

```bash
git add package.json
git commit -m "feat: add Electron dev and build npm scripts"
```

---

### Task 9: Build the Windows installer

**Files:**
- None new — this uses existing config

**Step 1: Run the full build**

Run:
```bash
npm run electron:build
```
Expected:
- Vite builds React to `dist/`
- TypeScript compiles Electron to `dist-electron/`
- electron-builder produces `release/S-FIGHT-PRO-Setup-0.0.0.exe`

**Step 2: Test the installer**

- Double-click the `.exe` in `release/`
- Walk through the NSIS installer
- Launch the app from Desktop shortcut
- Verify: fullscreen window, app loads, can navigate between modes

**Step 3: Test serial port**

- Connect a taekwondo sensor via USB
- Verify the serial port selection dialog appears
- Verify sensor data flows correctly

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: Electron desktop app with Windows installer complete"
```

---

### Task 10: Add `.gitignore` entries for Electron artifacts

**Files:**
- Modify: `.gitignore`

**Step 1: Add Electron build artifacts to `.gitignore`**

Append:
```
# Electron
dist-electron/
release/
```

**Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: ignore Electron build artifacts"
```
