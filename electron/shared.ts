import { BrowserWindow, ipcMain } from 'electron';

/**
 * Sets up serial port permissions, device tracking, and auto-select on a window's session.
 */
export function setupSerialPermissions(window: BrowserWindow, logPrefix: string = '[Electron]'): void {
  const session = window.webContents.session;

  // Only allow permissions needed for hardware communication
  const ALLOWED_PERMISSIONS = ['serial', 'usb', 'hid'];
  session.setPermissionCheckHandler((_webContents, permission) => {
    if (ALLOWED_PERMISSIONS.includes(permission)) {
      console.log(`${logPrefix} Permission GRANTED:`, permission);
      return true;
    }
    console.log(`${logPrefix} Permission DENIED:`, permission);
    return false;
  });

  session.setDevicePermissionHandler((details) => {
    console.log(`${logPrefix} Device permission:`, details.deviceType);
    return true;
  });

  // Track serial ports dynamically
  session.on('serial-port-added', (_event, port) => {
    console.log(`${logPrefix} Serial port ADDED:`, port.portName, '| id:', port.portId);
  });
  session.on('serial-port-removed', (_event, port) => {
    console.log(`${logPrefix} Serial port REMOVED:`, port.portName, '| id:', port.portId);
  });

  // Auto-select first available serial port (no popup in Electron)
  session.on('select-serial-port', (event, portList, _webContents, callback) => {
    event.preventDefault();
    console.log(`${logPrefix} ===================================`);
    console.log(`${logPrefix} select-serial-port chamado:`, portList.length, 'porta(s)');
    if (portList.length === 0) {
      console.warn(`${logPrefix} NENHUMA porta serial encontrada!`);
      console.warn(`${logPrefix} Verifique: placa conectada? Driver instalado? (CH340/CP2102/FTDI)`);
      callback('');
      return;
    }
    portList.forEach((p, i) => {
      console.log(`  [${i}] ${p.portName} | portId: ${p.portId} | displayName: ${(p as any).displayName || 'N/A'} | vendorId: ${(p as any).vendorId || 'N/A'} | productId: ${(p as any).productId || 'N/A'}`);
    });
    console.log(`${logPrefix} -> Selecionando:`, portList[0].portName);
    console.log(`${logPrefix} ===================================`);
    callback(portList[0].portId);
  });
}

/**
 * Registers IPC handlers for window controls.
 * Must be called ONCE (not per-window). Uses a getter so the handlers
 * always reference the current mainWindow even after re-creation.
 */
export function registerIpcHandlers(getWindow: () => BrowserWindow | null): void {
  ipcMain.on('window:minimize', () => getWindow()?.minimize());
  ipcMain.on('window:maximize', () => {
    const win = getWindow();
    if (win?.isMaximized()) {
      win.unmaximize();
    } else {
      win?.maximize();
    }
  });
  ipcMain.on('window:close', () => getWindow()?.close());
  ipcMain.on('window:toggle-fullscreen', () => {
    const win = getWindow();
    win?.setFullScreen(!win.isFullScreen());
  });
  ipcMain.on('app:reload', () => getWindow()?.webContents.reload());
  ipcMain.handle('window:is-fullscreen', () => getWindow()?.isFullScreen() ?? false);
  ipcMain.handle('window:is-maximized', () => getWindow()?.isMaximized() ?? false);
}

/**
 * Sets up F11 (toggle fullscreen) keyboard shortcut.
 * ESC is NOT intercepted here — it goes to the renderer for in-app navigation.
 * Returns nothing; callers can add additional shortcuts after calling this.
 */
export function setupKeyboardShortcuts(
  window: BrowserWindow,
  extra?: (input: Electron.Input) => void,
): void {
  window.webContents.on('before-input-event', (_event, input) => {
    if (input.key === 'F11') {
      window.setFullScreen(!window.isFullScreen());
    }
    // ESC does NOT exit fullscreen — it navigates back in the app
    if (extra) {
      extra(input);
    }
  });
}
