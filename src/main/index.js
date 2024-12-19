import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import { initializeDatabases } from './database/dbInit';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

// Initialization
app.whenReady().then(async () => {
  try {
    // Initialize databases (master and org)
    await initializeDatabases();
    
    electronApp.setAppUserModelId('com.electron');

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window);
    });

    createWindow();

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    app.quit();
  }
});

// Clean up
app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Basic IPC Handlers for connection status
ipcMain.handle('check-connection-status', async () => {
  const connectionManager = require('./database/connectionManager');
  return {
    masterConnected: !!connectionManager.getMasterConnection(),
    orgConnected: !!connectionManager.getOrgConnection()
  };
});

// Add more IPC handlers as we implement features