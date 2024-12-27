import React from 'react';
import { useRoomsStore } from '../../../store/roomsStore';
import { Building2, Calendar, CreditCard, Users, PlusCircle, X } from 'lucide-react';

const BookingForm = ({ 
  formData, 
  setFormData, 
  space, 
  disabled = false,
  validationErrors = {} 
}) => {
  // Handle primary guest changes
  const handlePrimaryGuestChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle additional guest changes
  const handleAdditionalGuestChange = (index, field, value) => {
    const newGuests = [...formData.additionalGuests];
    newGuests[index] = {
      ...newGuests[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      additionalGuests: newGuests
    }));
  };

  const addAdditionalGuest = () => {
    const totalGuests = 1 + formData.additionalGuests.length;
    const maxGuests = space.maxOccupancy.adults + space.maxOccupancy.kids;

    if (totalGuests >= maxGuests) {
      alert(`Maximum ${maxGuests} guests allowed (${space.maxOccupancy.adults} adults, ${space.maxOccupancy.kids} kids)`);
      return;
    }

    setFormData(prev => ({
      ...prev,
      additionalGuests: [
        ...prev.additionalGuests,
        {
          fullName: '',
          phoneNumber: '',
          gender: '',
          age: '',
          aadharNumber: '',
          isKid: false
        }
      ]
    }));
  };

  const removeAdditionalGuest = (index) => {
    setFormData(prev => ({
      ...prev,
      additionalGuests: prev.additionalGuests.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-8">
      {/* Room Details Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <CreditCard size={20} />
          Room Details
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Category</label>
            <div className="text-lg font-semibold text-gray-800">
              {space.categoryId.categoryName}
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Room Number</label>
            <div className="text-lg font-semibold text-gray-800">{space.spaceName}</div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Room Type</label>
            <div className="text-lg font-semibold text-gray-800">{space.spaceType}</div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Base Price per Night</label>
            <div className="text-lg font-semibold text-green-600">₹{space.basePrice}</div>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Max Occupancy: {space.maxOccupancy.adults} Adults, {space.maxOccupancy.kids} Kids
        </div>
      </div>

      {/* Booking Time Selection */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar size={20} />
          Booking Duration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">
              Check-in Date & Time*
            </label>
            <input
              type="datetime-local"
              value={formData.checkIn}
              onChange={(e) => handlePrimaryGuestChange('checkIn', e.target.value)}
              disabled={disabled}
              className={`w-full px-4 py-2 rounded-lg border ${
                validationErrors.checkIn ? 'border-red-500' : 'border-gray-200'
              } disabled:bg-gray-50 disabled:text-gray-500`}
              required
            />
            {validationErrors.checkIn && (
              <p className="text-sm text-red-600">{validationErrors.checkIn}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">
              Check-out Date & Time*
            </label>
            <input
              type="datetime-local"
              value={formData.checkOut}
              onChange={(e) => handlePrimaryGuestChange('checkOut', e.target.value)}
              min={formData.checkIn}
              disabled={disabled}
              className={`w-full px-4 py-2 rounded-lg border ${
                validationErrors.checkOut ? 'border-red-500' : 'border-gray-200'
              } disabled:bg-gray-50 disabled:text-gray-500`}
              required
            />
            {validationErrors.checkOut && (
              <p className="text-sm text-red-600">{validationErrors.checkOut}</p>
            )}
          </div>
        </div>
      </div>

      {/* Primary Guest Details */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Users size={20} />
          Primary Guest Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Full Name*</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handlePrimaryGuestChange('fullName', e.target.value)}
              placeholder="Enter guest name"
              disabled={disabled}
              className={`w-full px-4 py-2 rounded-lg border ${
                validationErrors.fullName ? 'border-red-500' : 'border-gray-200'
              } disabled:bg-gray-50 disabled:text-gray-500`}
              required
            />
            {validationErrors.fullName && (
              <p className="text-sm text-red-600">{validationErrors.fullName}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Phone Number*</label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handlePrimaryGuestChange('phoneNumber', e.target.value)}
              placeholder="10-digit phone number"
              maxLength={10}
              disabled={disabled}
              className={`w-full px-4 py-2 rounded-lg border ${
                validationErrors.phoneNumber ? 'border-red-500' : 'border-gray-200'
              } disabled:bg-gray-50 disabled:text-gray-500`}
              required
            />
            {validationErrors.phoneNumber && (
              <p className="text-sm text-red-600">{validationErrors.phoneNumber}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Gender*</label>
            <select
              value={formData.gender}
              onChange={(e) => handlePrimaryGuestChange('gender', e.target.value)}
              disabled={disabled}
              className={`w-full px-4 py-2 rounded-lg border ${
                validationErrors.gender ? 'border-red-500' : 'border-gray-200'
              } disabled:bg-gray-50 disabled:text-gray-500`}
              required
            >
              <option value="">Select Gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
            {validationErrors.gender && (
              <p className="text-sm text-red-600">{validationErrors.gender}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Age*</label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => handlePrimaryGuestChange('age', e.target.value)}
              placeholder="Guest age"
              min="18"
              disabled={disabled}
              className={`w-full px-4 py-2 rounded-lg border ${
                validationErrors.age ? 'border-red-500' : 'border-gray-200'
              } disabled:bg-gray-50 disabled:text-gray-500`}
              required
            />
            {validationErrors.age && (
              <p className="text-sm text-red-600">{validationErrors.age}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Aadhar Number*</label>
            <input
              type="text"
              value={formData.aadharNumber}
              onChange={(e) => handlePrimaryGuestChange('aadharNumber', e.target.value)}
              placeholder="12-digit Aadhar number"
              maxLength={12}
              disabled={disabled}
              className={`w-full px-4 py-2 rounded-lg border ${
                validationErrors.aadharNumber ? 'border-red-500' : 'border-gray-200'
              } disabled:bg-gray-50 disabled:text-gray-500`}
              required
            />
            {validationErrors.aadharNumber && (
              <p className="text-sm text-red-600">{validationErrors.aadharNumber}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Nationality*</label>
            <input
              type="text"
              value={formData.nationality}
              onChange={(e) => handlePrimaryGuestChange('nationality', e.target.value)}
              placeholder="Enter nationality"
              disabled={disabled}
              className={`w-full px-4 py-2 rounded-lg border ${
                validationErrors.nationality ? 'border-red-500' : 'border-gray-200'
              } disabled:bg-gray-50 disabled:text-gray-500`}
              required
            />
            {validationErrors.nationality && (
              <p className="text-sm text-red-600">{validationErrors.nationality}</p>
            )}
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-600">Address*</label>
            <textarea
              value={formData.address}
              onChange={(e) => handlePrimaryGuestChange('address', e.target.value)}
              placeholder="Enter permanent address"
              rows="2"
              disabled={disabled}
              className={`w-full px-4 py-2 rounded-lg border ${
                validationErrors.address ? 'border-red-500' : 'border-gray-200'
              } disabled:bg-gray-50 disabled:text-gray-500`}
              required
            />
            {validationErrors.address && (
              <p className="text-sm text-red-600">{validationErrors.address}</p>
            )}
          </div>
        </div>
      </div>

      {/* Company Details */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Building2 size={20} />
          Company Details (Optional)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Company Name</label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => handlePrimaryGuestChange('companyName', e.target.value)}
              placeholder="Enter company name"
              disabled={disabled}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">GSTIN</label>
            <input
              type="text"
              value={formData.gstin}
              onChange={(e) => handlePrimaryGuestChange('gstin', e.target.value)}
              placeholder="Enter GSTIN"
              disabled={disabled}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Designation</label>
            <input
              type="text"
              value={formData.designation}
              onChange={(e) => handlePrimaryGuestChange('designation', e.target.value)}
              placeholder="Enter designation"
              disabled={disabled}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Purpose of Visit</label>
            <input
              type="text"
              value={formData.purposeOfVisit}
              onChange={(e) => handlePrimaryGuestChange('purposeOfVisit', e.target.value)}
              placeholder="Enter purpose of visit"
              disabled={disabled}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Additional Guests */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Users size={20} />
            Additional Guests
          </h3>
          {!disabled && (
            <button
              type="button"
              onClick={addAdditionalGuest}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <PlusCircle size={20} />
              Add Guest
            </button>
          )}
        </div>

        {formData.additionalGuests.map((guest, index) => (
          <div key={index} className="mb-6 p-6 border rounded-lg bg-gray-50 relative">
            {!disabled && (
              <button
                type="button"
                onClick={() => removeAdditionalGuest(index)}
                className="absolute right-4 top-4 p-1 text-gray-400 hover:text-red-600 transition-colors"
              >
                <X size={18} />
              </button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-600">Full Name*</label>
                <input
                  type="text"
                  value={guest.fullName}
                  onChange={(e) => handleAdditionalGuestChange(index, 'fullName', e.target.value)}
                  placeholder="Enter guest name"
                  disabled={disabled}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    validationErrors[`additionalGuest.${index}.fullName`] ? 'border-red-500' : 'border-gray-200'
                  } disabled:bg-gray-50 disabled:text-gray-500`}
                  required
                />
                {validationErrors[`additionalGuest.${index}.fullName`] && (
                  <p className="text-sm text-red-600">{validationErrors[`additionalGuest.${index}.fullName`]}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-600">Phone Number</label>
                <input
                  type="tel"
                  value={guest.phoneNumber}
                  onChange={(e) => handleAdditionalGuestChange(index, 'phoneNumber', e.target.value)}
                  placeholder="10-digit phone number"
                  maxLength={10}
                  disabled={disabled}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-600">Gender*</label>
                <select
                  value={guest.gender}
                  onChange={(e) => handleAdditionalGuestChange(index, 'gender', e.target.value)}
                  disabled={disabled}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 disabled:bg-gray-50 disabled:text-gray-500"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-600">Age*</label>
                <input
                  type="number"
                  value={guest.age}
                  onChange={(e) => handleAdditionalGuestChange(index, 'age', e.target.value)}
                  placeholder="Guest age"
                  min="0"
                  disabled={disabled}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 disabled:bg-gray-50 disabled:text-gray-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-600">Aadhar Number*</label>
                <input
                  type="text"
                  value={guest.aadharNumber}
                  onChange={(e) => handleAdditionalGuestChange(index, 'aadharNumber', e.target.value)}
                  placeholder="12-digit Aadhar number"
                  maxLength={12}
                  disabled={disabled}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    validationErrors[`additionalGuest.${index}.aadharNumber`] ? 'border-red-500' : 'border-gray-200'
                  } disabled:bg-gray-50 disabled:text-gray-500`}
                  required
                />
                {validationErrors[`additionalGuest.${index}.aadharNumber`] && (
                  <p className="text-sm text-red-600">{validationErrors[`additionalGuest.${index}.aadharNumber`]}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`kid-${index}`}
                  checked={guest.isKid}
                  onChange={(e) => handleAdditionalGuestChange(index, 'isKid', e.target.checked)}
                  disabled={disabled}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor={`kid-${index}`} className="text-sm font-medium text-gray-600">
                  Is Child (below 12 years)
                </label>
              </div>
            </div>
          </div>
        ))}

        {formData.additionalGuests.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No additional guests added. Click "Add Guest" to add dependants.
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingForm;