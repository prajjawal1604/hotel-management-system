import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import { initializeDatabases } from './database/dbInit';
import connectionManager from './database/connectionManager';
import models from './database/models';

import mongoose from 'mongoose';

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
    console.log('Received credentials:', credentials);
    const { identifier, password, role } = credentials;

    // Validate credentials
    if (!identifier || !password || !role) {
      return {
        success: false,
        message: 'Missing credentials'
      };
    }

    const isEmail = identifier.includes('@');

    // First validate user
    const { User } = models.getOrgModels();
    const query = isEmail 
      ? { email: identifier, role } 
      : { username: identifier, role };
    
    const user = await User.findOne(query);

    if (!user || user.password !== password) {
      return {
        success: false,
        message: 'Invalid credentials'
      };
    }

    // Then check organization subscription
    const { Organization } = models.getMasterModels();
    
    // Find organization (without using ID since we only have one)
    const org = await Organization.findOne();
    
    if (!org) {
      console.error('No organization found in master database');
      return {
        success: false,
        message: 'Organization configuration not found'
      };
    }

    console.log('Found organization:', org); // Debug log

    // Check subscription
    const currentDate = new Date();
    const subscriptionEndDate = new Date(org.subscriptionEndDate);
    
    if (currentDate > subscriptionEndDate) {
      return {
        success: false,
        subscriptionExpired: true,
        message: 'Your subscription has expired. Please contact administrator to continue.'
      };
    }

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

ipcMain.handle('get-room-data', async () => {
  try {
    const { Space, Category } = models.getOrgModels();
    
    if (!Space || !Category) {
      throw new Error('Models not properly initialized');
    }

    console.log('Starting to fetch room data...');
    
    // Fetch spaces with populated category data
    const spacesDoc = await Space.find().populate({
      path: 'categoryId',
      model: 'categories'
    }).lean(); // Use lean() for better performance
    
    console.log(`Found ${spacesDoc.length} spaces`);
    console.log(spacesDoc);

    // Fetch categories
    const categoriesDoc = await Category.find().lean();
    console.log(`Found ${categoriesDoc.length} categories`);
    console.log(categoriesDoc);

    // Calculate stats
    const stats = {
      available: spacesDoc.filter(space => space.currentStatus === 'AVAILABLE').length,
      occupied: spacesDoc.filter(space => space.currentStatus === 'OCCUPIED').length,
      maintenance: spacesDoc.filter(space => space.currentStatus === 'MAINTENANCE').length
    };

    console.log('Room Statistics:', {
      total: spacesDoc.length,
      ...stats
    });

    // Log first space as sample (if exists)
    if (spacesDoc.length > 0) {
      console.log('Sample space data:', {
        space: spacesDoc,
        status: spacesDoc[0].currentStatus
      });
    }

    return {
      success: true,
      data: { 
        spaces: spacesDoc,      // lean() already returns plain objects
        categories: categoriesDoc,
        stats
      }
    };
  } catch (error) {
    console.error('Get room data error:', error);
    return { 
      success: false, 
      message: 'Failed to fetch room data',
      error: error.message,
      // Include error details for debugging
      errorDetails: {
        name: error.name,
        stack: error.stack
      }
    };
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
    const existingCategory = await Category.findOne({ 
      categoryName: categoryData.categoryName 
    }).lean();

    if (existingCategory) {
      return { 
        success: false, 
        message: 'Category with this name already exists' 
      };
    }

    // Create new category
    const newCategory = await Category.create({
      ...categoryData,
      lastUpdated: new Date()
    });
    const plainCategory = {
      _id: newCategory._id.toString(),
      categoryName: newCategory.categoryName,
      lastUpdated: newCategory.lastUpdated
    };

    const allCategories = await Category.find().lean();


    return {
      success: true,
      data: plainCategory,
      categories: allCategories  
    };

  } catch (error) {
    console.error('Add category error:', error);
    return { 
      success: false, 
      message: 'Failed to add category' 
    };
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
      console.log('Received spaceData:', JSON.stringify(spaceData, null, 2));

      const { Space } = models.getOrgModels();

      // Validate `categoryId`
      if (!spaceData.categoryId) {
          throw new Error('categoryId is required');
      }

      // Convert `categoryId` to ObjectId if it's not already a string
      if (!mongoose.Types.ObjectId.isValid(spaceData.categoryId)) {
          throw new Error('Invalid categoryId');
      }

      spaceData.categoryId = new mongoose.Types.ObjectId(spaceData.categoryId);

      // Ensure numerical fields are properly typed
      spaceData.basePrice = Number(spaceData.basePrice);
      spaceData.maxOccupancy = {
          adults: Number(spaceData.maxOccupancy.adults),
          kids: Number(spaceData.maxOccupancy.kids),
      };

      console.log('Final spaceData after conversions:', JSON.stringify(spaceData, null, 2));

      // Create the new space
      const newSpace = await Space.create(spaceData);

      console.log('Created newSpace:', JSON.stringify(newSpace.toObject(), null, 2));

      // Fetch all spaces with populated categoryId
      const allSpaces = await Space.find().populate('categoryId').lean();

      // Convert `_id` fields to strings
      const allSpacesConverted = allSpaces.map((space) => ({
          ...space,
          _id: space._id.toString(),
          categoryId: space.categoryId
              ? {
                    ...space.categoryId,
                    _id: space.categoryId._id.toString(),
                }
              : null,
      }));

      console.log('Converted allSpaces:', JSON.stringify(allSpacesConverted, null, 2));

      return {
          success: true,
          data: newSpace.toObject(),
          spaces: allSpacesConverted,
      };
  } catch (error) {
      console.error('Add space error:', error);

      return {
          success: false,
          message: 'Failed to add space',
          error: error.message,
      };
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

ipcMain.handle('update-space', async (_, spaceData) => {
  try {
    const { Space } = models.getOrgModels();
    
    // Check if new name conflicts with existing space in same category
    if (spaceData.spaceName) {
      const exists = await Space.findOne({ 
        categoryId: spaceData.categoryId,
        spaceName: spaceData.spaceName,
        _id: { $ne: spaceData._id } // Exclude current space
      }).lean();
      
      if (exists) {
        return { success: false, message: 'Space name already exists in this category' };
      }
    }

    const updatedSpace = await Space.findByIdAndUpdate(
      spaceData._id,
      {
        ...spaceData,
        lastUpdated: new Date()
      },
      { new: true }
    ).populate('categoryId');

    // Get all updated spaces
    const allSpaces = await Space.find()
      .populate('categoryId')
      .lean();

    return {
      success: true,
      data: updatedSpace,
      spaces: allSpaces
    };
  } catch (error) {
    console.error('Update space error:', error);
    return { success: false, message: 'Failed to update space' };
  }
});

ipcMain.handle('get-revenue-stats', async () => {
  try {
    const { Invoice } = models.getOrgModels();
    
    // Get date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);
    
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Aggregate daily revenue
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

    // Aggregate weekly revenue
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

    // Aggregate monthly revenue
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
      message: 'Failed to fetch revenue statistics',
      data: {
        dailyRevenue: 0,
        weeklyRevenue: 0,
        monthlyRevenue: 0
      }
    };
  }
});

ipcMain.handle('get-org-details', async () => {
  try {
    const { Organization } = models.getMasterModels();
    const org = await Organization.findOne({ orgName: "Maa Mangala Residency" });

    if (!org) {
      return { 
        success: false, 
        message: 'Organization not found' 
      };
    }

    return {
      success: true,
      data: {
        orgName: org.orgName,
        email: org.email,
        gstNumber: org.gstNumber,
        gst: org.gst
      }
    };
  } catch (error) {
    console.error('Get org details error:', error);
    return { 
      success: false, 
      message: 'Failed to fetch organization details' 
    };
  }
});

ipcMain.handle('update-org-details', async (_, details) => {
  try {
    const { Organization } = models.getMasterModels();
    const updatedOrg = await Organization.findOneAndUpdate(
      { orgName: "Maa Mangala Residency" },  
      { 
        ...details,
        lastUpdated: new Date() 
      },
      { new: true }
    );

    return {
      success: true,
      data: {
        orgName: updatedOrg.orgName,
        email: updatedOrg.email,
        gstNumber: updatedOrg.gstNumber,
        gst: updatedOrg.gst
      }
    };
  } catch (error) {
    console.error('Update org details error:', error);
    return { 
      success: false, 
      message: 'Failed to update organization details' 
    };
  }
});

