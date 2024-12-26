import { create } from 'zustand'

/**
 * Authentication Store - Manages user authentication state and actions
 */
export const useStore = create((set) => ({
  // Authentication State
  auth: {
    isAuthenticated: false,     // Tracks if user is logged in
    userRole: null,            // User role: 'ADMIN' or 'FRONT_OFFICE'
    userData: {
      username: null          // Logged in user's username
    }
  },

  // Authentication Actions
  
  /**
   * Updates authentication state
   * @param {Object} authData - New authentication data to merge
   */
  setAuth: (authData) => {
    console.log('Updating authentication state:', {
      ...authData,
      // Don't log sensitive data if present
      password: authData.password ? '[REDACTED]' : undefined
    });
    
    set((state) => ({
      auth: { ...state.auth, ...authData }
    }));
    
    console.log('Authentication state updated successfully');
  },

  /**
   * Clears authentication state (logout)
   * Resets all auth-related state to initial values
   */
  logout: () => {
    console.log('Logging out user, clearing authentication state');
    
    set(() => ({
      auth: {
        isAuthenticated: false,
        userRole: null,
        userData: { username: null }
      }
    }));
    
    console.log('Logout completed, auth state reset');
  }
}));