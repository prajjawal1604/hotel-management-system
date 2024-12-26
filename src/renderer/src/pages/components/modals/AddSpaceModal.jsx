// components/modals/AddSpaceModal.jsx
import { useState } from 'react';
import { X } from 'lucide-react';
import { useRoomsStore } from '../../../store/roomsStore';

const SPACE_TYPES = ["NON A/C", "A/C", "SUIT", "DELUX"];

const AddSpaceModal = ({ category, onClose }) => {
    const setSpaces = useRoomsStore(state => state.setSpaces);
    const [formData, setFormData] = useState({
        spaceName: '',
        spaceType: 'NON A/C',
        basePrice: '',
        maxOccupancy: {
            adults: '',
            kids: ''
        }
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Debugging: Log category._id type and value
            console.log('category._id type:', typeof category._id);
            console.log('category._id value:', category._id);

            // Ensure category._id is a valid ObjectId string
            let categoryId = '';

            if (typeof category._id === 'string') {
                categoryId = category._id;
            } else if (category._id && category._id.toString) {
                categoryId = category._id.toString();
            } else {
                throw new Error('Invalid categoryId format');
            }

            // Additional Debugging: Log the converted categoryId
            console.log('Converted categoryId:', categoryId);

            // Check if categoryId was successfully converted
            if (!categoryId || categoryId === '[object Object]') {
                throw new Error('Invalid categoryId');
            }

            const spaceData = {
                ...formData,
                categoryId, // Use the valid string
                basePrice: Number(formData.basePrice),
                maxOccupancy: {
                    adults: Number(formData.maxOccupancy.adults),
                    kids: Number(formData.maxOccupancy.kids)
                }
            };

            console.log('Sending spaceData to main process:', spaceData); // Debugging

            const result = await window.electron.addSpace(spaceData);
            if (result.success) {
                setSpaces(result.spaces);
                onClose();
            } else {
                setError(result.message || 'Failed to add space');
            }
        } catch (error) {
            setError(error.message || 'An error occurred while adding space');
            console.error('AddSpaceModal submit error:', error); // Debugging
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('maxOccupancy.')) {
            const [_, field] = name.split('.');
            setFormData(prev => ({
                ...prev,
                maxOccupancy: {
                    ...prev.maxOccupancy,
                    [field]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
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

                <h2 className="text-xl font-bold mb-6">Add Space to {category.categoryName}</h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Space Name
                        </label>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type
                        </label>
                        <select
                            name="spaceType"
                            value={formData.spaceType}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded-md"
                            required
                        >
                            {SPACE_TYPES.map(type => (
                                <option key={type} value={type}>{type}</option>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Max Adults
                            </label>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Max Kids
                            </label>
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
    );

};

export default AddSpaceModal;
