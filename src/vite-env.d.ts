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
  openTVWindow: (matId: number) => Promise<{ success: boolean; display?: number; isSecondary?: boolean }>;
  closeTVWindow: () => Promise<{ success: boolean }>;
  getDisplays: () => Promise<Array<{ id: number; label: string; width: number; height: number; isPrimary: boolean }>>;
  onTVWindowClosed: (cb: () => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
