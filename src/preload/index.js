import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  // State Management
  getState: () => ipcRenderer.invoke('get-state'),
  onStateUpdate: (callback) => {
    const subscription = (_, state) => callback(state);
    ipcRenderer.on('state-update', subscription);
    return () => ipcRenderer.removeListener('state-update', subscription);
  },

  // Authentication
  login: (credentials) => ipcRenderer.invoke('login', credentials),
  logout: () => ipcRenderer.invoke('logout'),

  // Room Management
  getRooms: () => ipcRenderer.invoke('get-rooms'),
  getRoomStats: () => ipcRenderer.invoke('get-room-stats'),
  updateRoom: (data) => ipcRenderer.invoke('updateRoom', data),

  // Category Management
  addCategory: (data) => ipcRenderer.invoke('addCategory', data),
  updateCategory: (data) => ipcRenderer.invoke('updateCategory', data),
  deleteCategory: (name) => ipcRenderer.invoke('deleteCategory', name),

  // Space Management
  addSpace: (data) => ipcRenderer.invoke('addSpace', data),
  deleteSpace: (data) => ipcRenderer.invoke('deleteSpace', data),

  // Revenue Management
  getRevenueStats: () => ipcRenderer.invoke('get-revenue-stats'),

  // State Refresh
  resetAndRefresh: () => ipcRenderer.invoke('reset-and-refresh'),
  forceRefresh: () => ipcRenderer.invoke('force-refresh'),

  calculateCheckout: (roomName) => ipcRenderer.invoke('calculate-checkout', roomName),
  checkoutRoom: (roomName) => ipcRenderer.invoke('checkout-room', roomName),

  saveBooking: (data) => ipcRenderer.invoke('save-booking', data),
  generatePdf: (data) => ipcRenderer.invoke('generate-pdf', data),
  showNotification: (options) => ipcRenderer.invoke('show-notification', options),
});