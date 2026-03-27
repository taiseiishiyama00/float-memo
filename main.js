import { app, BrowserWindow, ipcMain, screen } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadState, saveStateAtomic } from './src/main/stateStore.js';
import { createDefaultState } from './src/main/defaultState.js';
import { computeInitialBounds, clampBoundsToWorkArea } from './src/main/windowPlacement.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_SIZE = { width: 420, height: 520 };

let mainWindow;
let stateFilePath;
let inMemoryState = createDefaultState();

function resolveBounds(savedWindow) {
  const display = screen.getPrimaryDisplay();
  const workArea = display.workArea;

  if (savedWindow && Number.isFinite(savedWindow.x) && Number.isFinite(savedWindow.y)) {
    const restored = {
      x: savedWindow.x,
      y: savedWindow.y,
      width: Number.isFinite(savedWindow.width) ? savedWindow.width : DEFAULT_SIZE.width,
      height: Number.isFinite(savedWindow.height) ? savedWindow.height : DEFAULT_SIZE.height
    };

    return clampBoundsToWorkArea(restored, workArea);
  }

  const initial = computeInitialBounds(
    { width: workArea.width, height: workArea.height },
    DEFAULT_SIZE
  );

  return {
    ...initial,
    x: initial.x + workArea.x,
    y: initial.y + workArea.y
  };
}

function createWindow() {
  const bounds = resolveBounds(inMemoryState.window);

  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    autoHideMenuBar: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src/renderer/index.html'));

  mainWindow.on('close', () => {
    if (!mainWindow) {
      return;
    }

    const boundsOnClose = mainWindow.getBounds();
    inMemoryState = {
      ...inMemoryState,
      window: {
        ...inMemoryState.window,
        x: boundsOnClose.x,
        y: boundsOnClose.y,
        width: boundsOnClose.width,
        height: boundsOnClose.height,
        isMaximized: mainWindow.isMaximized()
      },
      updatedAt: new Date().toISOString()
    };

    saveStateAtomic(stateFilePath, inMemoryState);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  stateFilePath = path.join(app.getPath('userData'), 'state.json');
  inMemoryState = loadState(stateFilePath);

  ipcMain.handle('load-state', () => inMemoryState);

  ipcMain.on('save-state', (_event, nextState) => {
    inMemoryState = {
      ...nextState,
      updatedAt: new Date().toISOString()
    };
    saveStateAtomic(stateFilePath, inMemoryState);
  });

  ipcMain.on('window-minimize', () => {
    if (mainWindow) {
      mainWindow.minimize();
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
