// renderer/src/pages/RoomEditModal.jsx

import { useState } from 'react';  // Removed useEffect since we don't need it anymore
import { X } from 'lucide-react';

const RoomEditModal = ({ room, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: room.name,
    status: room.status,
    type: room.type,
    categoryName: room.categoryName,
    basePricePerNight: room.basePricePerNight,
    gstPercentage: room.gstPercentage || 18,
    maxPeople: room.maxPeople || { kids: 2, adults: 2 }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const updateData = {
        ...formData,
        lastUpdated: new Date().toISOString()
      };

      console.log('Sending update data:', updateData);
      const result = await window.electron.updateRoom(updateData);

      if (result.success) {
        onSave();
        onClose();
      } else {
        setError(result.error || 'Failed to update space');
      }
    } catch (error) {
      console.error('Error updating space:', error);
      setError('Failed to update space. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-6">Edit Space: {room.name}</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Space Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  name: e.target.value 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 101, A1, etc."
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <input
                type="text"
                value={formData.type}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  type: e.target.value 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Standard, Deluxe, Suite"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Price Per Night
              </label>
              <input
                type="number"
                value={formData.basePricePerNight}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  basePricePerNight: Number(e.target.value) 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GST Percentage
              </label>
              <input
                type="number"
                value={formData.gstPercentage}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  gstPercentage: Number(e.target.value) 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="100"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Adults
              </label>
              <input
                type="number"
                value={formData.maxPeople.adults}
                onChange={(e) => setFormData({
                  ...formData,
                  maxPeople: { 
                    ...formData.maxPeople, 
                    adults: Number(e.target.value) 
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="4"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Kids
              </label>
              <input
                type="number"
                value={formData.maxPeople.kids}
                onChange={(e) => setFormData({
                  ...formData,
                  maxPeople: { 
                    ...formData.maxPeople, 
                    kids: Number(e.target.value) 
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="4"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => {
                  console.log('Changing status to:', e.target.value);
                  setFormData(prev => ({
                    ...prev,
                    status: e.target.value
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Maintenance">Maintenance</option>
                <option value="CheckoutPending">Checkout Pending</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomEditModal;