import React, { useState, useEffect } from 'react';
import { X, Search, Trash2, Calendar, User, Phone, Clock, Filter, ChevronDown } from 'lucide-react';
import AdvancedBookingForm from './AdvancedBookingForm';
import RoomAssignmentModal from './RoomAssignmentModal';

const DATE_FILTERS = {
  ALL: 'all',
  TODAY: 'today',
  TOMORROW: 'tomorrow',
  WEEK: 'week',
  MONTH: 'month'
};

const AdvancedBookingModal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('list');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(DATE_FILTERS.ALL);
  const [showFilters, setShowFilters] = useState(false);
  const [deletingBookingId, setDeletingBookingId] = useState(null);

  // Modal states
  const [showRoomAssignModal, setShowRoomAssignModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Fetch bookings
  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await window.electron.getAdvanceBookings();
      
      if (result.success) {
        console.log('Fetched bookings:', result.data);
        setBookings(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch bookings');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Handle deletion of booking
  const handleDeleteBooking = async (booking) => {
    try {
      if (!window.confirm('Are you sure you want to delete this advance booking?')) {
        return;
      }
  
      setDeletingBookingId(booking._id);
      setError(null);
  
      const result = await window.electron.deleteAdvanceBooking(booking._id);
  
      if (result.success) {
        await fetchBookings(); // Refresh the list
      } else {
        throw new Error(result.message || 'Failed to delete booking');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error deleting booking:', err);
    } finally {
      setDeletingBookingId(null);
    }
  };

  // Handle new booking submission
  const handleBookingSubmit = async (formData) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await window.electron.createAdvanceBooking(formData);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create booking');
      }

      console.log('Created booking:', result.data);
      await fetchBookings(); // Refresh the list
      setActiveTab('list');
    } catch (err) {
      setError(err.message);
      console.error('Error creating booking:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle room assignment
  const handleAssignRoom = (booking) => {
    setSelectedBooking(booking);
    setShowRoomAssignModal(true);
  };

  // Filter bookings
  const getFilteredBookings = () => {
    if (!bookings) return [];
    
    return bookings.filter(booking => {
      // Search term filter
      const searchMatch = searchTerm === '' || (
        booking.guestId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.guestId?.phoneNumber?.includes(searchTerm) ||
        booking.guestId?.aadharNumber?.toString().includes(searchTerm)
      );
      
      // Date filter
      let dateMatch = true;
      if (dateFilter !== DATE_FILTERS.ALL && booking.checkIn) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkIn = new Date(booking.checkIn);
        checkIn.setHours(0, 0, 0, 0);
        
        switch (dateFilter) {
          case DATE_FILTERS.TODAY:
            dateMatch = checkIn.getTime() === today.getTime();
            break;
          case DATE_FILTERS.TOMORROW:
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            dateMatch = checkIn.getTime() === tomorrow.getTime();
            break;
          case DATE_FILTERS.WEEK:
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);
            dateMatch = checkIn >= today && checkIn <= nextWeek;
            break;
          case DATE_FILTERS.MONTH:
            const nextMonth = new Date(today);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            dateMatch = checkIn >= today && checkIn <= nextMonth;
            break;
          default:
            dateMatch = true;
        }
      }

      return searchMatch && dateMatch;
    });
  };

  // Render booking list item
  const renderBookingItem = (booking) => (
    <div key={booking._id} 
      className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-blue-300 
        transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <User size={20} className="text-gray-500" />
            {booking.guestId?.fullName || 'N/A'}
          </h3>
          <div className="mt-1 text-sm text-gray-600 flex items-center gap-2">
            <Phone size={16} />
            {booking.guestId?.phoneNumber || 'N/A'}
          </div>
          <div className="mt-1 text-sm text-gray-500">
            Aadhar: {booking.guestId?.aadharNumber || 'N/A'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-sm">
          <p className="text-gray-500 flex items-center gap-1 mb-[10px]">
            <Calendar size={16} />
            Check-in: {new Date(booking.checkIn).toLocaleDateString()}
          </p>
          <p className="text-gray-500">
            Advance: ₹{booking.advanceAmount || 0}
          </p>
        </div>
        <div className="text-sm">
          <p className="text-gray-500 flex items-center gap-1 mt-1">
            <Clock size={16} />
            Check-out: {new Date(booking.checkOut).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {booking.status === 'ONGOING' && (
          <>
            <button
              onClick={() => handleAssignRoom(booking)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                transition-colors"
            >
              Assign Room
            </button>
            <button
              onClick={() => handleDeleteBooking(booking)}
              disabled={deletingBookingId === booking._id}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 
                transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {deletingBookingId === booking._id ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Delete
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-5xl h-[90vh] flex flex-col m-4">
          {/* Header */}
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-2xl font-bold">Advanced Bookings</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          {/* Tabs */}
          <div className="px-6 pt-4 border-b">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('list')}
                className={`px-4 py-2 font-medium rounded-t-lg transition-colors
                  ${activeTab === 'list' 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'}`}
              >
                Booking List
              </button>
              <button
                onClick={() => setActiveTab('form')}
                className={`px-4 py-2 font-medium rounded-t-lg transition-colors
                  ${activeTab === 'form' 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'}`}
              >
                New Booking
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}

            {activeTab === 'form' ? (
              <AdvancedBookingForm onSubmit={handleBookingSubmit} />
            ) : (
              <div className="space-y-6">
                {/* Search and Filters */}
                <div className="flex items-center justify-between">
                  <div className="relative w-96">
                    <input
                      type="text"
                      placeholder="Search by name, phone, or Aadhar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 pl-10 border rounded-lg"
                    />
                    <Search size={20} className="absolute left-3 top-2.5 text-gray-400" />
                  </div>
                  
                  <div className="relative">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="px-4 py-2 border rounded-lg flex items-center gap-2 
                        hover:bg-gray-50"
                    >
                      <Filter size={20} />
                      Date Filter
                      <ChevronDown size={16} />
                    </button>

                    {showFilters && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg 
                        border p-2 z-10">
                        <select
                          value={dateFilter}
                          onChange={(e) => setDateFilter(e.target.value)}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value={DATE_FILTERS.ALL}>All Dates</option>
                          <option value={DATE_FILTERS.TODAY}>Today</option>
                          <option value={DATE_FILTERS.TOMORROW}>Tomorrow</option>
                          <option value={DATE_FILTERS.WEEK}>Next 7 Days</option>
                          <option value={DATE_FILTERS.MONTH}>Next 30 Days</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bookings List */}
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  </div>
                ) : getFilteredBookings().length > 0 ? (
                  <div className="space-y-4">
                    {getFilteredBookings().map(renderBookingItem)}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No bookings found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {showRoomAssignModal && (
          <RoomAssignmentModal
            booking={selectedBooking}
            onClose={() => {
              setShowRoomAssignModal(false);
              setSelectedBooking(null);
              fetchBookings(); // Refresh the list after assignment
            }}
          />
        )}
      </div>
    </>
  );
};

export default AdvancedBookingModal;