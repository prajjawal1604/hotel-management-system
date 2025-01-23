import React, { useState } from 'react';
import { User, Calendar } from 'lucide-react';
import TimeInput from '../../../components/CheckoutDateTimeInput';
import { useRoomsStore } from '../../../store/roomsStore';


const AdvancedBookingForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    // Primary Guest Details
    fullName: '',
    phoneNumber: '',
    gender: '',
    age: null,
    documentNumber: '',
    // Booking Details
    checkIn: '',
    checkOut: '',
    advanceAmount: 0,
    extraGuestCount: 0,
  });

  

  const [validationErrors, setValidationErrors] = useState({});
   const [extraGuestCount, setExtraGuestCount] = useState(formData.extraGuestCount || 0);

  // Handle input changes
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear validation error when field is edited
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Validation
  const validateForm = () => {
    const errors = {};
    
    if (!formData.fullName?.trim()) errors.fullName = 'Name is required';
    if (!formData.phoneNumber?.trim()) errors.phoneNumber = 'Phone number is required';
    if (!/^\d{10}$/.test(formData.phoneNumber)) errors.phoneNumber = 'Invalid phone number';
    if (!formData.gender) errors.gender = 'Gender is required';
    if (!formData.checkIn) errors.checkIn = 'Check-in date is required';
    if (!formData.checkOut) errors.checkOut = 'Check-out date is required';
    if (new Date(formData.checkOut) <= new Date(formData.checkIn)) {
      errors.checkOut = 'Check-out must be after check-in';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        ...formData,
        bookingType: 'ADVANCE',
        status: 'ONGOING'
      });

      // Get updated room data to reflect changes
            const roomData = await window.electron.getRoomData();
              
            if (roomData.success) {
              useRoomsStore.getState().setSpaces(roomData.data.spaces);
              useRoomsStore.getState().setStats(roomData.data.stats);
            }
    } catch (error) {
      setValidationErrors({
        submit: error.message || 'Failed to submit booking'
      });
    }
  };
  const handlePrimaryGuestChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const [isEditingCheckIn, setIsEditingCheckIn] = useState(false);
  const [isEditingCheckOut, setIsEditingCheckOut] = useState(false);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Primary Guest Details */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <User size={20} />
          Guest Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Full Name*</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              placeholder="Enter guest name"
              className={`w-full px-4 py-2 rounded-lg border ${
                validationErrors.fullName ? 'border-red-500' : 'border-gray-200'
              }`}
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
              onChange={(e) => handleChange('phoneNumber', e.target.value)}
              placeholder="10-digit phone number"
              maxLength={10}
              className={`w-full px-4 py-2 rounded-lg border ${
                validationErrors.phoneNumber ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {validationErrors.phoneNumber && (
              <p className="text-sm text-red-600">{validationErrors.phoneNumber}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Gender*</label>
            <select
              value={formData.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${
                validationErrors.gender ? 'border-red-500' : 'border-gray-200'
              }`}
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
            <label className="block text-sm font-medium text-gray-600">Document Number</label>
            <input
              type="text"
              value={formData.documentNumber}
              onChange={(e) => handleChange('documentNumber', e.target.value)}
              placeholder="Enter Document ID" 
              className={`w-full px-4 py-2 rounded-lg border border-gray-200`}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Age</label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => handleChange('age', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200"
            />
          </div>
          

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Advance Amount</label>
            <input
              type="number"
              value={formData.advanceAmount}
              onChange={(e) => handleChange('advanceAmount', e.target.value)}
              min="0"
              className="w-full px-4 py-2 rounded-lg border border-gray-200"
            />
          </div>

          <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">Extra Guests:</label>
        <input
          type="number"
          min="0"
          value={formData.extraGuestCount}          
          onChange={(e) => handleChange('extraGuestCount', e.target.value)}
          className="w-20 px-2 py-1 border rounded-md"
          placeholder="0"
          onWheel={(e) => e.target.blur()} // Disable scroll change
          onKeyDown={(e) => e.key === 'ArrowUp' || e.key === 'ArrowDown' ? e.preventDefault() : null} // Disable arrow keys
        />
      </div>
        </div>
      </div>

      {/* Booking Details */}

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
      <TimeInput
        value={formData.checkIn}
        isEditing={isEditingCheckIn}
        onSave={(newDateTime) => {
          // Convert Date object to ISO string for consistent storage
          const isoString = newDateTime instanceof Date ? 
            newDateTime.toISOString() : 
            new Date(newDateTime).toISOString();
          handlePrimaryGuestChange('checkIn', isoString);
          setIsEditingCheckIn(false);
        }}
        onEditClick={() => setIsEditingCheckIn(true)}
      />
      {validationErrors.checkIn && (
        <p className="text-sm text-red-600">{validationErrors.checkIn}</p>
      )}
    </div>

    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-600">
        Check-out Date & Time*
      </label>
      <TimeInput
        value={formData.checkOut}
        isEditing={isEditingCheckOut}
        onSave={(newDateTime) => {
          // Convert Date object to ISO string for consistent storage
          const isoString = newDateTime instanceof Date ? 
            newDateTime.toISOString() : 
            new Date(newDateTime).toISOString();
          handlePrimaryGuestChange('checkOut', isoString);
          setIsEditingCheckOut(false);
        }}
        onEditClick={() => setIsEditingCheckOut(true)}
      />
      {validationErrors.checkOut && (
        <p className="text-sm text-red-600">{validationErrors.checkOut}</p>
      )}
    </div>
  </div>
  </div>

      {/* <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar size={20} />
          Booking Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Check-in Date & Time*</label>
            <input
              type="datetime-local"
              value={formData.checkIn}
              onChange={(e) => handleChange('checkIn', e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${
                validationErrors.checkIn ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {validationErrors.checkIn && (
              <p className="text-sm text-red-600">{validationErrors.checkIn}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Check-out Date & Time*</label>
            <input
              type="datetime-local"
              value={formData.checkOut}
              onChange={(e) => handleChange('checkOut', e.target.value)}
              min={formData.checkIn}
              className={`w-full px-4 py-2 rounded-lg border ${
                validationErrors.checkOut ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {validationErrors.checkOut && (
              <p className="text-sm text-red-600">{validationErrors.checkOut}</p>
            )}
          </div>
        </div>
      </div> */}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
            transition-colors"
        >
          Create Advance Booking
        </button>
      </div>

      {validationErrors.submit && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          {validationErrors.submit}
        </div>
      )}
    </form>
  );
};

export default AdvancedBookingForm;