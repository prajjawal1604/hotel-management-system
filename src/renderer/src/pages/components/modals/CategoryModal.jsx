// components/modals/CategoryModal.jsx
import { useState } from 'react';
import { X } from 'lucide-react';
import { useRoomsStore } from '../../../store/roomsStore';

const CategoryModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    categoryName: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const setCategories = useRoomsStore(state => state.setCategories);
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await window.electron.addCategory(formData);
      if (result.success) {
        setCategories(result.categories);  
        onClose();
      } else {
        setError(result.message || 'Failed to add category');
      }
    } catch (error) {
      setError('An error occurred');
    } finally {
      setIsLoading(false);
    }
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

        <h2 className="text-xl font-bold mb-6">Add Category</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name
            </label>
            <input
              type="text"
              value={formData.categoryName}
              onChange={(e) => setFormData({ categoryName: e.target.value })}
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
            {isLoading ? 'Adding...' : 'Add Category'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;