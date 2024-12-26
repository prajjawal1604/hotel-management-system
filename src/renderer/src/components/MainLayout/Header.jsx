import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useRoomsStore }  from '../../store/roomsStore.js';
import Logo from '../../assets/images/logo/logoTextBlack.png';

const Header = () => {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Get auth state and logout function from store
  const { 
    auth: { isAuthenticated, userRole },
    logout 
  } = useStore();

  // Get store actions for updating room data
  const { setSpaces, setStats, setCategories } = useRoomsStore();

  // Handle logout process
  const handleLogout = async () => {
    console.log('Initiating logout process');
    try {
      const result = await window.electron.logout();
      console.log('Logout response:', result);

      if (result.success) {
        console.log('Logout successful, clearing store and redirecting');
        logout(); // Clear Zustand store
        navigate('/', { replace: true });
      } else {
        console.error('Logout failed:', result.message);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Handle data refresh
  const handleRefresh = async () => {
    if (isRefreshing) {
      console.log('Refresh already in progress, skipping');
      return;
    }

    console.log('Starting data refresh');
    try {
      setIsRefreshing(true);
      const result = await window.electron.getRoomData();
      console.log('Refresh response:', {
        success: result.success,
        spacesCount: result.data?.spaces?.length,
        categoriesCount: result.data?.categories?.length
      });
      
      if (!result.success) {
        throw new Error(result.message || 'Refresh failed');
      }

      // Validate and update store data
      if (result.data) {
        console.log('Updating store with refreshed data');
        setSpaces(result.data.spaces || []);
        setCategories(result.data.categories || []);
        setStats(result.data.stats || {
          available: 0,
          occupied: 0,
          maintenance: 0
        });
        console.log('Store update complete');
      }
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setIsRefreshing(false);
      console.log('Refresh process completed');
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
                    Role: {userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase()}
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