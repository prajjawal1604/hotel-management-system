// renderer/src/pages/CategoryEditModal.jsx
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const CategoryEditModal = ({ category, onClose }) => {
  // Initialize with empty values and set them properly when category is available
  const [formData, setFormData] = useState(() => ({
    name: category?.name || '',
    type: category?.type || 'room'
  }));
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Update form data when category changes
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        type: category.type || 'room'
      });
    }
  }, [category]);

  const handleInputChange = (field, value) => {
    setError(''); // Clear error when user types
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
  
    // Validate inputs
    if (!formData.name.trim()) {
      setError('Category name is required');
      return;
    }
  
    if (!formData.type.trim()) {
      setError('Category type is required');
      return;
    }
  
    setIsLoading(true);
  
    try {
      const updateData = {
        name: formData.name.trim(),
        type: formData.type.trim()
      };
  
      console.log('Submitting category update:', updateData);
  
      const result = await window.electron.updateCategory(updateData);
  
      if (result.success) {
        onClose();
      } else {
        setError(result.message || 'Failed to update category');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      setError('Failed to update category. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if no category is provided
  if (!category) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 
            transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-6">Edit Category</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md 
                focus:outline-none focus:ring-2 focus:ring-blue-500
                transition-colors"
              placeholder="Enter category name"
              disabled={isLoading}
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
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md 
                focus:outline-none focus:ring-2 focus:ring-blue-500
                transition-colors"
              placeholder="e.g., room, suite, etc."
              disabled={isLoading}
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Describes the type of space in this category
            </p>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 
                rounded-md hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md 
                hover:bg-blue-700 disabled:opacity-50 transition-colors"
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

export default CategoryEditModal;