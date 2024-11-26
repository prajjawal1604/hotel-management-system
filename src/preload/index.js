// preload/index.js

import { contextBridge, ipcRenderer } from 'electron';

// preload/index.js
contextBridge.exposeInMainWorld('electron', {
 
 
  // State Management
  getState: () => ipcRenderer.invoke('get-state'),
  onStateUpdate: (callback) => {
    const subscription = (_, state) => callback(state);
    ipcRenderer.on('state-update', subscription);
    return () => ipcRenderer.removeListener('state-update', subscription);
  },

  // Auth
  login: (credentials) => ipcRenderer.invoke('login', credentials),
  logout: () => ipcRenderer.invoke('logout'),

  // Room Management
  getRooms: () => ipcRenderer.invoke('get-rooms'),
  getRoomStats: () => ipcRenderer.invoke('get-room-stats'),
  updateRoom: (data) => ipcRenderer.invoke('updateRoom', data),

  // Category Management - Fixed naming consistency
  addCategory: (data) => ipcRenderer.invoke('addCategory', data),
  updateCategory: (data) => ipcRenderer.invoke('updateCategory', data),
  deleteCategory: (name) => ipcRenderer.invoke('deleteCategory', name),

  // Space Management
  addSpace: (data) => ipcRenderer.invoke('addSpace', data),
  deleteSpace: (data) => ipcRenderer.invoke('deleteSpace', data),

  // System
  resetAndRefresh: () => ipcRenderer.invoke('reset-and-refresh'),
});