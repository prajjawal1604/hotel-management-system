// components/modals/AddSpaceModal.jsx
import { useState } from 'react'
import { X } from 'lucide-react'
import { useRoomsStore } from '../../../store/roomsStore'

const SPACE_TYPES = ['NON A/C', 'A/C', 'SUIT', 'DELUX']

const AddSpaceModal = ({ category, onClose }) => {
  const setSpaces = useRoomsStore((state) => state.setSpaces)

  // Initialize form state
  const [formData, setFormData] = useState({
    spaceName: '',
    spaceType: 'NON A/C',
    basePrice: '',
    maxOccupancy: {
      adults: '',
      kids: ''
    }
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Validate and process form data
  const validateFormData = () => {
    if (!formData.spaceName.trim()) {
      throw new Error('Space name is required')
    }
    if (!formData.basePrice || Number(formData.basePrice) <= 0) {
      throw new Error('Valid base price is required')
    }
    if (!formData.maxOccupancy.adults || Number(formData.maxOccupancy.adults) < 1) {
      throw new Error('At least 1 adult occupancy is required')
    }
    if (formData.maxOccupancy.kids === '' || Number(formData.maxOccupancy.kids) < 0) {
      throw new Error('Kids occupancy must be 0 or greater')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
        const spaceData = {
            spaceName: formData.spaceName.trim(),
            spaceType: formData.spaceType,
            categoryId: category._id,
            basePrice: parseInt(formData.basePrice, 10),
            maxOccupancy: {
                adults: parseInt(formData.maxOccupancy.adults, 10),
                kids: parseInt(formData.maxOccupancy.kids, 10)
            },
            currentStatus: 'AVAILABLE'
        };

        console.log('Add Space - Sending data:', spaceData);

        const result = await window.electron.addSpace(spaceData);
        
        console.log('Add Space - Response:', result);

        if (result.success && result.spaces) {
            setSpaces(result.spaces);
            onClose();
        } else {
            // If space was created but population failed, close modal and let parent refresh
            if (result.data && result.data._id) {
                console.log('Space created but population failed, closing modal');
                onClose();
                return;
            }
            throw new Error(result.message || 'Failed to add space');
        }
    } catch (error) {
        console.error('Add Space - Error:', error);
        setError(error.message || 'Failed to add space. Please try again.');
    } finally {
        setIsLoading(false);
    }
};

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name.includes('maxOccupancy.')) {
      const [_, field] = name.split('.')
      setFormData((prev) => ({
        ...prev,
        maxOccupancy: {
          ...prev.maxOccupancy,
          [field]: value
        }
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }))
    }

    // Clear error when user starts typing
    if (error) setError('')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                    aria-label="Close modal"
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold mb-6">Add Space to {category.categoryName}</h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md" role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Space Name</label>
            <input
              type="text"
              name="spaceName"
              value={formData.spaceName}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              name="spaceType"
              value={formData.spaceType}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              {SPACE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base Price (per night)
            </label>
            <input
              type="number"
              name="basePrice"
              value={formData.basePrice}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              required
              min="0"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Adults</label>
              <input
                type="number"
                name="maxOccupancy.adults"
                value={formData.maxOccupancy.adults}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
                required
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Kids</label>
              <input
                type="number"
                name="maxOccupancy.kids"
                value={formData.maxOccupancy.kids}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
                required
                min="0"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md 
                          hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Adding...' : 'Add Space'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AddSpaceModal
