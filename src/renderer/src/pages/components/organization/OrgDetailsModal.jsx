// components/organization/OrgDetailsModal.jsx
import { useState } from 'react';
import { X } from 'lucide-react';
import { useRoomsStore } from '../../../store/roomsStore';

const OrgDetailsModal = ({ onClose }) => {
  const orgDetails = useRoomsStore(state => state.orgDetails)||{};
  const setOrgDetails = useRoomsStore(state => state.setOrgDetails);
  
  const [formData, setFormData] = useState({
    orgName: orgDetails.orgName || '',
    email: orgDetails.email || '',
    gstNumber: orgDetails.gstNumber || '',
    gst: orgDetails.gst || ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await window.electron.updateOrgDetails(formData);
      
      if (result.success) {
        setOrgDetails(result.data);
        onClose();
      } else {
        setError(result.message || 'Failed to update details');
      }
    } catch (error) {
      setError('An error occurred while updating');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-6">Organization Details</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organization Name
            </label>
            <input
              type="text"
              name="orgName"
              value={formData.orgName}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GSTIN
            </label>
            <input
              type="text"
              name="gstNumber"
              value={formData.gstNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GST Percentage
            </label>
            <input
              type="text"
              name="gst"
              value={formData.gst}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md 
              hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Updating...' : 'Update Details'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OrgDetailsModal;