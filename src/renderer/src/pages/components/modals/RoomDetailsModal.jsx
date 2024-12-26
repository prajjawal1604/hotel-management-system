import { useState } from 'react';
import { X } from 'lucide-react';
import { useRoomsStore } from '../../../store/roomsStore';

const SPACE_TYPES = ['NON A/C', 'A/C', 'SUIT', 'DELUX'];
const SPACE_STATUSES = ['AVAILABLE', 'MAINTENANCE'];

const RoomDetailsModal = ({ space, onClose }) => {
  const [formData, setFormData] = useState({
    spaceName: space.spaceName,
    spaceType: space.spaceType,
    basePrice: space.basePrice,
    currentStatus: space.currentStatus,
    maxOccupancy: {
      adults: space.maxOccupancy.adults,
      kids: space.maxOccupancy.kids
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const updateData = {
        ...space,
        ...formData,
      };

      const result = await window.electron.updateSpace(updateData);
      
      if (result.success) {
        useRoomsStore.getState().setSpaces(result.spaces);
        onClose();
      } else {
        throw new Error(result.message || 'Failed to update space');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Space Details</h2>
          <button onClick={onClose}>
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Space Name</label>
            <input
              type="text"
              value={formData.spaceName}
              onChange={(e) => setFormData({ ...formData, spaceName: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={formData.spaceType}
              onChange={(e) => setFormData({ ...formData, spaceType: e.target.value })}
              className="w-full p-2 border rounded"
            >
              {SPACE_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Base Price</label>
            <input
              type="number"
              value={formData.basePrice}
              onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={formData.currentStatus}
              onChange={(e) => setFormData({ ...formData, currentStatus: e.target.value })}
              className="w-full p-2 border rounded"
            >
              {SPACE_STATUSES.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Max Adults</label>
              <input
                type="number"
                value={formData.maxOccupancy.adults}
                onChange={(e) => setFormData({
                  ...formData,
                  maxOccupancy: {
                    ...formData.maxOccupancy,
                    adults: Number(e.target.value)
                  }
                })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Kids</label>
              <input
                type="number"
                value={formData.maxOccupancy.kids}
                onChange={(e) => setFormData({
                  ...formData,
                  maxOccupancy: {
                    ...formData.maxOccupancy,
                    kids: Number(e.target.value)
                  }
                })}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomDetailsModal;
