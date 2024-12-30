import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useRoomsStore } from '../../../store/roomsStore';
import BookingForm from '../containers/BookingForm';

const RoomAssignmentModal = ({ booking, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [formData, setFormData] = useState(null);

  const { categories, spaces } = useRoomsStore();

  // Filter available spaces by category
  const availableSpaces = spaces.filter(space => 
    space.currentStatus === 'AVAILABLE' && 
    (!selectedCategory || space.categoryId._id === selectedCategory)
  );

  // Prepare form data from advance booking
  const prepareFormData = () => {
    // Format dates for datetime-local input
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
    };

    const initialData = {
      fullName: booking.guestId.fullName,
      phoneNumber: booking.guestId.phoneNumber,
      gender: booking.guestId.gender,
      age: booking.guestId.age,
      aadharNumber: booking.guestId.aadharNumber,
      nationality: booking.guestId.nationality || '',
      address: booking.guestId.address || '',
      companyName: booking.guestId.companyName || '',
      gstin: booking.guestId.gstin || '',
      designation: booking.guestId.designation || '',
      purposeOfVisit: booking.guestId.purposeOfVisit || '',
      checkIn: formatDate(booking.checkIn),
      checkOut: formatDate(booking.checkOut),
      advanceAmount: booking.advanceAmount || 0,
      additionalGuests: booking.additionalGuestIds || [],
      services: []
    };

    setFormData(initialData);
    return initialData;
  };

  const handleAssignRoom = () => {
    try {
      if (!selectedSpace || !booking) {
        throw new Error('Please select a room to assign');
      }
      setShowBookingForm(true);
      prepareFormData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBookingSubmit = async (updatedFormData) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Submitting booking with data:', updatedFormData);

      const result = await window.electron.createBooking({
        ...updatedFormData,
        spaceId: selectedSpace._id,
        bookingId: booking._id
      });

      if (result.success) {
        // Get updated room data
        const roomData = await window.electron.getRoomData();
        if (roomData.success) {
          // Update room store with new data
          useRoomsStore.getState().setSpaces(roomData.data.spaces);
          useRoomsStore.getState().setStats(roomData.data.stats);
        }
        onClose(); // Close the modal
      } else {
        throw new Error(result.message || 'Failed to create booking');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error in booking:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl min-h-[80vh] max-h-[90vh] flex flex-col m-4">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {!showBookingForm ? 'Assign Room' : 'Complete Booking'} - Room Assignment
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 mx-6 mt-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {!showBookingForm ? (
            <div className="space-y-6">
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Select Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedSpace(null);
                  }}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Space Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Select Room
                </label>
                {availableSpaces.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {availableSpaces.map(space => (
                      <div
                        key={space._id}
                        onClick={() => setSelectedSpace(space)}
                        className={`p-4 border rounded-lg cursor-pointer hover:border-blue-500 
                          ${selectedSpace?._id === space._id ? 'border-blue-500 bg-blue-50' : ''}`}
                      >
                        <div className="font-medium">{space.spaceName}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {space.spaceType} - ₹{space.basePrice}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {space.categoryId.categoryName}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    No available rooms found
                  </div>
                )}
              </div>
            </div>
          ) : (
            <BookingForm 
              space={selectedSpace}
              formData={formData}
              setFormData={setFormData}
              onNext={(data) => handleBookingSubmit(data)}
              hideFooter={true}
              disabled={loading}
            />
          )}
        </div>

        <div className="p-4 border-t flex justify-between gap-4">
          <button
            onClick={() => {
              if (showBookingForm) {
                setShowBookingForm(false);
                setFormData(null);
              } else {
                onClose();
              }
            }}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {showBookingForm ? 'Back' : 'Cancel'}
          </button>
          {!showBookingForm ? (
            <button
              onClick={handleAssignRoom}
              disabled={!selectedSpace || loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                'Continue'
              )}
            </button>
          ) : (
            <button
              onClick={() => {
                if (formData) {
                  handleBookingSubmit(formData);
                }
              }}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                'Save & Continue'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomAssignmentModal;