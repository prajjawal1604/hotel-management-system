// renderer/src/pages/AdminDashboard.jsx
import { useState, useEffect, useRef,useCallback , memo } from 'react';
import { Search, Loader, Plus, Trash2, X, Edit } from 'lucide-react';

// Component imports
import RoomEditModal from './modals/RoomEditModal';
import GuestDetailsModal from './modals/GuestDetailsModal';
import CategoryModal from './modals/CategoryModal';
import AddSpaceModal from './modals/AddSpaceModal';
import ConfirmationModal from './modals/ConfirmationModal';
import RevenueStats from './components/RevenueStats';
import CategoryEditModal from './modals/CategoryEditModal';
import RoomOperationsModal from './modals/RoomOperationsModal';

// Constants for room statuses
const ROOM_STATUSES = {
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  MAINTENANCE: 'Maintenance',
  CHECKOUT_PENDING: 'CheckoutPending'
};

const STATUS_COLORS = {
  [ROOM_STATUSES.AVAILABLE]: {
    bg: '#dcfce7',
    text: '#166534',
    className: 'bg-green-100 text-green-800'
  },
  [ROOM_STATUSES.OCCUPIED]: {
    bg: '#fee2e2',
    text: '#991b1b',
    className: 'bg-red-100 text-red-800'
  },
  [ROOM_STATUSES.MAINTENANCE]: {
    bg: '#f3f4f6',
    text: '#1f2937',
    className: 'bg-gray-100 text-gray-800'
  },
  [ROOM_STATUSES.CHECKOUT_PENDING]: {
    bg: '#fef3c7',
    text: '#92400e',
    className: 'bg-yellow-100 text-yellow-800'
  }
};

// Utility functions
const formatDate = (dateObj) => {
  if (!dateObj) return 'Not set';
  if (dateObj.$date) {
    return new Date(dateObj.$date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  return new Date(dateObj).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatPhoneNumber = (phoneNo) => {
  if (!phoneNo) return '';
  if (phoneNo.$numberLong) {
    return phoneNo.$numberLong;
  }
  return phoneNo.toString();
};

const AdminDashboard = ({ userRole }) => {
  // State initialization
  let key = 0;
  const [appState, setAppState] = useState({
    rooms: {
      list: [],
      stats: {
        available: 0,
        occupied: 0,
        maintenance: 0,
        checkoutPending: 0
      },
      filters: {
        search: '',
        status: 'all',
        sort: 'default'
      }
    },
    categories: []
  });

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showAddSpaceModal, setShowAddSpaceModal] = useState(false);
  const [showDeleteCategoryConfirm, setShowDeleteCategoryConfirm] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const searchInputRef = useRef(null);
  const [isSearching, setIsSearching] = useState(false);

  // Effect for error timeout
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Initial data load effect
  useEffect(() => {
    const initState = async () => {
      try {
        const state = await window.electron.getState();
        setAppState(state);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching state:', error);
        setError('Failed to load data');
        setIsLoading(false);
      }
    };

    initState();

    const unsubscribe = window.electron.onStateUpdate((newState) => {
      setAppState(newState);
    });

    return () => unsubscribe();
  }, []);
  // Handlers
  const handleSearch = (value) => {
    if (!value) return;
    setIsSearching(true);
    setAppState(prev => ({
      ...prev,
      rooms: {
        ...prev.rooms,
        filters: {
          ...prev.rooms.filters,
          search: value.toString()
        }
      }
    }));
  };

  const clearSearch = () => {
    setIsSearching(false);
    setAppState(prev => ({
      ...prev,
      rooms: {
        ...prev.rooms,
        filters: {
          ...prev.rooms.filters,
          search: ''
        }
      }
    }));
  };

  const handleDeleteSpace = async (space) => {
    try {
      const result = await window.electron.deleteSpace(space);
      if (!result.success) {
        setError(result.message || 'Failed to delete space');
        return false;
      }
      return true;
    } catch (err) {
      console.error('Delete space error:', err);
      setError('Error deleting space');
      return false;
    }
  };

  const handleDeleteCategory = async (category) => {
    try {
      const result = await window.electron.deleteCategory(category.name);
      if (!result.success) {
        setError(result.message || 'Failed to delete category');
        return false;
      }
      setShowDeleteCategoryConfirm(null);
      return true;
    } catch (err) {
      setError('Error deleting category');
      setShowDeleteCategoryConfirm(null);
      return false;
    }
  };

  const handleAddSpace = (category) => {
    if (!category) {
      setError('Invalid category selected');
      return;
    }
    setSelectedCategory(category);
    setShowAddSpaceModal(true);
  };

  const getFilteredRooms = () => {
    let filtered = [...appState.rooms.list];
    
    if (appState.rooms.filters.search) {
      const searchTerm = appState.rooms.filters.search.toLowerCase().trim();
      filtered = filtered.filter(room => 
        room.name.toLowerCase().includes(searchTerm) ||
        (room.currentGuest?.name || '').toLowerCase().includes(searchTerm)
      );
    }
  
    if (appState.rooms.filters.status !== 'all') {
      filtered = filtered.filter((room) => room.status === appState.rooms.filters.status);
    }
  
    if (appState.rooms.filters.sort !== 'default') {
      filtered.sort((a, b) => {
        if (appState.rooms.filters.sort === 'price_high') {
          return b.basePricePerNight - a.basePricePerNight;
        }
        return a.basePricePerNight - b.basePricePerNight;
      });
    }
  
    return filtered;
  };

  // RoomCard Component
  const RoomCard = memo(({ room, onDelete, role }) => {
    const [showEditModal, setShowEditModal] = useState(false);
    const [showGuestModal, setShowGuestModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showOperationsModal, setShowOperationsModal] = useState(false);
    const [timeUntilCheckout, setTimeUntilCheckout] = useState('');
  
    // Add status check timer
    useEffect(() => {    
      if (room.currentGuest?.checkout) { // Changed from checkout?.$date
        const checkStatus = () => {
          const now = new Date();
          // Handle both MongoDB date format and regular date string
          const checkOut = room.currentGuest.checkout.$date 
            ? new Date(room.currentGuest.checkout.$date)
            : new Date(room.currentGuest.checkout);
          
          // Update room status if checkout time has passed
          if (now > checkOut && room.status === ROOM_STATUSES.OCCUPIED) {
            window.electron.updateRoom({
              name: room.name,
              status: ROOM_STATUSES.CHECKOUT_PENDING,
              lastUpdated: new Date().toISOString()
            });
          }
    
          // Calculate time remaining
          const diff = checkOut - now;
          if (diff < 0) {
            setTimeUntilCheckout('Past checkout');
          } else {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            setTimeUntilCheckout(`${hours}h ${minutes}m until checkout`);
          }
        };
    
        // Initial check
        checkStatus();
    
        // Set up interval for regular checks (every minute)
        const interval = setInterval(checkStatus, 60000);
        return () => clearInterval(interval);
      }
    }, [room.currentGuest?.checkout, room.status, room.name]);

    const formatTitle = (room) => {
      const category = appState.categories.find(c => c.name === room.categoryName);
      if (category) {
        return `${category.type} ${room.name}`;
      }
      return room.name;
    };

    const canShowOperations = () => {
      if (role === 'admin') return true;
      if (room.status === ROOM_STATUSES.MAINTENANCE) return false;
      return true;
    };

    return (
      <>
        <div
          onClick={() => {
            if (!canShowOperations()) return;
            if (role === 'admin') {
              setShowEditModal(true);
            } else {
              setShowOperationsModal(true);
            }
          }}
          className={`p-4 rounded-lg ${STATUS_COLORS[room.status].className} 
            transition-transform hover:scale-105 border border-gray-100
            cursor-pointer group relative ${!canShowOperations() ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {/* Delete Button - Admin only */}
          {role === 'admin' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 
                transition-colors z-10"
            >
              <Trash2 size={18} />
            </button>
          )}

          {/* Room Header */}
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold">{formatTitle(room)}</h3>
            <span 
              className="text-sm px-3 py-0.5 mr-[1rem] rounded-full capitalize"
              style={{
                backgroundColor: STATUS_COLORS[room.status].bg,
                color: STATUS_COLORS[room.status].text
              }}
            >
              {room.status === ROOM_STATUSES.CHECKOUT_PENDING ? 'Checkout Pending' : room.status}
            </span>
          </div>

          {/* Room Details */}
          <p className="text-sm mb-1">{room.type}</p>
          <p className="font-medium">₹{room.basePricePerNight}/night</p>

          {/* Guest Info */}
          {room.currentGuest && (
            <div className="mt-2 text-sm space-y-1">
              <p>Guest: {room.currentGuest.name}</p>
              {room.currentGuest.phone_no && (
                <p>Phone: {formatPhoneNumber(room.currentGuest.phone_no)}</p>
              )}
               {console.log('Timer Value:', timeUntilCheckout)}
              <p>Check-in: {formatDate(room.currentGuest.checkin)}</p>
              <p>Check-out: {formatDate(room.currentGuest.checkout)}</p>
              {timeUntilCheckout && (
                <p className={timeUntilCheckout.includes('Past') ? 'text-red-600 font-medium' : 'text-gray-600'}>
                  {timeUntilCheckout}
                </p>
              )}
            </div>
          )}
          
          {/* Guest Details Button - Admin only */}
          {role === 'admin' && 
           room.currentGuest && 
           (room.status === ROOM_STATUSES.OCCUPIED || 
            room.status === ROOM_STATUSES.CHECKOUT_PENDING) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowGuestModal(true);
              }}
              className="mt-2 w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              View Guest Details
            </button>
          )}
        </div>

        {/* Modals */}
        {showDeleteConfirm && (
          <ConfirmationModal
            title="Delete Room"
            message={`Are you sure you want to delete ${formatTitle(room)}? This action cannot be undone.`}
            onConfirm={async () => {
              const success = await onDelete(room);
              if (success) setShowDeleteConfirm(false);
            }}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}

        {showEditModal && (
          <RoomEditModal
            room={room}
            onClose={() => setShowEditModal(false)}
          />
        )}

        {showGuestModal && room.currentGuest && (
          <GuestDetailsModal
            guest={room.currentGuest}
            onClose={() => setShowGuestModal(false)}
          />
        )}

        {showOperationsModal && (
          <RoomOperationsModal
            room={room}
            onClose={() => setShowOperationsModal(false)}
          />
        )}
      </>
    );
  });

  RoomCard.displayName = 'RoomCard';

  // Utility Components
  const QuickStats = memo(() => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[
        { label: 'Available Rooms', value: appState.rooms.stats.available, color: 'text-green-600' },
        { label: 'Occupied Rooms', value: appState.rooms.stats.occupied, color: 'text-red-600' },
        { label: 'Checkout Pending', value: appState.rooms.stats.checkoutPending, color: 'text-amber-500' },
        { label: 'Maintenance', value: appState.rooms.stats.maintenance, color: 'text-gray-600' },
      ].map(({ label, value, color }) => (
        <div className="bg-white rounded-lg shadow-sm p-6" key={label}>
          <h3 className="text-gray-600 text-sm font-medium mb-2">{label}</h3>
          <p className={`text-4xl font-bold ${color}`}>{value || 0}</p>
        </div>
      ))}
    </div>
  ));

  const SearchAndFilters = memo(() => {
    // Use local state instead of depending on parent state
    const [searchValue, setSearchValue] = useState('');
    
    // Memoize the search handler to prevent recreating on every render
    const handleSearchClick = useCallback(() => {
      if (searchValue.trim()) {
        handleSearch(searchValue.trim());
      }
    }, [searchValue]);
  
    // Memoize the clear handler
    const handleClear = useCallback(() => {
      setSearchValue('');
      clearSearch();
    }, []);
  
    // Memoize filter change handlers
    const handleStatusChange = useCallback((e) => {
      setAppState(prev => ({
        ...prev,
        rooms: {
          ...prev.rooms,
          filters: {
            ...prev.rooms.filters,
            status: e.target.value
          }
        }
      }));
    }, []);
  
    const handleSortChange = useCallback((e) => {
      setAppState(prev => ({
        ...prev,
        rooms: {
          ...prev.rooms,
          filters: {
            ...prev.rooms.filters,
            sort: e.target.value
          }
        }
      }));
    }, []);
  
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by room name, guest name..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchValue.trim()) {
                    handleSearchClick();
                  }
                }}
              />
            </div>
            {isSearching ? (
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 
                  transition-colors flex items-center gap-2"
              >
                <X size={16} />
                Clear
              </button>
            ) : (
              <button
                onClick={handleSearchClick}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                  transition-colors flex items-center gap-2"
                disabled={!searchValue.trim()}
              >
                <Search size={16} />
                Search
              </button>
            )}
          </div>
          <div className="flex gap-4">
            <select
              className="w-40 px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={appState.rooms.filters.status}
              onChange={handleStatusChange}
            >
              <option value="all">All Status</option>
              {Object.values(ROOM_STATUSES).map(status => (
                <option key={`${status}-1`} value={status}>
                  {status === ROOM_STATUSES.CHECKOUT_PENDING ? 'Checkout Pending' : status}
                </option>
              ))}
            </select>
            
            <select
              className="w-52 px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={appState.rooms.filters.sort}
              onChange={handleSortChange}
            >
              <option value="default">Sort by</option>
              <option value="price_high">Price: High to Low</option>
              <option value="price_low">Price: Low to High</option>
            </select>
          </div>
        </div>
      </div>
    );
  });

  // Status Legend Component
  const RoomStatusLegend = memo(() => {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-6">
          <span className="text-gray-600 font-medium">Room Status:</span>
          <div className="flex gap-6">
            {Object.entries(STATUS_COLORS).map(([status, config]) => (
              <div key={`${status}-2`} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded" 
                  style={{ backgroundColor: config.bg }}
                />
                <span className="text-sm text-gray-600">
                  {status === ROOM_STATUSES.CHECKOUT_PENDING ? 'Checkout Pending' : status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  });

  // Loading State
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader className="animate-spin" size={24} />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const filteredRooms = getFilteredRooms();

  // Main Render
  return (
    <div className="min-h-screen">
      <div className="space-y-6 p-6">
        {userRole === 'admin' && <RevenueStats />}
        <QuickStats />
        <SearchAndFilters />
        <RoomStatusLegend />
        
        {/* Admin Controls */}
        {userRole === 'admin' && (
          <div className="flex justify-end">
            <button
              onClick={() => setShowCategoryModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 
                flex items-center gap-2"
            >
              <Plus size={16} />
              Add Category
            </button>
          </div>
        )}
        
        {/* Room Display */}
        {isSearching ? (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Search Results ({filteredRooms.length} rooms)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredRooms.map((room) => (
                <RoomCard 
                  key={`search-${room.categoryName}-${room.name}`} 
                  room={room} 
                  onDelete={handleDeleteSpace}
                  role={userRole}
                />
              ))}
            </div>
          </div>
        ) : (
          // Category-wise room display
          appState.categories.map(category => (
            <div key={category._id} className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold text-gray-800">{category.name}</h2>
                  {userRole === 'admin' && (
                    <>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowEditCategoryModal(category);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit Category"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => setShowDeleteCategoryConfirm(category)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete Category"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <button
                        onClick={() => handleAddSpace(category)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700
                          flex items-center gap-2"
                      >
                        <Plus size={16} />
                        Add Space
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredRooms
                  .filter(room => room.categoryName === category.name)
                  .map(room => (
                    <RoomCard 
                      key={`${category._id}-${room.name}`} 
                      room={room} 
                      onDelete={handleDeleteSpace}
                      role={userRole}
                    />
                  ))}
              </div>
            </div>
          ))
        )}

        {/* Modals */}
        {userRole === 'admin' && showCategoryModal && (
          <CategoryModal onClose={() => setShowCategoryModal(false)} />
        )}
        
        {userRole === 'admin' && showAddSpaceModal && selectedCategory && (
          <AddSpaceModal
            categoryName={selectedCategory.name}
            categoryType={selectedCategory.type}
            onClose={() => {
              setShowAddSpaceModal(false);
              setSelectedCategory(null);
            }}
          />
        )}

        {userRole === 'admin' && showDeleteCategoryConfirm && (
          <ConfirmationModal
            title="Delete Category"
            message={`Are you sure you want to delete category "${showDeleteCategoryConfirm.name}"? This action cannot be undone.`}
            onConfirm={() => handleDeleteCategory(showDeleteCategoryConfirm)}
            onCancel={() => setShowDeleteCategoryConfirm(null)}
          />
        )}

        {userRole === 'admin' && showEditCategoryModal && (
          <CategoryEditModal
            category={showEditCategoryModal}
            onClose={() => setShowEditCategoryModal(null)}
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;




