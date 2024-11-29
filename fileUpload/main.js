const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

let mainWindow;

// Function to create the main application window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true, // Caution: Consider using preload scripts for better security
      contextIsolation: false, // Recommended for modern Electron apps
      enableRemoteModule: false, // Prevent remote module usage
      preload: path.join(__dirname, 'preload.js'), // Add preload for secure operations
    },
  });

  // Load the main HTML file
  mainWindow.loadFile('src/index.html');

  // Open DevTools only in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null; // Clean up the reference
  });
}

// Application event listeners
app.whenReady().then(() => {
  createWindow();

  // Re-create a window when the app is activated (macOS specific behavior)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit the app when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Example: File upload handler using `ipcMain`
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'All Files', extensions: ['*'] }],
  });

  return result.canceled ? null : result.filePaths[0]; // Return the selected file path
});
