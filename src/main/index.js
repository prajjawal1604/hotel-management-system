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

ipcMain.handle('login', async (_, credentials) => {
  try {
    const { identifier, password, role } = credentials;
    const isEmail = identifier.includes('@');

    // Get the connected orgDB
    const orgConnection = connectionManager.getOrgConnection();
    const { User } = models.getOrgModels();

    // Check user credentials
    const query = isEmail 
      ? { email: identifier, role } 
      : { username: identifier, role };
    
    const user = await User.findOne(query);

    if (!user) {
      return {
        success: false,
        message: 'Invalid credentials'
      };
    }

    // Check password
    if (user.password !== password) {
      return {
        success: false,
        message: 'Invalid credentials'
      };
    }

    // Get organization details for subscription check
    const masterConnection = connectionManager.getMasterConnection();
    const { Organization } = models.getMasterModels();
    
    const org = await Organization.findById(process.env.ORG_ID);
    
    // Check if subscription is expired
    const currentDate = new Date();
    const subscriptionEndDate = new Date(org.subscriptionEndDate);
    
    if (currentDate > subscriptionEndDate) {
      return {
        success: false,
        subscriptionExpired: true,
        message: 'Your subscription has expired. Please contact administrator to continue.'
      };
    }

    // Check if subscription is ending soon (30 days)
    const daysUntilExpiry = Math.ceil((subscriptionEndDate - currentDate) / (1000 * 60 * 60 * 24));
    let subscriptionWarning = null;

    if (daysUntilExpiry <= 30) {
      subscriptionWarning = `Your subscription will expire in ${daysUntilExpiry} days. Please contact administrator to renew.`;
    }

    return {
      success: true,
      username: user.username,
      role: user.role,
      subscriptionWarning,
      orgDetails: {
        subscriptionEndDate: org.subscriptionEndDate
      }
    };

  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'An error occurred during login. Please try again.'
    };
  }
});

ipcMain.handle('logout', async () => {
  try {
    // Currently no cleanup needed in main process
    // Frontend zustand store handles state cleanup
    return { 
      success: true,
      message: 'Logged out successfully'
    };
  } catch (error) {
    console.error('Logout error:', error);
    return { 
      success: false, 
      message: 'Error during logout'
    };
  }
});

ipcMain.handle('refresh-data', async () => {
  try {
    const { Space, Category } = models.getOrgModels();

    // Get fresh data
    const spaces = await Space.find().populate('categoryId');
    const categories = await Category.find();

    // Calculate basic stats from actual database states
    const stats = {
      available: spaces.filter(space => space.currentStatus === 'AVAILABLE').length,
      occupied: spaces.filter(space => space.currentStatus === 'OCCUPIED').length,
      maintenance: spaces.filter(space => space.currentStatus === 'MAINTENANCE').length
    };

    return {
      success: true,
      data: {
        spaces,
        categories,
        stats
      }
    };
  } catch (error) {
    console.error('Refresh error:', error);
    return {
      success: false,
      message: 'Failed to refresh data'
    };
  }
});

// Get Room Data (similar to refresh-data but as a separate handler)
ipcMain.handle('get-room-data', async () => {
  try {
    const { Space, Category } = models.getOrgModels();
    
    const spaces = await Space.find().populate('categoryId');
    const categories = await Category.find();

    const stats = {
      available: spaces.filter(space => space.currentStatus === 'AVAILABLE').length,
      occupied: spaces.filter(space => space.currentStatus === 'OCCUPIED').length,
      maintenance: spaces.filter(space => space.currentStatus === 'MAINTENANCE').length
    };

    return {
      success: true,
      data: { spaces, categories, stats }
    };
  } catch (error) {
    console.error('Get room data error:', error);
    return { success: false, message: 'Failed to fetch room data' };
  }
});

// Update Room Status
ipcMain.handle('update-room', async (_, roomData) => {
  try {
    const { Space } = models.getOrgModels();
    
    const updatedRoom = await Space.findByIdAndUpdate(
      roomData._id,
      { 
        currentStatus: roomData.status,
        lastUpdated: new Date()
      },
      { new: true }
    );

    return {
      success: true,
      data: updatedRoom
    };
  } catch (error) {
    console.error('Update room error:', error);
    return { success: false, message: 'Failed to update room' };
  }
});

// Category Operations
ipcMain.handle('get-categories', async () => {
  try {
    const { Category } = models.getOrgModels();
    const categories = await Category.find();
    
    return {
      success: true,
      data: categories
    };
  } catch (error) {
    console.error('Get categories error:', error);
    return { success: false, message: 'Failed to fetch categories' };
  }
});

ipcMain.handle('add-category', async (_, categoryData) => {
  try {
    const { Category } = models.getOrgModels();
    
    // Check if category name already exists
    const exists = await Category.findOne({ categoryName: categoryData.categoryName });
    if (exists) {
      return { success: false, message: 'Category name already exists' };
    }

    const newCategory = await Category.create({
      ...categoryData,
      lastUpdated: new Date()
    });

    return {
      success: true,
      data: newCategory
    };
  } catch (error) {
    console.error('Add category error:', error);
    return { success: false, message: 'Failed to add category' };
  }
});

ipcMain.handle('update-category', async (_, categoryData) => {
  try {
    const { Category } = models.getOrgModels();
    
    const updatedCategory = await Category.findByIdAndUpdate(
      categoryData._id,
      {
        ...categoryData,
        lastUpdated: new Date()
      },
      { new: true }
    );

    return {
      success: true,
      data: updatedCategory
    };
  } catch (error) {
    console.error('Update category error:', error);
    return { success: false, message: 'Failed to update category' };
  }
});

ipcMain.handle('delete-category', async (_, categoryId) => {
  try {
    const { Category, Space } = models.getOrgModels();
    
    // Check if category has spaces
    const hasSpaces = await Space.findOne({ categoryId });
    if (hasSpaces) {
      return { 
        success: false, 
        message: 'Cannot delete category with existing spaces' 
      };
    }

    await Category.findByIdAndDelete(categoryId);

    return { success: true };
  } catch (error) {
    console.error('Delete category error:', error);
    return { success: false, message: 'Failed to delete category' };
  }
});

// Space Operations
ipcMain.handle('add-space', async (_, spaceData) => {
  try {
    const { Space } = models.getOrgModels();
    
    // Check if space name exists in the same category
    const exists = await Space.findOne({ 
      categoryId: spaceData.categoryId,
      spaceName: spaceData.spaceName 
    });
    
    if (exists) {
      return { success: false, message: 'Space name already exists in this category' };
    }

    const newSpace = await Space.create({
      ...spaceData,
      currentStatus: 'AVAILABLE',
      lastUpdated: new Date()
    });

    return {
      success: true,
      data: newSpace
    };
  } catch (error) {
    console.error('Add space error:', error);
    return { success: false, message: 'Failed to add space' };
  }
});

ipcMain.handle('delete-space', async (_, spaceId) => {
  try {
    const { Space } = models.getOrgModels();
    
    // Check if space is occupied
    const space = await Space.findById(spaceId);
    if (space.currentStatus === 'OCCUPIED') {
      return { 
        success: false, 
        message: 'Cannot delete occupied space' 
      };
    }

    await Space.findByIdAndDelete(spaceId);

    return { success: true };
  } catch (error) {
    console.error('Delete space error:', error);
    return { success: false, message: 'Failed to delete space' };
  }
});

ipcMain.handle('get-revenue-stats', async () => {
  try {
    const { Invoice } = models.getOrgModels();
    
    // Get current date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Aggregate revenue for different periods
    const dailyRevenue = await Invoice.aggregate([
      {
        $match: {
          paymentDate: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" }
        }
      }
    ]);

    const weeklyRevenue = await Invoice.aggregate([
      {
        $match: {
          paymentDate: { $gte: weekStart }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" }
        }
      }
    ]);

    const monthlyRevenue = await Invoice.aggregate([
      {
        $match: {
          paymentDate: { $gte: monthStart }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" }
        }
      }
    ]);

    return {
      success: true,
      data: {
        dailyRevenue: dailyRevenue[0]?.total || 0,
        weeklyRevenue: weeklyRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0
      }
    };
  } catch (error) {
    console.error('Revenue stats error:', error);
    return { 
      success: false, 
      message: 'Failed to fetch revenue statistics' 
    };
  }
});

