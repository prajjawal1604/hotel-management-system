import React, { useState } from 'react';
import { useRoomsStore } from '../../../store/roomsStore';
import { Upload, Building2, Calendar, CreditCard, Users, PlusCircle, X, Loader2 } from 'lucide-react';
import TimeInput from '../../../components/CheckoutDateTimeInput';

// Document Upload Component
const DocumentUpload = ({ onUpload, title, disabled, isLoading }) => (
  <div className="mt-2">
    <label className="block text-sm font-medium text-gray-600 mb-2">{title}</label>
    <label 
      className={`flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg 
        ${!disabled && !isLoading ? 'hover:bg-blue-100 cursor-pointer' : 'opacity-50 cursor-not-allowed'} 
        transition-colors`}
    >
      {isLoading ? (
        <Loader2 size={20} className="animate-spin" />
      ) : (
        <Upload size={20} />
      )}
      <span>{isLoading ? 'Uploading...' : 'Upload Documents'}</span>
      <input
        type="file"
        onChange={onUpload}
        className="hidden"
        multiple
        accept="image/*, .pdf"
        disabled={disabled || isLoading}
      />
    </label>
  </div>
);

const BookingForm = ({ 
  formData, 
  setFormData, 
  space, 
  disabled = false,
  validationErrors = {} 
}) => {
  const [uploadingPrimary, setUploadingPrimary] = useState(false);
  const [uploadingAdditional, setUploadingAdditional] = useState(null);
  const [extraGuestCount, setExtraGuestCount] = useState(formData.extraGuestCount || 0);
  

  // Handle primary guest changes
  const handlePrimaryGuestChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle primary guest document upload
  const handlePrimaryGuestUpload = async (e) => {
    try {
      setUploadingPrimary(true);
      const files = Array.from(e.target.files);

      for (const file of files) {
        const result = await window.electron.storeDocument({
          originalPath: file.path,
          guestType: 'PRIMARY'
        });

        if (result.success) {
          setFormData(prev => ({
            ...prev,
            documents: [...(prev.documents || []), result.data]
          }));
        }
      }
    } catch (error) {
      console.error('Document store error:', error);
    } finally {
      setUploadingPrimary(false);
    }
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

  // Handle additional guest document upload
  const handleAdditionalGuestUpload = async (index, e) => {
    try {
      setUploadingAdditional(index);
      const files = Array.from(e.target.files);

      for (const file of files) {
        const result = await window.electron.storeDocument({
          originalPath: file.path,
          guestType: 'ADDITIONAL'
        });

        if (result.success) {
          const newGuests = [...formData.additionalGuests];
          newGuests[index] = {
            ...newGuests[index],
            documents: [...(newGuests[index].documents || []), result.data]
          };
          setFormData(prev => ({
            ...prev,
            additionalGuests: newGuests
          }));
        }
      }
    } catch (error) {
      console.error('Document store error:', error);
    } finally {
      setUploadingAdditional(null);
    }
  };

  const addAdditionalGuest = () => {
    // const totalGuests = 1 + formData.additionalGuests.length;
    // const maxGuests = space.maxOccupancy.adults + space.maxOccupancy.kids;

    // if (totalGuests >= maxGuests) {
    //   alert(`Maximum ${maxGuests} guests allowed (${space.maxOccupancy.adults} adults, ${space.maxOccupancy.kids} kids)`);
    //   return;
    // }

    setFormData(prev => ({
      ...prev,
      additionalGuests: [
        ...prev.additionalGuests,
        {
          fullName: '',
          phoneNumber: '',
          gender: '',
          age: 0,
          aadharNumber: '',
          isKid: false,
          documents: []
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
  const [isEditingCheckIn, setIsEditingCheckIn] = useState(false);
const [isEditingCheckOut, setIsEditingCheckOut] = useState(false);

 // Add this section in place of the Aadhar Number field
 const documentNumberField = (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-600">Document Number</label>
    <input
      type="text"
      value={formData.documentNumber}
      onChange={(e) => handlePrimaryGuestChange('documentNumber', e.target.value)}
      placeholder="Enter ID document number"
      disabled={disabled}
      className={`w-full px-4 py-2 rounded-lg border ${
        validationErrors.documentNumber ? 'border-red-500' : 'border-gray-200'
      } disabled:bg-gray-50 disabled:text-gray-500`}
    />
    {validationErrors.documentNumber && (
      <p className="text-sm text-red-600">{validationErrors.documentNumber}</p>
    )}
  </div>
);

// Add this near the Additional Guests section
const extraGuestSection = (
  <div className="flex justify-between items-center mb-6">
    <div className="flex items-center gap-4">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <Users size={20} />
        Additional Guests
      </h3>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">Extra Guests:</label>
        <input
          type="number"
          min="0"
          value={extraGuestCount}
          onChange={(e) => {
            const value = parseInt(e.target.value) || 0;
            setExtraGuestCount(value);
            handlePrimaryGuestChange('extraGuestCount', value);
          }}
          className="w-20 px-2 py-1 border rounded-md"
          placeholder="0"
          onWheel={(e) => e.target.blur()} // Disable scroll change
          onKeyDown={(e) => e.key === 'ArrowUp' || e.key === 'ArrowDown' ? e.preventDefault() : null} // Disable arrow keys
        />
      </div>
    </div>
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
);

// Add this new section for Extra Tariff
const extraTariffSection = (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mt-6">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">Extra Tariff</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-600">Amount</label>
        <input
          type="number"
          value={formData.extraTariff?.amount || ''}
          onChange={(e) => handlePrimaryGuestChange('extraTariff', {
            ...formData.extraTariff,
            amount: parseFloat(e.target.value) || 0
          })}
          placeholder="Enter amount"
          onWheel={(e) => e.target.blur()} // Disable scroll change
          onKeyDown={(e) => e.key === 'ArrowUp' || e.key === 'ArrowDown' ? e.preventDefault() : null} // Disable arrow keys
          className="w-full px-4 py-2 rounded-lg border border-gray-200"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-600">Remarks</label>
        <input
          type="text"
          value={formData.extraTariff?.remarks || ''}
          onChange={(e) => handlePrimaryGuestChange('extraTariff', {
            ...formData.extraTariff,
            remarks: e.target.value
          })}
          placeholder="Enter remarks"
          className="w-full px-4 py-2 rounded-lg border border-gray-200"
        />
      </div>
    </div>
    <div className="mt-4 text-sm text-gray-600">
      Total Guests: {extraGuestCount > 0 ? 1 + extraGuestCount : formData.additionalGuests.length}
    </div>
  </div>
);

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
            <label className="block text-sm font-medium text-gray-600">Age</label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => handlePrimaryGuestChange('age', e.target.value)}
              placeholder="Guest age"
              min="18"
              disabled={disabled}
              onWheel={(e) => e.target.blur()} // Disable scroll change
              onKeyDown={(e) => e.key === 'ArrowUp' || e.key === 'ArrowDown' ? e.preventDefault() : null} // Disable arrow keys
              className={`w-full px-4 py-2 rounded-lg border ${
                validationErrors.age ? 'border-red-500' : 'border-gray-200'
              } disabled:bg-gray-50 disabled:text-gray-500`}
            />
            {validationErrors.age && (
              <p className="text-sm text-red-600">{validationErrors.age}</p>
            )}
          </div>

          {documentNumberField}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Nationality</label>
            <input
              type="text"
              value={formData.nationality}
              onChange={(e) => handlePrimaryGuestChange('nationality', e.target.value)}
              placeholder="Enter nationality"
              disabled={disabled}
              className={`w-full px-4 py-2 rounded-lg border ${
                validationErrors.nationality ? 'border-red-500' : 'border-gray-200'
              } disabled:bg-gray-50 disabled:text-gray-500`}
            />
            {validationErrors.nationality && (
              <p className="text-sm text-red-600">{validationErrors.nationality}</p>
            )}
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-600">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => handlePrimaryGuestChange('address', e.target.value)}
              placeholder="Enter permanent address"
              rows="2"
              disabled={disabled}
              className={`w-full px-4 py-2 rounded-lg border ${
                validationErrors.address ? 'border-red-500' : 'border-gray-200'
              } disabled:bg-gray-50 disabled:text-gray-500`}
            />
            {validationErrors.address && (
              <p className="text-sm text-red-600">{validationErrors.address}</p>
            )}
          </div>

          {/* Document Upload for Primary Guest */}
          <div className="col-span-2">
            <DocumentUpload 
              onUpload={handlePrimaryGuestUpload}
              title="Upload Guest Documents"
              disabled={disabled}
              isLoading={uploadingPrimary}
            />
            {formData.documents?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.documents.map((doc, idx) => (
                  <div key={idx} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm flex items-center gap-1">
                    {doc.originalName}
                    {!disabled && (
                      <button
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            documents: prev.documents.filter((_, i) => i !== idx)
                          }));
                        }}
                        className="ml-1 text-blue-400 hover:text-blue-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Additional Guests */}
      
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      {extraGuestSection}

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
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-600">Age</label>
                <input
                  type="number"
                  value={guest.age}
                  onChange={(e) => handleAdditionalGuestChange(index, 'age', e.target.value)}
                  placeholder="Guest age"
                  min="0"
                  disabled={disabled}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-600">Aadhar Number</label>
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

              {/* Document Upload for Additional Guest */}
              <div className="col-span-2 mt-4">
                <DocumentUpload 
                  onUpload={(e) => handleAdditionalGuestUpload(index, e)}
                  title="Upload Guest Documents"
                  disabled={disabled}
                  isLoading={uploadingAdditional === index}
                />
                {guest.documents?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {guest.documents.map((doc, idx) => (
                      <div key={idx} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm flex items-center gap-1">
                        {doc.originalName}
                        {!disabled && (
                          <button
                            onClick={() => {
                              const newGuests = [...formData.additionalGuests];
                              newGuests[index] = {
                                ...newGuests[index],
                                documents: guest.documents.filter((_, i) => i !== idx)
                              };
                              setFormData(prev => ({
                                ...prev,
                                additionalGuests: newGuests
                              }));
                            }}
                            className="ml-1 text-blue-400 hover:text-blue-600"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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

      {/* Advance Amount */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <CreditCard size={20} />
          Advance Amount
        </h3>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-600">Advance Amount</label>
          <input
            type="number"
            value={formData.advanceAmount}
            onChange={(e) => handlePrimaryGuestChange('advanceAmount', e.target.value)}
            placeholder="Enter advance amount"
            min="0"
            disabled={disabled}
            onWheel={(e) => e.target.blur()} // Disable scroll change
            onKeyDown={(e) => e.key === 'ArrowUp' || e.key === 'ArrowDown' ? e.preventDefault() : null} // Disable arrow keys
            className={`w-full px-4 py-2 rounded-lg border ${
              validationErrors.advanceAmount ? 'border-red-500' : 'border-gray-200'
            } disabled:bg-gray-50 disabled:text-gray-500`}
          />
          {validationErrors.advanceAmount && (
            <p className="text-sm text-red-600">{validationErrors.advanceAmount}</p>
          )}
        </div>
      </div>
      {extraTariffSection}
    </div>
  );
};

export default BookingForm;