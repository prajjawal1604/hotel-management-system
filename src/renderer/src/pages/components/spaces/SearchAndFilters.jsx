import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useRoomsStore } from '../../../store/roomsStore';
import { SPACE_STATUSES, SORT_OPTIONS } from '../../../constants/space';

const SearchAndFilters = () => {
  const filters = useRoomsStore(state => state.filters);
  const setFilters = useRoomsStore(state => state.setFilters);
  const resetFilters = useRoomsStore(state => state.resetFilters);

  // Local state for search input
  const [searchInput, setSearchInput] = useState('');

  // Sync local state with store on mount
  useEffect(() => {
    setSearchInput(filters.search || '');
  }, [filters.search]);

  const handleSearch = () => {
    if (searchInput.trim()) {
      setFilters({ search: searchInput.trim() });
    }
  };

  const handleClear = () => {
    setSearchInput('');
    resetFilters();
  };

  const handleStatusChange = (e) => {
    setFilters({ status: e.target.value });
  };

  const handleSortChange = (e) => {
    setFilters({ sort: e.target.value });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <div className="flex-1 relative">
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              size={20} 
            />
            <input
              type="text"
              placeholder="Search by room name..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchInput.trim()) {
                  handleSearch();
                }
              }}
            />
          </div>
          
          {filters.search ? (
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg 
                hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <X size={16} />
              Clear
            </button>
          ) : (
            <button
              onClick={handleSearch}
              disabled={!searchInput.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg 
                hover:bg-blue-700 transition-colors flex items-center gap-2
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search size={16} />
              Search
            </button>
          )}
        </div>

        <div className="flex gap-4">
          <select
            className="w-40 px-3 py-2.5 border border-gray-200 rounded-lg 
              focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={filters.status}
            onChange={handleStatusChange}
          >
            <option value="all">All Status</option>
            {Object.values(SPACE_STATUSES).map(status => (
              <option key={status} value={status}>
                {status === 'CHECKOUT_PENDING' ? 'Checkout Pending' : 
                  status.charAt(0) + status.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          
          <select
            className="w-52 px-3 py-2.5 border border-gray-200 rounded-lg 
              focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={filters.sort}
            onChange={handleSortChange}
          >
            <option value={SORT_OPTIONS.DEFAULT}>Sort by</option>
            <option value={SORT_OPTIONS.PRICE_HIGH}>Price: High to Low</option>
            <option value={SORT_OPTIONS.PRICE_LOW}>Price: Low to High</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default SearchAndFilters;