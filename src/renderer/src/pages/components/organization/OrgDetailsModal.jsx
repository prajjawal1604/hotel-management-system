import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useRoomsStore } from '../../../store/roomsStore'

const OrgDetailsModal = ({ onClose }) => {
  const orgDetails = useRoomsStore((state) => state.orgDetails) || {}
  const setOrgDetails = useRoomsStore((state) => state.setOrgDetails)

  // Update initial state
  const [formData, setFormData] = useState({
    orgName: orgDetails.orgName || '',
    email: orgDetails.email || '',
    gstNumber: orgDetails.gstNumber || '',
    gst: orgDetails.gst || 0 // Default to 0 for number
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Log initial data
  useEffect(() => {
    console.log('Org Details Modal - Initial data:', {
      currentDetails: orgDetails,
      formData
    })
  }, [])

  const validateForm = () => {
    if (!formData.orgName.trim()) {
      throw new Error('Organization name is required')
    }
    if (!formData.email.trim()) {
      throw new Error('Email is required')
    }
    if (!formData.gstNumber.trim()) {
      throw new Error('GSTIN is required')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      throw new Error('Invalid email format')
    }

    // Validate GST percentage
    const gstValue = Number(formData.gst)
    if (isNaN(gstValue) || gstValue < 0 || gstValue > 100) {
      throw new Error('GST percentage must be between 0 and 100')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      console.log('Org Details - Submitting update:', formData)

      validateForm()

      const processedData = {
        ...formData,
        gst: Number(formData.gst), // Ensure GST is sent as number
        lastUpdated: new Date()
      }

      console.log('Org Details - Processed data:', processedData)

      const result = await window.electron.updateOrgDetails(processedData)
      console.log('Org Details - Update response:', result)

      if (result.success) {
        console.log('Org Details - Update successful:', result.data)
        setOrgDetails(result.data)
        onClose()
      } else {
        throw new Error(result.message || 'Failed to update details')
      }
    } catch (error) {
      console.error('Org Details - Update error:', error)
      setError(error.message || 'An error occurred while updating')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user makes changes
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

        <h2 className="text-xl font-bold mb-6">Organization Details</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md" role="alert">
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
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
            <input
              type="text"
              name="gstNumber"
              value={formData.gstNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              required
              maxLength={15}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GST Percentage</label>
            <input
              type="number"
              name="gst"
              value={formData.gst}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              required
              min="0"
              max="100"
              step="0.01"
              placeholder="Enter GST percentage (0-100)"
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
  )
}

export default OrgDetailsModal
