// renderer/src/components/CategoryModal.jsx
import { useState } from 'react';
import { X } from 'lucide-react';

const CategoryModal = ({ onClose }) => {
  const [newCategory, setNewCategory] = useState({
    name: '',
    type: 'room'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setError(''); // Clear error when user types
    setNewCategory(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!newCategory.name.trim()) {
      setError('Category name is required');
      return;
    }

    if (!newCategory.type.trim()) {
      setError('Category type is required');
      return;
    }

    setIsLoading(true);
    try {
      const categoryData = {
        ...newCategory,
        name: newCategory.name.trim(),
        type: newCategory.type.trim(),
        createdAt: new Date().toISOString()
      };

      console.log('Adding new category:', categoryData);

      const result = await window.electron.addCategory(categoryData);
      
      if (result.success) {
        onClose();
      } else {
        setError(result.message || 'Failed to add category');
      }
    } catch (err) {
      console.error('Error adding category:', err);
      setError('Failed to add category. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-6">Add New Category</h2>

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
              value={newCategory.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md 
                focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Floor 1"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Type
            </label>
            <input
              type="text"
              value={newCategory.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md 
                focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Room, Hall, Floor"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Describes the type of space in this category
            </p>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md 
                hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md 
                hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Adding...' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;