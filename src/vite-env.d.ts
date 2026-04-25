/// <reference types="vite/client" />

declare module '*.mp3' {
  const src: string;
  export default src;
}

interface ElectronAPI {
  isElectron: boolean;
  platform: string;
  appVersion: string;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  toggleFullscreen: () => void;
  isFullscreen: () => Promise<boolean>;
  isMaximized: () => Promise<boolean>;
  reload: () => void;
  openTVWindow: (matId: number, mode?: string) => Promise<{ success: boolean; display?: number; isSecondary?: boolean }>;
  closeTVWindow: () => Promise<{ success: boolean }>;
  getDisplays: () => Promise<Array<{ id: number; label: string; width: number; height: number; isPrimary: boolean }>>;
  onTVWindowClosed: (cb: () => void) => () => void;
  // Auto-update
  checkForUpdates: () => Promise<{ ok: boolean; currentVersion: string; updateAvailable?: boolean; version?: string | null; error?: string }>;
  downloadUpdate: () => Promise<void>;
  installUpdate: () => Promise<void>;
  getAppVersion: () => Promise<string>;
  onUpdateAvailable: (cb: (info: any) => void) => () => void;
  onUpdateProgress: (cb: (progress: any) => void) => () => void;
  onUpdateDownloaded: (cb: () => void) => () => void;
  onUpdateChecking: (cb: () => void) => () => void;
  onUpdateNotAvailable: (cb: (info: any) => void) => () => void;
  onUpdateError: (cb: (info: any) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
