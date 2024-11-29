import { BrowserWindow } from 'electron';
import { getDB } from './db';

export const AppState = {
  // Initial State
  state: {
    auth: {
      isAuthenticated: false,
      role: null,
    },
    subscription: {
      subscribedDate: null,
      subscribedTill: null,
      orgName: null
    },
    rooms: {
      list: [],
      stats: {
        available: 0,
        occupied: 0,
        maintenance: 0,
        checkoutPending: 0
      },
      filters: {
        search: "",
        status: "all",
        sort: "default"
      }
    },
    categories: [],
    revenueStats: {
      dailyRevenue: 0,
      weeklyRevenue: 0,
      monthlyRevenue: 0
    }
  },

  // Core Properties
  mainWindow: null,
  autoUpdateInterval: null,
  periodicRefreshInterval: null,
  _lastBroadcastedState: null,
  _lastRefreshTimestamp: null,

  // Window Management
  setMainWindow(window) {
    this.mainWindow = window;
  },

  broadcastState() {
    if (!this.mainWindow) return;

    const currentState = JSON.stringify({
      rooms: this.state.rooms,
      categories: this.state.categories,
      auth: this.state.auth,
      subscription: this.state.subscription,
      revenueStats: this.state.revenueStats
    });

    // Only broadcast if state has actually changed
    if (this._lastBroadcastedState !== currentState) {
      this._lastBroadcastedState = currentState;
      this.mainWindow.webContents.send('state-update', this.state);
    }
  },

  // State Management
  resetState() {
    this.state = {
      auth: {
        isAuthenticated: false,
        role: null,
      },
      subscription: {
        subscribedDate: null,
        subscribedTill: null,
        orgName: null
      },
      rooms: {
        list: [],
        stats: {
          available: 0,
          occupied: 0,
          maintenance: 0,
          checkoutPending: 0
        },
        filters: {
          search: "",
          status: "all",
          sort: "default"
        }
      },
      categories: []
    };
  },

  // Authentication Methods
  async login(credentials) {
    try {
      const db = getDB();
      
      const user = await db.collection('auth').findOne({
        email: credentials.email,
        password: credentials.password,
        role: credentials.role
      });

      if (!user) {
        return { success: false, message: 'Invalid credentials' };
      }

      const subscription = await db.collection('subscriptions').findOne({
        orgName: user.orgName
      });

      if (!subscription) {
        return { success: false, message: 'No active subscription found' };
      }

      const subEndDate = new Date(subscription.subscribedTill);
      const today = new Date();

      if (today > subEndDate) {
        return {
          success: false,
          message: 'Subscription expired. Please contact support to renew.'
        };
      }

      this.state.auth.isAuthenticated = true;
      this.state.auth.role = credentials.role;
      this.state.subscription = {
        subscribedDate: subscription.subscribedDate,
        subscribedTill: subscription.subscribedTill,
        orgName: subscription.orgName
      };

      await this.loadInitialData();
      this.startAutoUpdate();
      this.startPeriodicRefresh();
      this.broadcastState();
      
      const daysToExpire = Math.ceil((subEndDate - today) / (1000 * 60 * 60 * 24));
      return {
        success: true,
        warning: daysToExpire <= 30 ? `Subscription expires in ${daysToExpire} days` : null
      };

    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.message };
    }
  },

  logout() {
    this.stopAutoUpdate();
    this.stopPeriodicRefresh();
    this.resetState();
    this.broadcastState();
  },

  // Data Loading Methods
  async loadInitialData() {
    try {
      const db = getDB();
      const categories = await db.collection('Categories').find({}).toArray();
      this.state.categories = categories;

      const rooms = await db.collection('Rooms').find({}).toArray();
      this.state.rooms.list = rooms;
      this.updateRoomStats();
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  },

  async loadRoomData() {
    try {
      const db = getDB();
      const rooms = await db.collection('Rooms').find({}).toArray();
      
      this.state.rooms.list = rooms;
      this.updateRoomStats();
      this.broadcastState();
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  },

  // Room Management Methods
  updateRoomStats() {
    this.state.rooms.stats = {
      available: this.state.rooms.list.filter(r => r.status === 'Available').length,
      occupied: this.state.rooms.list.filter(r => r.status === 'Occupied').length,
      maintenance: this.state.rooms.list.filter(r => r.status === 'Maintenance').length,
      checkoutPending: this.state.rooms.list.filter(r => r.status === 'CheckoutPending').length
    };
  },

  async updateRoom(roomData) {
    try {
      const db = getDB();
      const { name, ...updateData } = roomData;
  
      const existingRoom = await db.collection('Rooms').findOne({ name });
      if (!existingRoom) {
        return { success: false, message: 'Room not found' };
      }
  
      if (existingRoom.status === 'Occupied' && updateData.currentGuest) {
        const updatedFields = {
          "currentGuest": updateData.currentGuest,
          lastUpdated: new Date().toISOString(),
        };
  
        const result = await db.collection('Rooms').updateOne(
          { name },
          { $set: updatedFields }
        );
  
        if (result.modifiedCount > 0) {
          this.state.rooms.list = this.state.rooms.list.map(room =>
            room.name === name ? { ...room, ...updatedFields } : room
          );
  
          this.updateRoomStats();
          this.broadcastState();
          return { success: true };
        }
  
        return { success: false, message: 'No changes made to the room' };
      }
  
      const result = await db.collection('Rooms').updateOne(
        { name },
        { $set: updateData }
      );
  
      if (result.modifiedCount > 0) {
        this.state.rooms.list = this.state.rooms.list.map(room =>
          room.name === name ? { ...room, ...updateData } : room
        );
  
        this.updateRoomStats();
        this.broadcastState();
        return { success: true };
      }
  
      return { success: false, message: 'No changes made to the room' };
    } catch (error) {
      console.error('Error updating room:', error);
      return { success: false, message: error.message };
    }
  },

  // Category Management Methods
  async addCategory(categoryData) {
    try {
      const db = getDB();
      const result = await db.collection('Categories').insertOne({
        ...categoryData,
        type: 'room'
      });

      if (result.insertedId) {
        this.state.categories.push({
          _id: result.insertedId,
          ...categoryData,
          type: 'room'
        });
        this.broadcastState();
        return { success: true };
      }

      return { success: false, message: 'Failed to add category' };
    } catch (error) {
      console.error('Error adding category:', error);
      return { success: false, message: error.message };
    }
  },

  async updateCategory(categoryData) {
    try {
      const db = getDB();
      console.log('Updating category:', categoryData);
  
      const existingCategory = await db.collection('Categories').findOne({ 
        name: categoryData.name 
      });
  
      if (!existingCategory) {
        return { success: false, message: 'Category not found' };
      }
  
      const result = await db.collection('Categories').updateOne(
        { name: categoryData.name },
        { 
          $set: {
            type: categoryData.type,
            lastUpdated: new Date().toISOString()
          } 
        }
      );
  
      if (result.modifiedCount > 0) {
        this.state.categories = this.state.categories.map(cat => 
          cat.name === categoryData.name 
            ? { 
                ...cat,
                type: categoryData.type,
                lastUpdated: new Date().toISOString()
              } 
            : cat
        );
        
        const rooms = await db.collection('Rooms').updateMany(
          { categoryName: categoryData.name },
          { 
            $set: { 
              categoryType: categoryData.type
            } 
          }
        );
        
        this.broadcastState();
        return { success: true };
      }
  
      return { success: false, message: 'No changes made' };
    } catch (error) {
      console.error('Error updating category:', error);
      return { success: false, message: error.message };
    }
  },

  async deleteCategory(categoryName) {
    try {
      const db = getDB();
      
      const hasSpaces = this.state.rooms.list.some(
        room => room.categoryName === categoryName
      );

      if (hasSpaces) {
        return { 
          success: false, 
          message: 'Cannot delete category that contains spaces. Please delete all spaces first.' 
        };
      }

      const result = await db.collection('Categories').deleteOne({ name: categoryName });

      if (result.deletedCount > 0) {
        this.state.categories = this.state.categories.filter(
          cat => cat.name !== categoryName
        );
        
        this.broadcastState();
        return { success: true };
      }

      return { success: false, message: 'Category not found' };
    } catch (error) {
      console.error('Error deleting category:', error);
      return { success: false, message: error.message };
    }
  },

  // Space Management Methods
  async addSpace(spaceData) {
    try {
      const db = getDB();
      const category = this.state.categories.find(c => c.name === spaceData.categoryName);
      
      if (!category) {
        return { success: false, message: 'Category not found' };
      }

      const newSpace = {
        ...spaceData,
        categoryType: category.type,
        status: 'Maintenance',
        currentGuest: null,
        lastUpdated: new Date().toISOString()
      };

      const result = await db.collection('Rooms').insertOne(newSpace);

      if (result.insertedId) {
        this.state.rooms.list.push({
          ...newSpace,
          _id: result.insertedId
        });
        this.updateRoomStats();
        this.broadcastState();
        return { success: true };
      }

      return { success: false, message: 'Failed to add space' };
    } catch (error) {
      console.error('Error adding space:', error);
      return { success: false, message: error.message };
    }
  },

  async deleteSpace(spaceData) {
    try {
      const db = getDB();
      const result = await db.collection('Rooms').deleteOne({ 
        name: spaceData.name,
        categoryName: spaceData.categoryName
      });

      if (result.deletedCount > 0) {
        this.state.rooms.list = this.state.rooms.list.filter(
          room => room.name !== spaceData.name
        );
        
        this.updateRoomStats();
        this.broadcastState();
        return { success: true };
      }

      return { success: false, message: 'Space not found' };
    } catch (error) {
      console.error('Error deleting space:', error);
      return { success: false, message: error.message };
    }
  },

  // Auto Update Methods
  async startAutoUpdate() {
    if (this.autoUpdateInterval) {
      clearInterval(this.autoUpdateInterval);
    }

    const checkAndUpdate = async () => {
      try {
        const now = new Date();
        let needsUpdate = false;

        const updatedRooms = this.state.rooms.list.map(room => {
          if (room.status === 'Occupied' && 
              room.currentGuest?.checkOut && 
              new Date(room.currentGuest.checkOut) < now) {
            needsUpdate = true;
            return { ...room, status: 'CheckoutPending' };
          }
          return room;
        });

        if (needsUpdate) {
          this.state.rooms.list = updatedRooms;
          this.updateRoomStats();

          const db = getDB();
          await Promise.all(
            updatedRooms
              .filter(room => room.status === 'CheckoutPending')
              .map(room => 
                db.collection('Rooms').updateOne(
                  { name: room.name },
                  { $set: { status: 'CheckoutPending' } }
                )
              )
          );

          this.broadcastState();
        }
      } catch (error) {
        console.error('Auto update error:', error);
      }
    };

    await checkAndUpdate();
    this.autoUpdateInterval = setInterval(checkAndUpdate, 30 * 1000);
  },

  stopAutoUpdate() {
    if (this.autoUpdateInterval) {
      clearInterval(this.autoUpdateInterval);
      this.autoUpdateInterval = null;
    }
  },

  // Refresh Methods
  async resetAndRefresh() {
    try {
      const now = Date.now();
      if (this._lastRefreshTimestamp && now - this._lastRefreshTimestamp < 5 * 60 * 1000) {
        console.log('Skipping refresh - too soon since last refresh');
        return { success: true, skipped: true };
      }

      console.log('Performing reset and refresh...');
      
      const oldState = JSON.stringify({
        rooms: this.state.rooms,
        revenueStats: this.state.revenueStats
      });

      await this.loadInitialData();
      const revenueStats = await this.calculateRevenueStats();
      
      if (revenueStats.success) {
        this.state.revenueStats = revenueStats.data;
      }

      const newState = JSON.stringify({
        rooms: this.state.rooms,
        revenueStats: this.state.revenueStats
      });

      if (oldState !== newState) {
        this.broadcastState();
        console.log('State updated and broadcasted');
      } else {
        console.log('No changes detected during refresh');
      }

      this._lastRefreshTimestamp = now;
      return { success: true };
    } catch (error) {
      console.error('Error during reset and refresh:', error);
      return { success: false, message: error.message };
    }
  },

  startPeriodicRefresh() {
    if (this.periodicRefreshInterval) {
      clearInterval(this.periodicRefreshInterval);
    }
  
    console.log('Starting periodic refresh - will refresh every 60 minutes');
    
    // Initial refresh
    this.resetAndRefresh();

    // Set up interval (60 minutes = 60 * 60 * 1000 milliseconds)
    this.periodicRefreshInterval = setInterval(() => {
      console.log('Executing periodic refresh');
      this.resetAndRefresh();
    }, 60 * 60 * 1000);
  },

  stopPeriodicRefresh() {
    if (this.periodicRefreshInterval) {
      clearInterval(this.periodicRefreshInterval);
      this.periodicRefreshInterval = null;
      console.log('Stopped periodic refresh');
    }
  },

  stopAllIntervals() {
    this.stopAutoUpdate();
    this.stopPeriodicRefresh();
  },

  // Revenue Calculations
  async calculateRevenueStats() {
    try {
      const db = getDB();
      const today = new Date();
      const localOffset = today.getTimezoneOffset() * 60000; // Offset in milliseconds

      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfWeek = new Date(startOfDay);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Monday of the current week
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Adjust for local timezone
      startOfDay.setTime(startOfDay.getTime() - localOffset);
      startOfWeek.setTime(startOfWeek.getTime() - localOffset);
      startOfMonth.setTime(startOfMonth.getTime() - localOffset);

      // Query for today
      const dailyRevenue = await db.collection('Bookings').aggregate([
        {
          $match: {
            checkout: {
              $gte: startOfDay,
              $lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
            }
          }
        },
        { $group: { _id: null, total: { $sum: '$total_cost' } } }
      ]).toArray();

      // Query for this week
      const weeklyRevenue = await db.collection('Bookings').aggregate([
        {
          $match: {
            checkout: {
              $gte: startOfWeek,
              $lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
            }
          }
        },
        { $group: { _id: null, total: { $sum: '$total_cost' } } }
      ]).toArray();

      // Query for this month
      const monthlyRevenue = await db.collection('Bookings').aggregate([
        {
          $match: {
            checkout: {
              $gte: startOfMonth,
              $lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
            }
          }
        },
        { $group: { _id: null, total: { $sum: '$total_cost' } } }
      ]).toArray();

      return {
        success: true,
        data: {
          dailyRevenue: dailyRevenue[0]?.total || 0,
          weeklyRevenue: weeklyRevenue[0]?.total || 0,
          monthlyRevenue: monthlyRevenue[0]?.total || 0
        }
      };
    } catch (error) {
      console.error('Error calculating revenue stats:', error);
      return { success: false, message: error.message };
    }
  },

  // Force Refresh
async forceRefresh() {
  try {
    console.log('Performing forced refresh...');
    
    // Load fresh data from DB
    const db = getDB();
    const categories = await db.collection('Categories').find({}).toArray();
    const rooms = await db.collection('Rooms').find({}).toArray();
    const revenueStats = await this.calculateRevenueStats();

    // Update state with fresh data
    this.state.categories = categories;
    this.state.rooms.list = rooms;
    if (revenueStats.success) {
      this.state.revenueStats = revenueStats.data;
    }

    this.updateRoomStats();
    // Force broadcast regardless of changes
    this.mainWindow.webContents.send('state-update', this.state);
    
    console.log('Forced refresh completed');
    return { success: true };
  } catch (error) {
    console.error('Error during forced refresh:', error);
    return { success: false, message: error.message };
  }
},
};