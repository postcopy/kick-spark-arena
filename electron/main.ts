import { app, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import { setupSerialPermissions, registerIpcHandlers, setupKeyboardShortcuts } from './shared';

let mainWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    fullscreen: true,
    simpleFullscreen: true,
    frame: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../public/favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#0A0A0F',
    show: false,
  });

  setupSerialPermissions(mainWindow, '[Electron-SFighter]');
  setupKeyboardShortcuts(mainWindow);

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:8080');
    // Only open DevTools if explicitly requested
    if (process.env.ELECTRON_DEBUG === '1') {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Register IPC handlers ONCE, before any window is created
  registerIpcHandlers(() => mainWindow);

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
