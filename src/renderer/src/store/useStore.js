import { create } from 'zustand'

export const useStore = create((set) => ({
  // Auth State
  auth: {
    isAuthenticated: false,
    userRole: null,  // 'ADMIN' | 'FRONT_OFFICE'
    userData: {
      username: null
    }
  },


  // Actions
  setAuth: (authData) => set((state) => ({
    auth: { ...state.auth, ...authData }
  })),

  logout: () => set(() => ({
    auth: {
      isAuthenticated: false,
      userRole: null,
      userData: { username: null }
    }
  }))
}))