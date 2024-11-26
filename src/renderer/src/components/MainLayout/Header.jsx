import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import Logo from '../../assets/images/logo/logoTextBlack.png';

const Header = () => {
  const navigate = useNavigate();
  const [appState, setAppState] = useState({
    auth: { isAuthenticated: false, role: null }
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const initState = async () => {
      const state = await window.electron.getState();
      setAppState(state);
    };
    initState();

    const unsubscribe = window.electron.onStateUpdate((newState) => {
      setAppState(newState);
      if (!newState.auth.isAuthenticated && window.location.pathname !== '/') {
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = () => window.electron.logout();

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      console.log('Starting refresh...'); // Debug log
      const result = await window.electron.resetAndRefresh();
      console.log('Refresh result:', result); // Debug log
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

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
                  <span className="text-gray-600">
                    Role: {appState.auth.role}
                  </span>
                )}

<button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                  title="Refresh data"
                >
                  <RefreshCw 
                    size={18} 
                    className={isRefreshing ? 'animate-spin' : ''} 
                  />
                </button>

                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 
                    font-medium hover:bg-gray-200"
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