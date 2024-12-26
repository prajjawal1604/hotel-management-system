import { create } from 'zustand';

export const useRoomsStore = create((set) => ({
  spaces: [],
  categories: [],
  stats: {
    available: 0,
    occupied: 0,
    maintenance: 0
  },
  filters: {
    search: '',
    status: 'all',
    sort: 'default'
  },
  revenueStats: {
    dailyRevenue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0
  },
  orgDetails: {
    orgName: null,
    email: null,
    gstNumber: null,
    gst: null
  },

  setOrgDetails: (details) => set(state => ({
    orgDetails: { ...state.orgDetails, ...details }
  })),


  setRevenueStats: (stats) => set((state) => ({
    revenueStats: { ...state.revenueStats, ...stats }
  })),
  // Actions
  setSpaces: (spaces) => {
    console.log('Store Spaces:', spaces);
    set({ spaces });
  },
  setCategories: (categories) => set({ categories }),
  setStats: (stats) => set({ stats }),
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),
  
  resetFilters: () => set({
    filters: {
      search: '',
      status: 'all',
      sort: 'default'
    }
  })
})); 
