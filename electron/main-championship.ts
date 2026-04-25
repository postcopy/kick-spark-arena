import { app, BrowserWindow, screen, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import fs from 'fs';
import { setupSerialPermissions, registerIpcHandlers, setupKeyboardShortcuts } from './shared';

// Minimal file logger pra updater (electron-log nao esta instalado).
// Grava em userData/updater.log — limite ~256KB com rotacao simples.
const updaterLogPath = path.join(app.getPath('userData'), 'updater.log');
function updaterLog(level: string, ...args: unknown[]) {
  const line = `[${new Date().toISOString()}] [${level}] ${args.map(a =>
    typeof a === 'string' ? a : (() => { try { return JSON.stringify(a); } catch { return String(a); } })()
  ).join(' ')}\n`;
  try {
    if (fs.existsSync(updaterLogPath)) {
      const stat = fs.statSync(updaterLogPath);
      if (stat.size > 256 * 1024) {
        try { fs.renameSync(updaterLogPath, updaterLogPath + '.old'); } catch { /* ignore */ }
      }
    }
    fs.appendFileSync(updaterLogPath, line);
  } catch { /* ignore — nao bloquear app por log */ }
  // eslint-disable-next-line no-console
  console.log(`[AutoUpdater] ${level}`, ...args);
}

// Faster GPU startup on low-end hardware
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');

let mainWindow: BrowserWindow | null = null;
let tvWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 720,
    // KPNP-style: janela compacta centralizada pro operador (nao fullscreen).
    // Fullscreen permanece apenas na TV broadcast (openTVWindow).
    fullscreen: false,
    center: true,
    resizable: true,
    maximizable: true,
    // Barra de titulo NATIVA do Windows — minimize/maximize/close sempre
    // visiveis, professional, nao atrapalha. Substituiu ImmersiveTitleBar
    // (custom auto-hide que parecia amador).
    frame: true,
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../public/favicon.ico'),
    title: 'SPE Sulsport',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // Desativa throttling de background pra TV nao atrasar quando
      // a janela do operador esta em foco (e vice-versa).
      backgroundThrottling: false,
    },
    backgroundColor: '#050507',
    show: true,
  });

  setupSerialPermissions(mainWindow, '[Electron]');

  // F12 toggle devTools — only in dev mode with ELECTRON_DEBUG=1
  setupKeyboardShortcuts(mainWindow, (input) => {
    if (input.key === 'F12' && isDev && process.env.ELECTRON_DEBUG === '1') {
      mainWindow?.webContents.toggleDevTools();
    }
  });

  // Block default window.open — we handle TV via IPC
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:8081');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist-championship/index-championship.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Register IPC handlers ONCE, before any window is created
  registerIpcHandlers(() => mainWindow);

  // IPC: Open TV window on second display (or same display if only one)
  ipcMain.handle('open-tv-window', (_event, matId: number, mode?: string) => {
    if (tvWindow && !tvWindow.isDestroyed()) {
      tvWindow.focus();
      return { success: true, display: 'existing' };
    }

    const displays = screen.getAllDisplays();
    const mainDisplay = mainWindow ? screen.getDisplayMatching(mainWindow.getBounds()) : displays[0];
    // Pick a display that is NOT the main window's display, or fallback to same
    const tvDisplay = displays.find(d => d.id !== mainDisplay.id) || mainDisplay;
    const { x, y, width, height } = tvDisplay.workArea;

    console.log(`[Electron] Opening TV on display ${tvDisplay.id} (${width}x${height}) at (${x},${y}). Total displays: ${displays.length}`);

    tvWindow = new BrowserWindow({
      x, y, width, height,
      fullscreen: true,
      frame: false,
      autoHideMenuBar: true,
      backgroundColor: '#0A0A0F',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    // Load the TV route
    const modeParam = mode ? `&mode=${mode}` : '';
    const tvHash = `#/championship/tv?mat=${matId}${modeParam}`;
    if (isDev) {
      tvWindow.loadURL(`http://localhost:8081/${tvHash}`);
    } else {
      tvWindow.loadFile(
        path.join(__dirname, '../dist-championship/index-championship.html'),
        { hash: `/championship/tv?mat=${matId}${modeParam}` }
      );
    }

    tvWindow.on('closed', () => {
      tvWindow = null;
      // Notify main window that TV closed
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('tv-window-closed');
      }
    });

    return { success: true, display: tvDisplay.id, isSecondary: tvDisplay.id !== mainDisplay.id };
  });

  // IPC: Close TV window
  ipcMain.handle('close-tv-window', () => {
    if (tvWindow && !tvWindow.isDestroyed()) {
      tvWindow.close();
      tvWindow = null;
    }
    return { success: true };
  });

  // IPC: Get available displays info
  ipcMain.handle('get-displays', () => {
    const displays = screen.getAllDisplays();
    return displays.map(d => ({
      id: d.id,
      label: d.label || `Display ${d.id}`,
      width: d.workArea.width,
      height: d.workArea.height,
      isPrimary: d.id === screen.getPrimaryDisplay().id,
    }));
  });

  createWindow();

  // Auto-updater config
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  // electron-updater aceita um logger {info, warn, error, debug}.
  // Habilitar pra arquivo permite triagem de instalacoes "silenciosas".
  autoUpdater.logger = {
    info: (...a: unknown[]) => updaterLog('INFO', ...a),
    warn: (...a: unknown[]) => updaterLog('WARN', ...a),
    error: (...a: unknown[]) => updaterLog('ERROR', ...a),
    debug: (...a: unknown[]) => updaterLog('DEBUG', ...a),
  } as unknown as typeof autoUpdater.logger;

  updaterLog('INFO', `App ${app.getName()} v${app.getVersion()} starting. isDev=${isDev}`);

  // Auto-updater events → send to renderer
  autoUpdater.on('checking-for-update', () => {
    updaterLog('INFO', 'checking-for-update');
    mainWindow?.webContents.send('update-checking');
  });
  autoUpdater.on('update-available', (info) => {
    updaterLog('INFO', 'update-available', { version: info.version });
    mainWindow?.webContents.send('update-available', { version: info.version, releaseDate: info.releaseDate });
  });
  autoUpdater.on('update-not-available', (info) => {
    updaterLog('INFO', 'update-not-available', { version: info?.version });
    mainWindow?.webContents.send('update-not-available', { version: info?.version || app.getVersion() });
  });
  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send('update-progress', { percent: Math.round(progress.percent), bytesPerSecond: progress.bytesPerSecond, transferred: progress.transferred, total: progress.total });
  });
  autoUpdater.on('update-downloaded', () => {
    updaterLog('INFO', 'update-downloaded');
    mainWindow?.webContents.send('update-downloaded');
  });
  autoUpdater.on('error', (err) => {
    updaterLog('ERROR', err?.message || String(err));
    mainWindow?.webContents.send('update-error', { message: err?.message || String(err) });
  });

  // IPC handlers
  ipcMain.handle('check-for-updates', async () => {
    try {
      const r = await autoUpdater.checkForUpdates();
      return {
        ok: true,
        currentVersion: app.getVersion(),
        updateAvailable: !!r?.updateInfo && r.updateInfo.version !== app.getVersion(),
        version: r?.updateInfo?.version || null,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      updaterLog('ERROR', 'check-for-updates failed', msg);
      return { ok: false, error: msg, currentVersion: app.getVersion() };
    }
  });
  ipcMain.handle('download-update', () => autoUpdater.downloadUpdate());
  ipcMain.handle('install-update', () => autoUpdater.quitAndInstall());
  ipcMain.handle('get-app-version', () => app.getVersion());
  ipcMain.handle('get-updater-log-path', () => updaterLogPath);

  // Check for updates 5 seconds after app is ready (only in production)
  if (!isDev) {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch((e) => updaterLog('ERROR', 'initial check failed', e?.message));
    }, 5000);
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
