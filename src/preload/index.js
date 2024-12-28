import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  // Auth
  login: async (credentials) => await ipcRenderer.invoke('login', credentials),
  logout: async () => await ipcRenderer.invoke('logout'),
  
  // Room Data
  getRoomData: async () => await ipcRenderer.invoke('get-room-data'),
  
  // Categories
  getCategories: async () => await ipcRenderer.invoke('get-categories'),
  addCategory: async (data) => await ipcRenderer.invoke('add-category', data),
  updateCategory: async (data) => await ipcRenderer.invoke('update-category', data),
  deleteCategory: async (id) => await ipcRenderer.invoke('delete-category', id),
  
  // Spaces
  addSpace: async (data) => await ipcRenderer.invoke('add-space', data),
  deleteSpace: async (id) => await ipcRenderer.invoke('delete-space', id),
  updateSpace: async (data) => await ipcRenderer.invoke('update-space', data),
  
  // Organization
  getOrgDetails: async () => await ipcRenderer.invoke('get-org-details'),
  updateOrgDetails: async (details) => await ipcRenderer.invoke('update-org-details', details),
  
  // Revenue
  getRevenueStats: async () => await ipcRenderer.invoke('get-revenue-stats'),

  // Booking Operations
  createBooking: async (data) => await ipcRenderer.invoke('create-booking', data),
  getBooking: async (spaceId) => await ipcRenderer.invoke('get-booking', spaceId),
  updateBookingServices: async (data) => await ipcRenderer.invoke('update-booking-services', data),
  calculateCheckout: async (bookingId) => await ipcRenderer.invoke('calculate-checkout', bookingId),
  completeCheckout: async (data) => await ipcRenderer.invoke('complete-checkout', data),
  cancelBooking: async (data) => await ipcRenderer.invoke('cancel-booking', data),
  deleteBookingService: async (data) => await ipcRenderer.invoke('delete-booking-service', data),

  getAdvanceBookings: () => ipcRenderer.invoke('getAdvanceBookings'),
  createAdvanceBooking: (data) => ipcRenderer.invoke('createAdvanceBooking', data),
  cancelAdvanceBooking: (bookingId) => ipcRenderer.invoke('cancelAdvanceBooking', bookingId),
  assignRoom: (bookingId, spaceId) => ipcRenderer.invoke('assignRoom', { bookingId, spaceId })

})