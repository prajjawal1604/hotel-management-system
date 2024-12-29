// RoomAssignmentModal.jsx
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useRoomsStore } from '../../../store/roomsStore';

const RoomAssignmentModal = ({ booking, onRoomSelected, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSpace, setSelectedSpace] = useState(null); // Changed to null
  

  const { categories, spaces } = useRoomsStore();

  // Filter available spaces by category
  const availableSpaces = spaces.filter(space => 
    space.currentStatus === 'AVAILABLE' && 
    (!selectedCategory || space.categoryId._id === selectedCategory)
  );

  const handleAssignRoom = async () => {
    try {
      if (!selectedSpace || !booking) {
        throw new Error('Please select a room to assign');
      }

      console.log('Selected Space:', selectedSpace);
      
      onRoomSelected({
        spaceId: selectedSpace._id,
        space: selectedSpace // Pass full space object for BookingForm
      });

      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Assign Room</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

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
                setSelectedSpace(null); // Reset selected space
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
                    onClick={() => setSelectedSpace(space)} // Store the entire space object
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

        <div className="mt-8 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAssignRoom}
            disabled={!selectedSpace || loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
              disabled:opacity-50"
          >
            {loading ? 'Assigning...' : 'Assign Room'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomAssignmentModal;