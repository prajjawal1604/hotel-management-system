import { create } from 'zustand';

/**
 * RoomsStore - Manages hotel rooms, bookings, categories, and related data state
 */
export const useRoomsStore = create((set) => ({
  // Base State
  spaces: [],         // Stores all rooms/spaces with their details
  categories: [],     // Stores all categories/floors
  stats: {
    available: 0,     // Count of available rooms
    occupied: 0,      // Count of occupied rooms
    maintenance: 0    // Count of rooms in maintenance
  },
  filters: {
    search: '',       // Text search query
    status: 'all',    // Room status filter
    sort: 'default'   // Sorting preference
  },
  revenueStats: {
    dailyRevenue: 0,     // Today's revenue
    weeklyRevenue: 0,    // Last 7 days revenue
    monthlyRevenue: 0    // Current month revenue
  },
  orgDetails: {
    orgName: null,      // Organization name
    email: null,        // Organization email
    gstNumber: null,    // GST registration number
    gst: null          // GST percentage
  },
  activeBooking: null,  // Current active booking being managed
  bookingError: null,   // Store any booking-related errors

  // Actions
  setSpaces: (spaces) => {
    console.log('Received spaces data:', spaces);
    const validatedSpaces = spaces.map(space => {
      if (typeof space._id !== 'string') {
        console.error('Invalid space ID format:', space._id, 'for space:', space.spaceName);
      }
      if (typeof space.categoryId._id !== 'string') {
        console.error('Invalid category ID format in space:', space.categoryId._id, 'for space:', space.spaceName);
      }
      return space;
    });
    
    const stats = {
      available: validatedSpaces.filter(space => space.currentStatus === 'AVAILABLE').length,
      occupied: validatedSpaces.filter(space => space.currentStatus === 'OCCUPIED').length,
      maintenance: validatedSpaces.filter(space => space.currentStatus === 'MAINTENANCE').length
    };
    
    set({ spaces: validatedSpaces, stats });
  },

  setCategories: (categories) => {
    const validatedCategories = categories.map(category => {
      if (typeof category._id !== 'string') {
        console.error('Invalid category ID format:', category._id, 'for category:', category.categoryName);
      }
      return category;
    });
    set({ categories: validatedCategories });
  },

  setStats: (stats) => set({ stats }),
  
  setFilters: (filters) => set(state => ({
    filters: { ...state.filters, ...filters }
  })),

  resetFilters: () => set({
    filters: {
      search: '',
      status: 'all',
      sort: 'default'
    }
  }),

  setRevenueStats: (stats) => set(state => ({
    revenueStats: { ...state.revenueStats, ...stats }
  })),

  setOrgDetails: (details) => {
    if (details._id && typeof details._id !== 'string') {
      console.error('Invalid organization ID format:', details._id);
    }
    set(state => ({
      orgDetails: { ...state.orgDetails, ...details }
    }));
  },

  // Booking Actions
  setActiveBooking: (booking) => {
    console.log('Setting active booking:', booking);
    set({ 
      activeBooking: booking,
      bookingError: null 
    });
  },

  clearActiveBooking: () => {
    console.log('Clearing active booking');
    set({ 
      activeBooking: null,
      bookingError: null 
    });
  },

  updateSpaceWithBooking: (spaceId, bookingData) => set(state => {
    console.log('Updating space with booking:', spaceId, bookingData);
    const updatedSpaces = state.spaces.map(space => {
      if (space._id === spaceId) {
        return {
          ...space,
          currentStatus: 'OCCUPIED',
          bookingId: bookingData
        };
      }
      return space;
    });

    const stats = {
      available: updatedSpaces.filter(s => s.currentStatus === 'AVAILABLE').length,
      occupied: updatedSpaces.filter(s => s.currentStatus === 'OCCUPIED').length,
      maintenance: updatedSpaces.filter(s => s.currentStatus === 'MAINTENANCE').length
    };

    return {
      spaces: updatedSpaces,
      stats,
      activeBooking: bookingData
    };
  }),

  updateBookingServices: (services) => set(state => {
    if (!state.activeBooking) return state;

    return {
      activeBooking: {
        ...state.activeBooking,
        services
      }
    };
  }),

  completeBooking: (spaceId) => set(state => {
    console.log('Completing booking for space:', spaceId);
    const updatedSpaces = state.spaces.map(space => {
      if (space._id === spaceId) {
        return {
          ...space,
          currentStatus: 'AVAILABLE',
          bookingId: null
        };
      }
      return space;
    });

    const stats = {
      available: updatedSpaces.filter(s => s.currentStatus === 'AVAILABLE').length,
      occupied: updatedSpaces.filter(s => s.currentStatus === 'OCCUPIED').length,
      maintenance: updatedSpaces.filter(s => s.currentStatus === 'MAINTENANCE').length
    };

    return {
      spaces: updatedSpaces,
      stats,
      activeBooking: null,
      bookingError: null
    };
  }),

  cancelBooking: (spaceId, reason) => set(state => {
    console.log('Cancelling booking for space:', spaceId);
    const updatedSpaces = state.spaces.map(space => {
      if (space._id === spaceId) {
        return {
          ...space,
          currentStatus: 'AVAILABLE',
          bookingId: null
        };
      }
      return space;
    });

    const stats = {
      available: updatedSpaces.filter(s => s.currentStatus === 'AVAILABLE').length,
      occupied: updatedSpaces.filter(s => s.currentStatus === 'OCCUPIED').length,
      maintenance: updatedSpaces.filter(s => s.currentStatus === 'MAINTENANCE').length
    };

    return {
      spaces: updatedSpaces,
      stats,
      activeBooking: null,
      bookingError: null
    };
  }),

  setBookingError: (error) => set({
    bookingError: error
  })
}));

export default useRoomsStore;