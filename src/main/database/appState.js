import { BrowserWindow } from 'electron';
import { getDB } from './db';

// Utility functions for checkout calculations
const CHECKOUT_CONSTANTS = {
  CHECKIN_HOUR: 8, // 8 AM
  GST_PERCENTAGE: 18,
  HOURLY_RATE_FACTOR: 0.5  // 50% of daily rate for extra hours
};

const calculateHoursDifference = (startDate, endDate) => {
  return Math.abs(endDate - startDate) / (60 * 60 * 1000);
};

const calculateDaysAndExtraHours = (checkin, checkout) => {
  const checkinDate = new Date(checkin);
  const checkoutDate = new Date(checkout);

  // Set reference points to 8 AM
  const startDay = new Date(checkinDate);
  startDay.setHours(CHECKOUT_CONSTANTS.CHECKIN_HOUR, 0, 0, 0);

  const endDay = new Date(checkoutDate);
  endDay.setHours(CHECKOUT_CONSTANTS.CHECKIN_HOUR, 0, 0, 0);

  // Calculate full days
  const fullDays = Math.floor((endDay - startDay) / (24 * 60 * 60 * 1000));

  // Calculate extra hours after 8 AM
  let extraHours = 0;
  if (checkoutDate.getHours() > CHECKOUT_CONSTANTS.CHECKIN_HOUR) {
    extraHours = checkoutDate.getHours() - CHECKOUT_CONSTANTS.CHECKIN_HOUR;
    extraHours += checkoutDate.getMinutes() / 60;
  }

  return { fullDays, extraHours };
};

const calculateServiceCharges = (services = []) => {
  return services.reduce((total, service) => total + (service.cost * service.units), 0);
};

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
  // Window Management Methods
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

    if (this._lastBroadcastedState !== currentState) {
      this._lastBroadcastedState = currentState;
      this.mainWindow.webContents.send('state-update', this.state);
    }
  },

  // State Management Methods
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
      categories: [],
      revenueStats: {
        dailyRevenue: 0,
        weeklyRevenue: 0,
        monthlyRevenue: 0
      }
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

  // New Checkout Methods
  async calculateCheckoutCost(roomName) {
    try {
      const room = this.state.rooms.list.find(r => r.name === roomName);
      if (!room || !room.currentGuest) {
        throw new Error('Room or guest not found');
      }

      // Extract dates and handle MongoDB date format
      const checkin = new Date(room.currentGuest.checkin.$date || room.currentGuest.checkin);
      const checkout = new Date(room.currentGuest.checkout.$date || room.currentGuest.checkout);

      // Calculate days and extra hours based on 8 AM rule
      const { fullDays, extraHours } = calculateDaysAndExtraHours(checkin, checkout);

      // Calculate base room charges
      const roomCharges = fullDays * room.basePricePerNight;

      // Calculate MICE charges (50% of daily rate for extra hours)
      const hourlyRate = (room.basePricePerNight * CHECKOUT_CONSTANTS.HOURLY_RATE_FACTOR) / 24;
      const miceCharges = extraHours * hourlyRate;

      // Calculate service charges
      const serviceCharges = calculateServiceCharges(room.currentGuest.services);

      // Calculate GST (only on room charges and MICE charges, not on services)
      const gstableAmount = roomCharges + miceCharges;
      const gstAmount = (gstableAmount * room.gstPercentage) / 100;

      // Calculate total
      const totalCost = roomCharges + miceCharges + serviceCharges + gstAmount;

      return {
        success: true,
        data: {
          roomCharges,
          miceCharges,
          serviceCharges,
          gstAmount,
          totalCost,
          breakdown: {
            fullDays,
            extraHours,
            baseRate: room.basePricePerNight,
            gstPercentage: room.gstPercentage,
            gstableAmount,
            servicesBreakdown: room.currentGuest.services
          },
          checkin,
          checkout,
          guestDetails: room.currentGuest,
          roomDetails: {
            name: room.name,
            type: room.type,
            category: room.categoryName
          }
        }
      };
    } catch (error) {
      console.error('Error calculating checkout cost:', error);
      return { success: false, message: error.message };
    }
  },

  async checkoutRoom(roomName) {
    try {
      const db = getDB();
      const room = this.state.rooms.list.find(r => r.name === roomName);
      
      if (!room || !room.currentGuest) {
        throw new Error('Room or guest not found');
      }

      // Calculate final costs
      const costCalculation = await this.calculateCheckoutCost(roomName);
      if (!costCalculation.success) {
        throw new Error(costCalculation.message);
      }

      // Create booking record with detailed breakdown
      const bookingData = {
        guestDetails: {
          ...room.currentGuest,
          dependants: room.currentGuest.dependants || []
        },
        roomDetails: {
          name: room.name,
          category: room.categoryName,
          type: room.type,
          baseRate: room.basePricePerNight
        },
        stayDetails: {
          checkin: room.currentGuest.checkin,
          checkout: room.currentGuest.checkout,
          fullDays: costCalculation.data.breakdown.fullDays,
          extraHours: costCalculation.data.breakdown.extraHours
        },
        charges: {
          roomCharges: costCalculation.data.roomCharges,
          miceCharges: costCalculation.data.miceCharges,
          serviceCharges: costCalculation.data.serviceCharges,
          gstAmount: costCalculation.data.gstAmount,
          totalCost: costCalculation.data.totalCost
        },
        services: room.currentGuest.services || [],
        status: 'COMPLETED',
        checkoutTimestamp: new Date().toISOString()
      };

      // Insert into Bookings collection
      const bookingResult = await db.collection('Bookings').insertOne(bookingData);
      
      if (!bookingResult.insertedId) {
        throw new Error('Failed to save booking record');
      }

      // Update room status
      const updateResult = await db.collection('Rooms').updateOne(
        { name: roomName },
        {
          $set: {
            status: 'Available',
            currentGuest: null,
            lastUpdated: new Date().toISOString()
          }
        }
      );

      if (updateResult.modifiedCount === 0) {
        throw new Error('Failed to update room status');
      }

      // Update local state
      this.state.rooms.list = this.state.rooms.list.map(r => 
        r.name === roomName 
          ? {
              ...r,
              status: 'Available',
              currentGuest: null,
              lastUpdated: new Date().toISOString()
            }
          : r
      );

      this.updateRoomStats();
      this.broadcastState();

      return {
        success: true,
        data: {
          bookingId: bookingResult.insertedId,
          checkoutDetails: costCalculation.data
        }
      };
    } catch (error) {
      console.error('Error during checkout:', error);
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
              room.currentGuest?.checkout && 
              new Date(room.currentGuest.checkout) < now) {
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

  // Revenue Calculation Methods
  async calculateRevenueStats() {
    try {
      const db = getDB();
      const today = new Date();
      const localOffset = today.getTimezoneOffset() * 60000;

      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfWeek = new Date(startOfDay);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Adjust for local timezone
      startOfDay.setTime(startOfDay.getTime() - localOffset);
      startOfWeek.setTime(startOfWeek.getTime() - localOffset);
      startOfMonth.setTime(startOfMonth.getTime() - localOffset);

      const getDayEnd = (date) => new Date(date.getTime() + 24 * 60 * 60 * 1000);

      // Aggregate pipeline for revenue calculation
      const revenuePipeline = [
        {
          $project: {
            _id: 1,
            charges: 1,
            checkoutTimestamp: 1,
            totalAmount: { 
              $sum: ["$charges.roomCharges", "$charges.miceCharges", 
                     "$charges.serviceCharges", "$charges.gstAmount"] 
            }
          }
        }
      ];

      // Query for today
      const dailyRevenue = await db.collection('Bookings').aggregate([
        {
          $match: {
            checkoutTimestamp: {
              $gte: startOfDay.toISOString(),
              $lt: getDayEnd(startOfDay).toISOString()
            }
          }
        },
        ...revenuePipeline,
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]).toArray();

      // Query for this week
      const weeklyRevenue = await db.collection('Bookings').aggregate([
        {
          $match: {
            checkoutTimestamp: {
              $gte: startOfWeek.toISOString(),
              $lt: getDayEnd(startOfDay).toISOString()
            }
          }
        },
        ...revenuePipeline,
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]).toArray();

      // Query for this month
      const monthlyRevenue = await db.collection('Bookings').aggregate([
        {
          $match: {
            checkoutTimestamp: {
              $gte: startOfMonth.toISOString(),
              $lt: getDayEnd(startOfDay).toISOString()
            }
          }
        },
        ...revenuePipeline,
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
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

  // Refresh Methods
  async resetAndRefresh() {
    try {
      const now = Date.now();
      if (this._lastRefreshTimestamp && now - this._lastRefreshTimestamp < 5 * 60 * 1000) {
        console.log('Skipping refresh - too soon since last refresh');
        return { success: true, skipped: true };
      }

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
  
    this.resetAndRefresh();
    this.periodicRefreshInterval = setInterval(() => {
      this.resetAndRefresh();
    }, 60 * 60 * 1000);
  },

  stopPeriodicRefresh() {
    if (this.periodicRefreshInterval) {
      clearInterval(this.periodicRefreshInterval);
      this.periodicRefreshInterval = null;
    }
  },

  stopAllIntervals() {
    this.stopAutoUpdate();
    this.stopPeriodicRefresh();
  },

  async forceRefresh() {
    try {
      const db = getDB();
      const categories = await db.collection('Categories').find({}).toArray();
      const rooms = await db.collection('Rooms').find({}).toArray();
      const revenueStats = await this.calculateRevenueStats();

      this.state.categories = categories;
      this.state.rooms.list = rooms;
      if (revenueStats.success) {
        this.state.revenueStats = revenueStats.data;
      }

      this.updateRoomStats();
      this.mainWindow.webContents.send('state-update', this.state);
      return { success: true };
    } catch (error) {
      console.error('Error during forced refresh:', error);
      return { success: false, message: error.message };
    }
  },

  async calculateCheckoutCost(roomName) {
    try {
      const room = this.state.rooms.list.find((r) => r.name === roomName);
      if (!room || !room.currentGuest) {
        throw new Error('Room or guest not found');
      }
  
      // Extract dates
      const checkin = new Date(room.currentGuest.checkin.$date || room.currentGuest.checkin);
      const checkout = new Date(); // Current timestamp for checkout
  
      const fullDays = this.calculateDays(checkin, checkout);
  
      // Calculate room charges
      const roomCharges = fullDays * room.basePricePerNight;
  
      // Calculate service charges
      const serviceCharges = this.calculateServiceCharges(room.currentGuest.services);
  
      // Fetch GST percentage dynamically from the room field
      const gstPercentage = room.gstPercentage || 0;
  
      // Calculate GST (on room charges)
      const gstAmount = (roomCharges * gstPercentage) / 100;
  
      // Calculate total cost
      const totalCost = roomCharges + serviceCharges + gstAmount;
  
      return {
        success: true,
        data: {
          roomCharges,
          serviceCharges,
          gstAmount,
          totalCost,
          breakdown: {
            fullDays,
            baseRate: room.basePricePerNight,
            gstPercentage,
            servicesBreakdown: room.currentGuest.services,
          },
          checkin,
          checkout,
          guestDetails: room.currentGuest,
          roomDetails: {
            name: room.name,
            type: room.type,
            category: room.categoryName,
          },
        },
      };
    } catch (error) {
      console.error('Error calculating checkout cost:', error);
      return { success: false, message: error.message };
    }
  },
  
  calculateDays(checkin, checkout) {
    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
  
    // Align to 8 AM
    const startDay = new Date(checkinDate);
    startDay.setHours(CHECKOUT_CONSTANTS.CHECKIN_HOUR, 0, 0, 0);
  
    const endDay = new Date(checkoutDate);
    endDay.setHours(CHECKOUT_CONSTANTS.CHECKIN_HOUR, 0, 0, 0);
  
    const fullDays = Math.floor((endDay - startDay) / (24 * 60 * 60 * 1000));
    return fullDays;
  },
  
  calculateServiceCharges(services = []) {
    return services.reduce((total, service) => total + service.cost * service.units, 0);
  },
  
  async checkoutRoom(roomName) {
    try {
      const db = getDB();
      const room = this.state.rooms.list.find((r) => r.name === roomName);
  
      if (!room || !room.currentGuest) {
        throw new Error('Room or guest not found');
      }
  
      // Calculate costs
      const costCalculation = await this.calculateCheckoutCost(roomName);
      if (!costCalculation.success) {
        throw new Error(costCalculation.message);
      }
  
      // Save booking details
      const bookingData = {
        guestDetails: { ...room.currentGuest, dependants: room.currentGuest.dependants || [] },
        roomDetails: {
          name: room.name,
          category: room.categoryName,
          type: room.type,
          baseRate: room.basePricePerNight,
        },
        stayDetails: {
          checkin: room.currentGuest.checkin,
          checkout: new Date().toISOString(),
          fullDays: costCalculation.data.breakdown.fullDays,
        },
        charges: {
          roomCharges: costCalculation.data.roomCharges,
          serviceCharges: costCalculation.data.serviceCharges,
          gstAmount: costCalculation.data.gstAmount,
          totalCost: costCalculation.data.totalCost,
        },
        services: room.currentGuest.services || [],
        status: 'COMPLETED',
        checkoutTimestamp: new Date().toISOString(),
      };
  
      const bookingResult = await db.collection('Bookings').insertOne(bookingData);
      if (!bookingResult.insertedId) {
        throw new Error('Failed to save booking record');
      }
  
      // Update room status
      const updateResult = await db.collection('Rooms').updateOne(
        { name: roomName },
        { $set: { status: 'Available', currentGuest: null, lastUpdated: new Date().toISOString() } }
      );
  
      if (updateResult.modifiedCount === 0) {
        throw new Error('Failed to update room status');
      }
  
      // Update local state
      this.state.rooms.list = this.state.rooms.list.map((r) =>
        r.name === roomName
          ? { ...r, status: 'Available', currentGuest: null, lastUpdated: new Date().toISOString() }
          : r
      );
  
      this.broadcastState();
  
      return {
        success: true,
        data: { bookingId: bookingResult.insertedId, checkoutDetails: costCalculation.data },
      };
    } catch (error) {
      console.error('Error during checkout:', error);
      return { success: false, message: error.message };
    }
  },

  async saveBooking(bookingData) {
  try {
    const db = getDB();
    
    // MongoDB fields with $numberLong need to be handled
    const processedGuestDetails = {
      ...bookingData.guestDetails,
      phone_no: { $numberLong: bookingData.guestDetails.phone_no },
      aadhar: { $numberLong: bookingData.guestDetails.aadhar },
      dependants: (bookingData.guestDetails.dependants || []).map(dep => ({
        ...dep,
        phone_no: { $numberLong: dep.phone_no },
        aadhar: { $numberLong: dep.aadhar }
      }))
    };
  
    const finalBookingData = {
      ...bookingData,
      guestDetails: processedGuestDetails,
      createdAt: new Date().toISOString()
    };
  
    const result = await db.collection('Bookings').insertOne(finalBookingData);
  
    if (!result.insertedId) {
      throw new Error('Failed to save booking');
    }
  
    return {
      success: true,
      data: {
        _id: result.insertedId,
        billNo: bookingData.billNo
      }
    };
  
  } catch (error) {
    console.error('Save booking error:', error);
    return { 
      success: false, 
      message: error.message 
    };
  }
  },
  
  async cleanupRoom(roomName) {
  try {
    const db = getDB();
    
    const result = await db.collection('Rooms').updateOne(
      { name: roomName },
      {
        $set: {
          status: 'Available',
          currentGuest: null,
          lastUpdated: new Date().toISOString()
        }
      }
    );
  
    if (result.modifiedCount === 0) {
      throw new Error('Failed to cleanup room');
    }
  
    // Update local state
    this.state.rooms.list = this.state.rooms.list.map(room =>
      room.name === roomName
        ? {
            ...room,
            status: 'Available',
            currentGuest: null,
            lastUpdated: new Date().toISOString()
          }
        : room
    );
  
    this.updateRoomStats();
    this.broadcastState();
  
    return { success: true };
  } catch (error) {
    console.error('Room cleanup error:', error);
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
  }



};
