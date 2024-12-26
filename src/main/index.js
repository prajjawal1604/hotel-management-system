// Main process imports
import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import { initializeDatabases } from './database/dbInit';
import connectionManager from './database/connectionManager';
import models from './database/models';
import mongoose from 'mongoose';

// Window creation and initialization
function createWindow() {
  console.log('Creating main application window...');
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
    console.log('Window ready to show');
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Load appropriate URL based on environment
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    console.log('Loading development URL:', process.env['ELECTRON_RENDERER_URL']);
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    console.log('Loading production build');
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

// Application initialization
app.whenReady().then(async () => {
  try {
    console.log('Initializing application...');
    await initializeDatabases();
    console.log('Databases initialized successfully');
    
    electronApp.setAppUserModelId('com.electron');
    
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window);
    });

    createWindow();

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) {
        console.log('No windows found, creating new window');
        createWindow();
      }
    });
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    app.quit();
  }
});

// Clean up on window close
app.on('window-all-closed', async () => {
  console.log('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Basic connection status handler
ipcMain.handle('check-connection-status', async () => {
  console.log('Checking database connection status...');
  const connectionManager = require('./database/connectionManager');
  const status = {
    masterConnected: !!connectionManager.getMasterConnection(),
    orgConnected: !!connectionManager.getOrgConnection()
  };
  console.log('Connection status:', status);
  return status;
});

// Authentication Handlers

/**
 * Login Handler
 * Process:
 * 1. Validate credentials
 * 2. Check user exists
 * 3. Verify organization and subscription
 * 4. Return user data with subscription status
 */
ipcMain.handle('login', async (_, credentials) => {
  try {
    console.log('Login attempt received:', { 
      identifier: credentials.identifier,
      role: credentials.role 
    });

    const { identifier, password, role } = credentials;

    // Validate input
    if (!identifier || !password || !role) {
      console.log('Missing credentials in login attempt');
      return {
        success: false,
        message: 'Missing credentials'
      };
    }

    // Find user in org database
    const { User } = models.getOrgModels();
    const isEmail = identifier.includes('@');
    const query = isEmail ? { email: identifier, role } : { username: identifier, role };
    
    console.log('Looking up user with query:', query);
    const user = await User.findOne(query).lean();

    // Validate user exists and password matches
    if (!user || user.password !== password) {
      console.log('Invalid credentials for login attempt');
      return {
        success: false,
        message: 'Invalid credentials'
      };
    }

    console.log('User found:', { 
      username: user.username, 
      role: user.role 
    });

    // Check organization subscription
    const { Organization } = models.getMasterModels();
    console.log('Checking organization details and subscription');
    const org = await Organization.findOne({ 
      orgName: "Maa Mangala Residency" 
    }).lean();
    
    if (!org) {
      console.error('No organization found in master database');
      return {
        success: false,
        message: 'Organization configuration not found'
      };
    }

    // Validate subscription
    const currentDate = new Date();
    const subscriptionEndDate = new Date(org.subscriptionEndDate);
    
    if (currentDate > subscriptionEndDate) {
      console.log('Subscription expired for organization');
      return {
        success: false,
        subscriptionExpired: true,
        message: 'Your subscription has expired. Please contact administrator to continue.'
      };
    }

    // Calculate subscription warning if needed
    const daysUntilExpiry = Math.ceil((subscriptionEndDate - currentDate) / (1000 * 60 * 60 * 24));
    let subscriptionWarning = null;

    if (daysUntilExpiry <= 30) {
      console.log(`Subscription expiring soon: ${daysUntilExpiry} days remaining`);
      subscriptionWarning = `Your subscription will expire in ${daysUntilExpiry} days. Please contact administrator to renew.`;
    }

    // Return successful login response with proper string IDs
    return {
      success: true,
      username: user.username,
      role: user.role,
      subscriptionWarning,
      data: {
        ...user,
        _id: user._id.toString(),
        orgDetails: {
          ...org,
          _id: org._id.toString(),
          subscriptionEndDate: org.subscriptionEndDate
        }
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

/**
 * Logout Handler
 * Simple handler to manage logout process
 * Currently only returns success status as state cleanup is handled on frontend
 */
ipcMain.handle('logout', async () => {
  try {
    console.log('Processing logout request');
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

// Category CRUD Operations

/**
 * Get Categories Handler
 * Retrieves all categories with proper ID string conversion
 */
ipcMain.handle('get-categories', async () => {
  try {
    console.log('Fetching all categories');
    const { Category } = models.getOrgModels();
    const categories = await Category.find().lean();
    
    console.log(`Retrieved ${categories.length} categories`);
    console.log('Categories data:', JSON.stringify(categories, null, 2));

    return {
      success: true,
      data: categories.map(category => ({
        ...category,
        _id: category._id.toString()
      }))
    };
  } catch (error) {
    console.error('Get categories error:', error);
    return { success: false, message: 'Failed to fetch categories' };
  }
});

/**
 * Add Category Handler
 * Process:
 * 1. Check for duplicate names
 * 2. Create new category
 * 3. Return updated list of all categories
 */
ipcMain.handle('add-category', async (_, categoryData) => {
  try {
    console.log('Adding new category:', JSON.stringify(categoryData, null, 2));
    const { Category } = models.getOrgModels();
    
    // Check for existing category with same name
    const existingCategory = await Category.findOne({ 
      categoryName: categoryData.categoryName 
    }).lean();

    if (existingCategory) {
      console.log('Category name already exists:', categoryData.categoryName);
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
    console.log('New category created:', JSON.stringify(newCategory.toObject(), null, 2));

    // Fetch all updated categories
    const allCategories = await Category.find().lean();
    console.log(`Total categories after addition: ${allCategories.length}`);

    return {
      success: true,
      data: {
        ...newCategory.toObject(),
        _id: newCategory._id.toString()
      },
      categories: allCategories.map(category => ({
        ...category,
        _id: category._id.toString()
      }))
    };

  } catch (error) {
    console.error('Add category error:', error);
    return { success: false, message: 'Failed to add category' };
  }
});

/**
 * Update Category Handler
 * Updates category details and returns the updated data
 */
ipcMain.handle('update-category', async (_, categoryData) => {
  try {
    console.log('Updating category:', JSON.stringify(categoryData, null, 2));
    const { Category } = models.getOrgModels();
    
    const updatedCategory = await Category.findByIdAndUpdate(
      categoryData._id,
      {
        ...categoryData,
        lastUpdated: new Date()
      },
      { new: true }
    ).lean();

    console.log('Category updated successfully:', JSON.stringify(updatedCategory, null, 2));

    return {
      success: true,
      data: {
        ...updatedCategory,
        _id: updatedCategory._id.toString()
      }
    };
  } catch (error) {
    console.error('Update category error:', error);
    return { success: false, message: 'Failed to update category' };
  }
});

/**
 * Delete Category Handler
 */
ipcMain.handle('delete-category', async (_, categoryId) => {
  try {
    console.log('Attempting to delete category:', categoryId);
    const { Category, Space } = models.getOrgModels();
    
    // Check for existing spaces in this category
    const hasSpaces = await Space.findOne({ categoryId }).lean();
    if (hasSpaces) {
      console.log('Cannot delete: category has existing spaces');
      return { 
        success: false, 
        message: 'Cannot delete category with existing spaces',
        hasSpaces: true
      };
    }

    // Proceed with deletion
    await Category.findByIdAndDelete(categoryId);
    console.log('Category deleted successfully');

    // Fetch updated categories list
    const updatedCategories = await Category.find().lean();
    
    return { 
      success: true,
      message: 'Category deleted successfully',
      categories: updatedCategories.map(cat => ({
        ...cat,
        _id: cat._id.toString()
      }))
    };
  } catch (error) {
    console.error('Delete category error:', error);
    return { 
      success: false, 
      message: 'Failed to delete category',
      error: error.message 
    };
  }
});

// Space CRUD Operations

/**
 * Get Room Data Handler
 * Retrieves all spaces with their categories and calculates stats
 */
ipcMain.handle('get-room-data', async () => {
  try {
    const { Space, Category } = models.getOrgModels();
    console.log('Starting to fetch room data...');
    
    if (!Space || !Category) {
      throw new Error('Models not properly initialized');
    }
    
    // Fetch spaces with populated category data
    const spacesDoc = await Space.find()
      .populate({
        path: 'categoryId',
        model: 'categories'
      })
      .lean();
    
    console.log(`Found ${spacesDoc.length} spaces`);

    // Fetch categories
    const categoriesDoc = await Category.find().lean();
    console.log(`Found ${categoriesDoc.length} categories`);

    // Calculate room statistics
    const stats = {
      available: spacesDoc.filter(space => space.currentStatus === 'AVAILABLE').length,
      occupied: spacesDoc.filter(space => space.currentStatus === 'OCCUPIED').length,
      maintenance: spacesDoc.filter(space => space.currentStatus === 'MAINTENANCE').length
    };

    console.log('Room Statistics:', stats);

    // Ensure we're returning an object with success and data properties
    return {
      success: true,
      data: { 
        spaces: spacesDoc.map(space => ({
          ...space,
          _id: space._id.toString(),
          categoryId: {
            ...space.categoryId,
            _id: space.categoryId._id.toString()
          }
        })) || [],
        categories: categoriesDoc.map(category => ({
          ...category,
          _id: category._id.toString()
        })) || [],
        stats
      }
    };
  } catch (error) {
    console.error('Get room data error:', error);
    return { 
      success: false, 
      message: 'Failed to fetch room data',
      data: {
        spaces: [],
        categories: [],
        stats: {
          available: 0,
          occupied: 0,
          maintenance: 0
        }
      }
    };
  }
});

/**
 * Add Space Handler
 * Process:
 * 1. Validate input data
 * 2. Convert types and IDs
 * 3. Create space
 * 4. Return updated space list
 */
ipcMain.handle('add-space', async (_, spaceData) => {
  try {
    console.log('Add Space - Received data:', JSON.stringify(spaceData, null, 2));

    const { Space, Category } = models.getOrgModels();
    if (!Space || !Category) {
      throw new Error('Models not properly initialized');
    }

    // Validate all required fields
    const requiredFields = ['spaceName', 'spaceType', 'categoryId', 'basePrice', 'maxOccupancy'];
    for (const field of requiredFields) {
      if (!spaceData[field]) {
        throw new Error(`${field} is required`);
      }
    }

    // Create processed space data
    const processedData = {
      spaceName: spaceData.spaceName.trim(),
      spaceType: spaceData.spaceType,
      categoryId: new mongoose.Types.ObjectId(spaceData.categoryId),
      basePrice: Number(spaceData.basePrice),
      maxOccupancy: {
        adults: Number(spaceData.maxOccupancy.adults),
        kids: Number(spaceData.maxOccupancy.kids)
      },
      currentStatus: 'AVAILABLE',
      lastUpdated: new Date()
    };

    console.log('Add Space - Processed data:', JSON.stringify(processedData, null, 2));

    // Create new space
    const newSpace = await Space.create(processedData);
    console.log('Add Space - Created new space:', JSON.stringify(newSpace.toObject(), null, 2));

    // Fetch all spaces
    const spaces = await Space.find().lean();
    
    // Manually populate category data
    const populatedSpaces = await Promise.all(spaces.map(async (space) => {
      const category = await Category.findById(space.categoryId).lean();
      return {
        ...space,
        _id: space._id.toString(),
        categoryId: category ? {
          ...category,
          _id: category._id.toString()
        } : space.categoryId.toString()
      };
    }));

    console.log('Add Space - Total spaces after addition:', populatedSpaces.length);

    return {
      success: true,
      data: {
        ...newSpace.toObject(),
        _id: newSpace._id.toString(),
        categoryId: newSpace.categoryId.toString()
      },
      spaces: populatedSpaces
    };

  } catch (error) {
    console.error('Add Space - Error:', error);
    return {
      success: false,
      message: error.message || 'Failed to add space',
      error: error.toString()
    };
  }
});

/**
 * Update Space Handler
 * Process:
 * 1. Check for name conflicts
 * 2. Update space
 * 3. Return updated space list
 */
ipcMain.handle('update-space', async (_, spaceData) => {
  try {
    console.log('Updating space with data:', JSON.stringify(spaceData, null, 2));
    const { Space } = models.getOrgModels();
    
    // Check for name conflicts
    if (spaceData.spaceName) {
      const exists = await Space.findOne({ 
        categoryId: spaceData.categoryId,
        spaceName: spaceData.spaceName,
        _id: { $ne: spaceData._id }
      }).lean();
      
      if (exists) {
        console.log('Space name conflict found in category:', spaceData.categoryId);
        return { success: false, message: 'Space name already exists in this category' };
      }
    }

    // Update space
    const updatedSpace = await Space.findByIdAndUpdate(
      spaceData._id,
      {
        ...spaceData,
        lastUpdated: new Date()
      },
      { new: true }
    )
    .populate('categoryId')
    .lean();

    console.log('Space updated:', JSON.stringify(updatedSpace, null, 2));

    // Fetch updated space list
    const allSpaces = await Space.find()
      .populate('categoryId')
      .lean();

    console.log(`Total spaces after update: ${allSpaces.length}`);

    return {
      success: true,
      data: {
        ...updatedSpace,
        _id: updatedSpace._id.toString(),
        categoryId: {
          ...updatedSpace.categoryId,
          _id: updatedSpace.categoryId._id.toString()
        }
      },
      spaces: allSpaces.map(space => ({
        ...space,
        _id: space._id.toString(),
        categoryId: {
          ...space.categoryId,
          _id: space.categoryId._id.toString()
        }
      }))
    };
  } catch (error) {
    console.error('Update space error:', error);
    return { success: false, message: 'Failed to update space' };
  }
});

/**
 * Delete Space Handler
 * Process:
 * 1. Check if space is in deletable state
 * 2. Delete if in deletable state
 * 3. Return updated space list and stats
 */
ipcMain.handle('delete-space', async (_, spaceId) => {
  try {
    console.log('Attempting to delete space:', spaceId);
    const { Space } = models.getOrgModels();
    
    // Check if space exists and get its state
    const space = await Space.findById(spaceId).lean();
    if (!space) {
      return { 
        success: false, 
        message: 'Space not found' 
      };
    }

    if (!['AVAILABLE', 'MAINTENANCE'].includes(space.currentStatus)) {
      console.log('Cannot delete: space is not in deletable state');
      return { 
        success: false, 
        message: 'Can only delete available or maintenance spaces' 
      };
    }

    // Proceed with deletion
    await Space.findByIdAndDelete(spaceId);
    console.log('Space deleted successfully');

    // Get updated spaces
    const updatedSpaces = await Space.find()
      .populate({
        path: 'categoryId',
        model: 'categories'
      })
      .lean();

    // Calculate stats
    const stats = {
      available: updatedSpaces.filter(s => s.currentStatus === 'AVAILABLE').length,
      occupied: updatedSpaces.filter(s => s.currentStatus === 'OCCUPIED').length,
      maintenance: updatedSpaces.filter(s => s.currentStatus === 'MAINTENANCE').length
    };

    return { 
      success: true,
      message: 'Space deleted successfully',
      spaces: updatedSpaces.map(space => ({
        ...space,
        _id: space._id.toString(),
        categoryId: {
          ...space.categoryId,
          _id: space.categoryId._id.toString()
        }
      })),
      stats
    };
  } catch (error) {
    console.error('Delete space error:', error);
    return { 
      success: false, 
      message: 'Failed to delete space',
      error: error.message 
    };
  }
});

// Organization Operations and Revenue Statistics

/**
 * Get Organization Details Handler
 * Retrieves organization information from master database
 */
ipcMain.handle('get-org-details', async () => {
  try {
    console.log('Fetching organization details');
    const { Organization } = models.getMasterModels();
    const org = await Organization.findOne({ 
      orgName: "Maa Mangala Residency" 
    }).lean();

    if (!org) {
      console.log('Organization not found in database');
      return { 
        success: false, 
        message: 'Organization not found' 
      };
    }

    console.log('Organization details retrieved:', {
      orgName: org.orgName,
      email: org.email,
      gstNumber: org.gstNumber
    });

    return {
      success: true,
      data: {
        ...org,
        _id: org._id.toString(),
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

/**
 * Update Organization Details Handler
 * Updates organization information in master database
 */
ipcMain.handle('update-org-details', async (_, details) => {
  try {
    console.log('Update Org - Received details:', JSON.stringify(details, null, 2));
    const { Organization } = models.getMasterModels();
    
    // Validate input
    if (!details.orgName?.trim()) {
      throw new Error('Organization name is required');
    }
    if (!details.email?.trim()) {
      throw new Error('Email is required');
    }
    if (!details.gstNumber?.trim()) {
      throw new Error('GST number is required');
    }

    // Process GST value
    const gstValue = Number(details.gst);
    if (isNaN(gstValue) || gstValue < 0 || gstValue > 100) {
      throw new Error('GST percentage must be between 0 and 100');
    }

    // Prepare update data
    const updateData = {
      ...details,
      gst: gstValue,  // Store as number
      lastUpdated: new Date()
    };

    console.log('Update Org - Processed data:', updateData);

    const updatedOrg = await Organization.findOneAndUpdate(
      { orgName: "Maa Mangala Residency" },  
      updateData,
      { new: true }
    ).lean();

    if (!updatedOrg) {
      throw new Error('Organization not found');
    }

    console.log('Update Org - Success:', {
      orgName: updatedOrg.orgName,
      email: updatedOrg.email,
      gstNumber: updatedOrg.gstNumber,
      gst: updatedOrg.gst
    });

    return {
      success: true,
      data: {
        ...updatedOrg,
        _id: updatedOrg._id.toString(),
        gst: updatedOrg.gst  // Will be returned as number
      }
    };
  } catch (error) {
    console.error('Update Org - Error:', error);
    return { 
      success: false, 
      message: error.message || 'Failed to update organization details' 
    };
  }
});

/**
 * Get Revenue Statistics Handler
 * Calculates daily, weekly, and monthly revenue statistics
 */
ipcMain.handle('get-revenue-stats', async () => {
  try {
    console.log('Calculating revenue statistics');
    const { Invoice } = models.getOrgModels();
    
    // Set up date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);
    
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    console.log('Date ranges for revenue calculation:', {
      today: today.toISOString(),
      weekStart: weekStart.toISOString(),
      monthStart: monthStart.toISOString()
    });

    // Calculate daily revenue
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

    // Calculate weekly revenue
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

    // Calculate monthly revenue
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

    const revenueStats = {
      dailyRevenue: dailyRevenue[0]?.total || 0,
      weeklyRevenue: weeklyRevenue[0]?.total || 0,
      monthlyRevenue: monthlyRevenue[0]?.total || 0
    };

    console.log('Revenue statistics calculated:', revenueStats);

    return {
      success: true,
      data: revenueStats
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