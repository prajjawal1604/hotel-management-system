// components/spaces/SpacesGrid.jsx
import { useState, useEffect } from 'react';
import { useRoomsStore } from '../../../store/roomsStore.js';
import SpaceCard from './SpaceCard';

const SpacesGrid = () => {
  const spaces = useRoomsStore(state => state.spaces);
  const categories = useRoomsStore(state => state.categories);
  console.log('SpacesGrid rendering with:', { spaces, categories }); // Debug log

  // Add loading state
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {

    if (Array.isArray(spaces) && Array.isArray(categories)) {
      setIsLoading(false);
    }
  }, [spaces, categories]);

  

    // Show loading until we have data
  if (isLoading || !spaces || !categories) {
    return (
      <div className="flex justify-center items-center h-48">
        <p>Loading spaces...</p>
      </div>
    );
  }

  console.log('Data received:', {
    spacesLength: spaces.length,
    categoriesLength: categories.length,
    sampleSpace: spaces[0],
    sampleCategory: categories[0]
  });

  // Group spaces by category
  const spacesByCategory = categories.map(category => ({
    category,
    spaces: spaces.filter(space => {
      const spaceId = space.categoryId?._id?.buffer;
      const categoryId = category._id?.buffer;
      if (!spaceId || !categoryId) return false;
      
      // Compare buffer values
      return Object.keys(spaceId).every(key => 
        spaceId[key] === categoryId[key]
      );
    })
  }));  

  return (
    <div className="space-y-6">
      {spacesByCategory.map(({ category, spaces: categorySpaces }) => (
        <div key={category._id} className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {category.categoryName}
            </h2>
            <span className="text-sm text-gray-500">
              {categorySpaces.length} spaces
            </span>
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

      {categories.length === 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <p className="text-center text-gray-500">
            No categories available. Create a category to add spaces.
          </p>
        </div>
      )}
    </div>
  );
};

export default SpacesGrid;