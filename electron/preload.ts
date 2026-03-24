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
  openTVWindow: (matId: number) => ipcRenderer.invoke('open-tv-window', matId),
  closeTVWindow: () => ipcRenderer.invoke('close-tv-window'),
  getDisplays: () => ipcRenderer.invoke('get-displays'),
  onTVWindowClosed: (cb: () => void) => {
    ipcRenderer.on('tv-window-closed', cb);
    return () => ipcRenderer.removeListener('tv-window-closed', cb);
  },
});
