import { app, BrowserWindow, screen, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import { setupSerialPermissions, registerIpcHandlers, setupKeyboardShortcuts } from './shared';

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
  autoUpdater.logger = null; // disable default logging

  // Auto-updater events → send to renderer
  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('update-available', { version: info.version, releaseDate: info.releaseDate });
  });
  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send('update-progress', { percent: Math.round(progress.percent), bytesPerSecond: progress.bytesPerSecond, transferred: progress.transferred, total: progress.total });
  });
  autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('update-downloaded');
  });
  autoUpdater.on('error', (err) => {
    console.error('[AutoUpdater] Error:', err.message);
  });

  // IPC handlers
  ipcMain.handle('check-for-updates', async () => {
    try { return await autoUpdater.checkForUpdates(); } catch (e) { return null; }
  });
  ipcMain.handle('download-update', () => autoUpdater.downloadUpdate());
  ipcMain.handle('install-update', () => autoUpdater.quitAndInstall());
  ipcMain.handle('get-app-version', () => app.getVersion());

  // Check for updates 5 seconds after app is ready (only in production)
  if (!isDev) {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(() => {});
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
