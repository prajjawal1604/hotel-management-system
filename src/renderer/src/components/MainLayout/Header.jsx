import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import Logo from '../../assets/images/logo/logoTextBlack.png';

const Header = () => {
  const navigate = useNavigate();
  const [appState, setAppState] = useState({
    auth: { isAuthenticated: false, role: null }
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initialize state and set up state update listener
  useEffect(() => {
    const initState = async () => {
      try {
        const state = await window.electron.getState();
        setAppState(state);
      } catch (error) {
        console.error('Failed to initialize state:', error);
      }
    };
    initState();

    const unsubscribe = window.electron.onStateUpdate((newState) => {
      setAppState(newState);
      if (!newState.auth.isAuthenticated && window.location.pathname !== '/') {
        navigate('/', { replace: true });
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = useCallback(() => {
    window.electron.logout();
  }, []);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;

    try {
      setIsRefreshing(true);
      // Use forceRefresh instead of resetAndRefresh for immediate update
      const result = await window.electron.forceRefresh();
      
      if (!result.success) {
        throw new Error(result.message || 'Refresh failed');
      }
    } catch (error) {
      console.error('Refresh failed:', error);
      // Optionally show error to user via toast/alert
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  return (
    <header className="bg-white shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex h-[3.5rem] justify-between items-center">
          <div className="flex-shrink-0">
            <img src={Logo} className="h-30 w-40" alt="Logo" />
          </div>
          
          <div className="flex items-center gap-4">
            {appState.auth.isAuthenticated && (
              <>
                {appState.auth.role && (
                  <span className="text-gray-600 font-medium">
                    Role: {appState.auth.role.charAt(0).toUpperCase() + appState.auth.role.slice(1)}
                  </span>
                )}

                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    isRefreshing 
                      ? 'bg-gray-200 cursor-not-allowed' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  title="Force refresh data"
                >
                  <RefreshCw 
                    size={18} 
                    className={`transition-transform duration-500 ${
                      isRefreshing ? 'animate-spin' : 'hover:rotate-180'
                    }`}
                  />
                </button>

                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 
                    font-medium hover:bg-gray-200 transition-colors"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;