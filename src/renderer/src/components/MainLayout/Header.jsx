import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useRoomsStore }  from '../../store/roomsStore.js';
import Logo from '../../assets/images/logo/logoTextBlack.png';

const Header = () => {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  
  const { 
    auth: { isAuthenticated, userRole },
    logout 
  } = useStore();

  
    const { setSpaces, setStats, setCategories } = useRoomsStore();

  const handleLogout = async () => {
    try {
      // Using the directly exposed logout function
      const result = await window.electron.logout();
      if (result.success) {
        logout(); // Clear Zustand store
        navigate('/', { replace: true });
      } else {
        console.error('Logout failed:', result.message);
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;

    try {
      setIsRefreshing(true);
      // Using the directly exposed refreshData function
      const result = await window.electron.getRoomData();
      
      if (!result.success) {
        throw new Error(result.message || 'Refresh failed');
      }

      if (result.success) {
      setSpaces(result.data.spaces);
      setCategories(result.data.categories);
      setStats(result.data.stats);
    }
    } catch (error) {
      console.error('Refresh failed:', error);
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
            {isAuthenticated && (
              <>
                {userRole && (
                  <span className="text-gray-600 font-medium">
                    Role: {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
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