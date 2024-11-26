// main/database/appState.js

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

  startPeriodicRefresh() {
    if (this.periodicRefreshInterval) {
      clearInterval(this.periodicRefreshInterval);
    }
  
    // Log when refresh happens
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

  // Window Management
  setMainWindow(window) {
    this.mainWindow = window;
  },

  broadcastState() {
    if (this.mainWindow) {
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
      this.startPeriodicRefresh(); // Add this line
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
    this.stopPeriodicRefresh(); // Add this line
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
  
      // Fetch the existing room for context
      const existingRoom = await db.collection('Rooms').findOne({ name });
  
      if (!existingRoom) {
        return { success: false, message: 'Room not found' };
      }
  
      // Handle room updates based on its current status
      if (existingRoom.status === 'Occupied' && updateData.currentGuest) {
        // Update current guest details for an occupied room
        const updatedFields = {
          "currentGuest.name": updateData.currentGuest.name,
          "currentGuest.phone_no": updateData.currentGuest.phone_no,
          "currentGuest.gender": updateData.currentGuest.gender,
          "currentGuest.aadhar": updateData.currentGuest.aadhar,
          "currentGuest.age": updateData.currentGuest.age,
          "currentGuest.permanent_address": updateData.currentGuest.permanent_address,
          "currentGuest.company_name": updateData.currentGuest.company_name,
          "currentGuest.nationality": updateData.currentGuest.nationality,
          "currentGuest.designation": updateData.currentGuest.designation,
          "currentGuest.purpose_of_visit": updateData.currentGuest.purpose_of_visit,
          "currentGuest.dependants": updateData.currentGuest.dependants,
          "currentGuest.GSTIN": updateData.currentGuest.GSTIN,
          "currentGuest.services": updateData.currentGuest.services,
          "currentGuest.total_cost": updateData.currentGuest.total_cost,
          "currentGuest.method_of_payment": updateData.currentGuest.method_of_payment,
          "currentGuest.checkin": updateData.currentGuest.checkin,
          "currentGuest.checkout": updateData.currentGuest.checkout,
          lastUpdated: new Date().toISOString(),
        };
  
        const result = await db.collection('Rooms').updateOne(
          { name },
          { $set: updatedFields }
        );
  
        if (result.modifiedCount > 0) {
          // Update local state
          this.state.rooms.list = this.state.rooms.list.map(room =>
            room.name === name ? { ...room, ...updatedFields } : room
          );
  
          this.updateRoomStats();
          this.broadcastState();
          return { success: true };
        }
  
        return { success: false, message: 'No changes made to the room' };
      }
  
      // For vacant or non-occupied rooms, update the general room data
      const result = await db.collection('Rooms').updateOne(
        { name }, // Filter by room name
        { $set: updateData } // Update the room data
      );
  
      if (result.modifiedCount > 0) {
        // Update local state
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
  }
  ,
  

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

  // Refresh Method
  async resetAndRefresh() {
    try {
      console.log('Performing hard reset and refresh...');
      await this.loadInitialData();
  
      const revenueStats = await this.calculateRevenueStats();
      if (revenueStats.success) {
        this.state.revenueStats = revenueStats.data;
        console.log('Updated revenue stats in state:', this.state.revenueStats);
      } else {
        console.error('Failed to calculate revenue stats:', revenueStats.message);
      }
  
      this.broadcastState();
      console.log('State broadcasted:', this.state);
      return { success: true };
    } catch (error) {
      console.error('Error during hard reset and refresh:', error);
      return { success: false, message: error.message };
    }
  }
  ,
  
  // Add this at the end of AppState object
  stopAllIntervals() {
    this.stopAutoUpdate();
    this.stopPeriodicRefresh();
  },
  // main/database/appState.js
  async updateCategory(categoryData) {
    try {
      const db = getDB();
      console.log('Updating category:', categoryData);
  
      // First find the existing category
      const existingCategory = await db.collection('Categories').findOne({ 
        name: categoryData.name 
      });
  
      if (!existingCategory) {
        return { success: false, message: 'Category not found' };
      }
  
      const result = await db.collection('Categories').updateOne(
        { name: categoryData.name }, // Using name as identifier instead of _id
        { 
          $set: {
            type: categoryData.type,
            lastUpdated: new Date().toISOString()
          } 
        }
      );
  
      console.log('Update result:', result);
  
      if (result.modifiedCount > 0) {
        // Update local state
        this.state.categories = this.state.categories.map(cat => 
          cat.name === categoryData.name 
            ? { 
                ...cat,
                type: categoryData.type,
                lastUpdated: new Date().toISOString()
              } 
            : cat
        );
        
        // Update any rooms that use this category
        const rooms = await db.collection('Rooms').updateMany(
          { categoryName: categoryData.name },
          { 
            $set: { 
              categoryType: categoryData.type
            } 
          }
        );
  
        console.log('Updated associated rooms:', rooms);
        
        this.broadcastState();
        return { success: true };
      }
  
      return { success: false, message: 'No changes made' };
    } catch (error) {
      console.error('Error updating category:', error);
      return { success: false, message: error.message };
    }
  },

// Add this method in AppState
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

    console.log('Adjusted times for local timezone:', { startOfDay, startOfWeek, startOfMonth });

    // Query for today
    const dailyRevenue = await db.collection('Bookings').aggregate([
      {
        $match: {
          checkout: {
            $gte: startOfDay,
            $lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000) // End of the day
          }
        }
      },
      { $group: { _id: null, total: { $sum: '$total_cost' } } } // Corrected field name
    ]).toArray();

    console.log('Daily revenue result:', dailyRevenue);

    // Query for this week
    const weeklyRevenue = await db.collection('Bookings').aggregate([
      {
        $match: {
          checkout: {
            $gte: startOfWeek,
            $lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000) // End of the day
          }
        }
      },
      { $group: { _id: null, total: { $sum: '$total_cost' } } } // Corrected field name
    ]).toArray();

    console.log('Weekly revenue result:', weeklyRevenue);

    // Query for this month
    const monthlyRevenue = await db.collection('Bookings').aggregate([
      {
        $match: {
          checkout: {
            $gte: startOfMonth,
            $lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000) // End of the day
          }
        }
      },
      { $group: { _id: null, total: { $sum: '$total_cost' } } } // Corrected field name
    ]).toArray();

    console.log('Monthly revenue result:', monthlyRevenue);

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
}

};