import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  appVersion: process.env.npm_package_version || 'dev',

  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  toggleFullscreen: () => ipcRenderer.send('window:toggle-fullscreen'),
  isFullscreen: () => ipcRenderer.invoke('window:is-fullscreen'),
  isMaximized: () => ipcRenderer.invoke('window:is-maximized'),

  // App actions
  reload: () => ipcRenderer.send('app:reload'),

  // TV window management (Championship)
  openTVWindow: (matId: number, mode?: string) => ipcRenderer.invoke('open-tv-window', matId, mode),
  closeTVWindow: () => ipcRenderer.invoke('close-tv-window'),
  getDisplays: () => ipcRenderer.invoke('get-displays'),
  onTVWindowClosed: (cb: () => void) => {
    ipcRenderer.on('tv-window-closed', cb);
    return () => ipcRenderer.removeListener('tv-window-closed', cb);
  },

  // Auto-update
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  onUpdateAvailable: (cb: (info: any) => void) => {
    ipcRenderer.on('update-available', (_, info) => cb(info));
    return () => ipcRenderer.removeAllListeners('update-available');
  },
  onUpdateProgress: (cb: (progress: any) => void) => {
    ipcRenderer.on('update-progress', (_, progress) => cb(progress));
    return () => ipcRenderer.removeAllListeners('update-progress');
  },
  onUpdateDownloaded: (cb: () => void) => {
    ipcRenderer.on('update-downloaded', () => cb());
    return () => ipcRenderer.removeAllListeners('update-downloaded');
  },
  onUpdateChecking: (cb: () => void) => {
    ipcRenderer.on('update-checking', () => cb());
    return () => ipcRenderer.removeAllListeners('update-checking');
  },
  onUpdateNotAvailable: (cb: (info: any) => void) => {
    ipcRenderer.on('update-not-available', (_, info) => cb(info));
    return () => ipcRenderer.removeAllListeners('update-not-available');
  },
  onUpdateError: (cb: (info: any) => void) => {
    ipcRenderer.on('update-error', (_, info) => cb(info));
    return () => ipcRenderer.removeAllListeners('update-error');
  },
});
