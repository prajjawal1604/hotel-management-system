import { create } from 'zustand';

/**
 * RoomsStore - Manages hotel rooms, categories, and related data state
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

  // Actions
  setSpaces: (spaces) => {
    console.log('Received spaces data:', spaces);
    // Validate IDs are strings (MongoDB ObjectId conversion check)
    const validatedSpaces = spaces.map(space => {
      if (typeof space._id !== 'string') {
        console.error('Invalid space ID format:', space._id, 'for space:', space.spaceName);
      }
      if (typeof space.categoryId._id !== 'string') {
        console.error('Invalid category ID format in space:', space.categoryId._id, 'for space:', space.spaceName);
      }
      return space;
    });
    console.log('Storing validated spaces:', validatedSpaces);
    set({ spaces: validatedSpaces });
  },

  setCategories: (categories) => {
    console.log('Received categories data:', categories);
    // Validate category IDs are strings
    const validatedCategories = categories.map(category => {
      if (typeof category._id !== 'string') {
        console.error('Invalid category ID format:', category._id, 'for category:', category.categoryName);
      }
      return category;
    });
    console.log('Storing validated categories:', validatedCategories);
    set({ categories: validatedCategories });
  },

  // Update room statistics
  setStats: (stats) => {
    console.log('Updating room statistics:', stats);
    set({ stats });
  },

  // Update filter settings
  setFilters: (filters) => {
    console.log('Applying new filters:', filters);
    set((state) => ({
      filters: { ...state.filters, ...filters }
    }));
  },

  // Reset filters to default values
  resetFilters: () => {
    console.log('Resetting filters to default');
    set({
      filters: {
        search: '',
        status: 'all',
        sort: 'default'
      }
    });
  },

  // Update revenue statistics
  setRevenueStats: (stats) => {
    console.log('Updating revenue statistics:', stats);
    set((state) => ({
      revenueStats: { ...state.revenueStats, ...stats }
    }));
  },

  // Update organization details
  setOrgDetails: (details) => {
    console.log('Received organization details update:', details);
    // Validate organization ID is string
    if (details._id && typeof details._id !== 'string') {
      console.error('Invalid organization ID format:', details._id);
    }
    console.log('Updating organization details');
    set(state => ({
      orgDetails: { ...state.orgDetails, ...details }
    }));
  }
}));