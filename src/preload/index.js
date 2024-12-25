import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  // Auth
  login: async (credentials) => await ipcRenderer.invoke('login', credentials),
  logout: async () => await ipcRenderer.invoke('logout'),
  
  // Room Data
  getRoomData: async () => await ipcRenderer.invoke('get-room-data'),
  updateRoom: async (data) => await ipcRenderer.invoke('update-room', data),
  
  // Categories
  getCategories: async () => await ipcRenderer.invoke('get-categories'),
  addCategory: async (data) => await ipcRenderer.invoke('add-category', data),
  updateCategory: async (data) => await ipcRenderer.invoke('update-category', data),
  deleteCategory: async (id) => await ipcRenderer.invoke('delete-category', id),
  
  // Spaces
  addSpace: async (data) => await ipcRenderer.invoke('add-space', data),
  deleteSpace: async (id) => await ipcRenderer.invoke('delete-space', id),
  
  // Revenue
  getRevenueStats: () => ipcRenderer.invoke('get-revenue-stats')
})