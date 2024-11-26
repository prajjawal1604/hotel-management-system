// main/index.js

import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { connectDB, closeDB, getDB } from './database/db';
import { AppState } from './database/appState'; 
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';

const MONGODB_URI = "mongodb+srv://tarunpereddideveloper:grNXUQTFUrVT3fdm@cluster0.xskhj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

function createWindow() {
  // Create the browser window.
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

  AppState.setMainWindow(mainWindow);

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  try {
    // Connect to MongoDB
    await connectDB(MONGODB_URI);
    await AppState.loadRoomData();  // Load initial data
    
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.electron');

    // DevTools shortcuts
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window);
    });

    createWindow();

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
    
  } catch (error) {
    console.error('Database connection failed:', error);
    app.quit();
  }
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', async () => {
  AppState.stopAutoUpdate();  // Stop the auto-update 
  AppState.stopAllIntervals();  // Add this linecheck
  await closeDB();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('get-state', () => {
  return AppState.state;
});

ipcMain.handle('login', async (_, credentials) => {
  return AppState.login(credentials);
});

ipcMain.handle('logout', () => {
  AppState.logout();
  return { success: true };
});

ipcMain.handle('get-rooms', () => {
  return { 
    success: true, 
    data: AppState.state.rooms.list 
  };
});

ipcMain.handle('get-room-stats', () => {
  return { 
    success: true, 
    data: AppState.state.rooms.stats 
  };
});

ipcMain.handle('updateRoom', async (_, roomData) => {
  return AppState.updateRoom(roomData);
});

// Add new IPC handlers
ipcMain.handle('addSpace', async (_, spaceData) => {
  return AppState.addSpace(spaceData);
});

ipcMain.handle('deleteSpace', async (_, spaceData) => {
  return AppState.deleteSpace(spaceData);
});

ipcMain.handle('reset-and-refresh', async () => {
  return AppState.resetAndRefresh();

  
});

ipcMain.handle('get-revenue-stats', async () => {
  return AppState.calculateRevenueStats();
});

// Update your IPC handlers to match
ipcMain.handle('addCategory', async (_, categoryData) => {
  return AppState.addCategory(categoryData);
});

ipcMain.handle('updateCategory', async (_, categoryData) => {
  return AppState.updateCategory(categoryData);
});

ipcMain.handle('deleteCategory', async (_, categoryName) => {
  return AppState.deleteCategory(categoryName);
});