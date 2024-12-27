import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useRoomsStore } from '../../../store/roomsStore.js';
import { useStore } from '../../../store/useStore.js'; // Fix: Correct import
import SpaceCard from './SpaceCard';
import SearchAndFilters from './SearchAndFilters';
import CategoryModal from '../modals/CategoryModal';
import AddSpaceModal from '../modals/AddSpaceModal';
import { SPACE_STATUSES, SORT_OPTIONS } from '../../../constants/space';
import ConfirmationModal from '../modals/ConfirmationModal';

const SpacesGrid = () => {
  // Get store data
  const spaces = useRoomsStore(state => state.spaces);
  const categories = useRoomsStore(state => state.categories);
  const filters = useRoomsStore(state => state.filters);
  const role = useStore(state => state.user?.role); // Fix: Get role from useStore
  const isAdmin = role === 'ADMIN'; // Check against 'ADMIN' role

  // Debug logs for store data
  useEffect(() => {
    console.log('SpacesGrid - Store Data:', { 
      spaces: spaces?.length,
      categories: categories?.length,
      filters 
    });
    
    // Validate IDs if data exists
    if (spaces?.length) {
      spaces.forEach(space => {
        if (typeof space._id !== 'string') {
          console.error('Invalid space ID format:', space);
        }
        if (typeof space.categoryId._id !== 'string') {
          console.error('Invalid category ID in space:', space);
        }
      });
    }
  }, [spaces, categories, filters]);

  // Modal states
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddSpaceModal, setShowAddSpaceModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const handleAddSpace = (category) => {
    console.log('Handling add space for category:', category.categoryName);
    setSelectedCategory(category);
    setShowAddSpaceModal(true);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      const response = await window.electron.deleteCategory(categoryToDelete._id);
      
      if (response.success) {
        // Update categories in store
        useRoomsStore.getState().setCategories(response.categories);
        alert('Category deleted successfully');
      } else {
        if (response.hasSpaces) {
          alert('Cannot delete category that contains spaces. Please delete or move all spaces first.');
        } else {
          alert(response.message || 'Failed to delete category');
        }
      }
      setCategoryToDelete(null);
      
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('An error occurred while deleting the category');
      setCategoryToDelete(null);
    }
  };

  // Apply filters
  const filterSpaces = (spaces) => {
    console.log('Applying filters:', filters);
    let filtered = [...spaces];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(space => 
        space.spaceName.toLowerCase().includes(searchTerm)
      );
      console.log('After search filter:', filtered.length, 'spaces');
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(space => {
        if (filters.status === SPACE_STATUSES.CHECKOUT_PENDING) {
          return space.currentStatus === SPACE_STATUSES.OCCUPIED && 
                 space.bookingId?.checkOut && 
                 new Date(space.bookingId.checkOut) < new Date();
        }
        return space.currentStatus === filters.status;
      });
      console.log('After status filter:', filtered.length, 'spaces');
    }

    // Sort
    if (filters.sort !== SORT_OPTIONS.DEFAULT) {
      filtered.sort((a, b) => {
        if (filters.sort === SORT_OPTIONS.PRICE_HIGH) {
          return b.basePrice - a.basePrice;
        }
        return a.basePrice - b.basePrice;
      });
      console.log('After sorting:', filtered.length, 'spaces');
    }

    return filtered;
  };

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (Array.isArray(spaces) && Array.isArray(categories)) {
      console.log('Data loaded successfully');
      setIsLoading(false);
    }
  }, [spaces, categories]);

  if (isLoading || !spaces || !categories) {
    return (
      <div className="flex justify-center items-center h-48">
        <p>Loading spaces...</p>
      </div>
    );
  }

  const filteredSpaces = filterSpaces(spaces);

  // Group spaces by category using string IDs
  const spacesByCategory = categories.map(category => ({
    category,
    spaces: filteredSpaces.filter(space => space.categoryId._id === category._id)
  }));

  console.log('Grouped spaces by category:', 
    spacesByCategory.map(({ category, spaces }) => ({
      categoryName: category.categoryName,
      spaceCount: spaces.length
    }))
  );

  return (
    <div className="space-y-6">
      <SearchAndFilters />
      
      {/* Only show Add Category button for admin */}
      {isAdmin && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowAddCategoryModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 
              transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Add Category
          </button>
        </div>
      )}

      {/* Category Sections */}
      {spacesByCategory.map(({ category, spaces: categorySpaces }) => (
        <div key={category._id} className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-gray-800">
                {category.categoryName}
              </h2>
              {/* Only show Add Space button for admin */}
              {isAdmin && (
                <button
                  onClick={() => handleAddSpace(category)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700
                    transition-colors flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Space
                </button>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {categorySpaces.length} spaces
              </span>
              {/* Only show Delete Category button for admin */}
              {isAdmin && (
                <button
                  onClick={() => setCategoryToDelete(category)}
                  className="p-2 text-red-600 hover:text-red-700 transition-colors"
                  title="Delete Category"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categorySpaces.length === 0 ? (
              <p className="text-gray-500 col-span-full">No spaces in this category</p>
            ) : (
              categorySpaces.map(space => (
                <SpaceCard 
                  key={space._id}
                  space={space}
                  category={category}
                />
              ))
            )}
          </div>
        </div>
      ))}

      {/* Empty State */}
      {categories.length === 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <p className="text-center text-gray-500">
            No categories available. Create a category to add spaces.
          </p>
        </div>
      )}

      {/* Only render admin modals if user is admin */}
      {isAdmin && (
        <>
          {showAddCategoryModal && (
            <CategoryModal onClose={() => setShowAddCategoryModal(false)} />
          )}

          {showAddSpaceModal && selectedCategory && (
            <AddSpaceModal
              category={selectedCategory}
              onClose={() => {
                setShowAddSpaceModal(false);
                setSelectedCategory(null);
              }}
            />
          )}

          {categoryToDelete && (
            <ConfirmationModal
              title="Delete Category"
              message={`Are you sure you want to delete ${categoryToDelete.categoryName}?`}
              onConfirm={handleDeleteCategory}
              onCancel={() => setCategoryToDelete(null)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default SpacesGrid;