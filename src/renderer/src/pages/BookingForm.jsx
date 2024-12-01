import { PlusCircle, X, Calendar, Building2, Users, CreditCard, Upload, Trash2 } from 'lucide-react';

const BookingForm = ({ room, formData, setFormData, validationErrors = {} }) => {
  const isEditingDisabled = room.status === 'Occupied' || room.status === 'CheckoutPending';

  const handleDependantChange = (index, field, value) => {
    const newDependants = [...formData.dependants];
    newDependants[index] = {
      ...newDependants[index],
      [field]: value,
    };
    setFormData({ ...formData, dependants: newDependants });
  };

  const handleFileUpload = (isGuest, guestIndex, files) => {
    const paths = Array.from(files).map(file => file.path);
    
    if (!isGuest) {
      setFormData(prev => ({
        ...prev,
        uploads: [...(prev.uploads || []), ...paths]
      }));
    } else {
      const newDependants = [...formData.dependants];
      newDependants[guestIndex] = {
        ...newDependants[guestIndex],
        uploads: [...(newDependants[guestIndex].uploads || []), ...paths]
      };
      setFormData(prev => ({
        ...prev,
        dependants: newDependants
      }));
    }
  };

  const removeFile = (isGuest, guestIndex, fileIndex) => {
    if (!isGuest) {
      setFormData(prev => ({
        ...prev,
        uploads: prev.uploads.filter((_, i) => i !== fileIndex)
      }));
    } else {
      const newDependants = [...formData.dependants];
      newDependants[guestIndex] = {
        ...newDependants[guestIndex],
        uploads: newDependants[guestIndex].uploads.filter((_, i) => i !== fileIndex)
      };
      setFormData(prev => ({
        ...prev,
        dependants: newDependants
      }));
    }
  };

  const addDependant = () => {
    const maxPeople = room.maxPeople.adults + room.maxPeople.kids;
    if (formData.dependants.length >= maxPeople - 1) {
      alert(`Maximum ${maxPeople} people allowed including primary guest`);
      return;
    }

    setFormData({
      ...formData,
      dependants: [
        ...formData.dependants,
        {
          name: '',
          phone_no: '',
          gender: '',
          aadhar: '',
          age: '',
          kid: false,
          uploads: [],
        },
      ],
    });
  };

  const removeDependant = (index) => {
    setFormData({
      ...formData,
      dependants: formData.dependants.filter((_, i) => i !== index),
    });
  };

  const InputField = ({ label, error, ...props }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-600">
        {label}
        {props.required && '*'}
      </label>
      <input
        {...props}
        className={`w-full px-4 py-2 rounded-lg border ${
          error ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'
        } focus:border-transparent`}
      />
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );

  const SelectField = ({ label, error, children, ...props }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-600">
        {label}
        {props.required && '*'}
      </label>
      <select
        {...props}
        className={`w-full px-4 py-2 rounded-lg border ${
          error ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'
        } focus:border-transparent`}
      >
        {children}
      </select>
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );

  const FileUploadSection = ({ isGuest = false, guestIndex = -1, uploads = [] }) => (
    <div className="col-span-2">
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-600">Documents</label>
          <input
            type="file"
            id={`file-upload-${isGuest ? `guest-${guestIndex}` : 'primary'}`}
            className="hidden"
            multiple
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => handleFileUpload(isGuest, guestIndex, e.target.files)}
          />
          <label
            htmlFor={`file-upload-${isGuest ? `guest-${guestIndex}` : 'primary'}`}
            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 
              cursor-pointer flex items-center gap-2 transition-colors"
          >
            <Upload size={16} />
            Upload Files
          </label>
        </div>

        {uploads?.length > 0 && (
          <div className="space-y-2">
            {uploads.map((path, index) => (
              <div key={index} 
                className="flex items-center justify-between p-2 bg-white 
                  rounded-lg border border-gray-200 group"
              >
                <span className="text-sm text-gray-600 truncate flex-1">
                  {path.split('\\').pop()}
                </span>
                <button
                  onClick={() => removeFile(isGuest, guestIndex, index)}
                  className="text-gray-400 hover:text-red-600 p-1 opacity-0 
                    group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
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
            <label className="block text-sm font-medium text-gray-600">Floor/Category</label>
            <div className="text-lg font-semibold text-gray-800">{room.categoryName}</div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Room Number</label>
            <div className="text-lg font-semibold text-gray-800">{room.name}</div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Room Type</label>
            <div className="text-lg font-semibold text-gray-800">{room.type}</div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Base Price per Night</label>
            <div className="text-lg font-semibold text-green-600">₹{room.basePricePerNight}</div>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Max Occupancy: {room.maxPeople.adults} Adults, {room.maxPeople.kids} Kids
        </div>
      </div>

      {/* Booking Time Selection */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar size={20} />
          Booking Duration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="Check-in Date & Time"
            type="datetime-local"
            value={formData.checkin}
            onChange={(e) => setFormData({ ...formData, checkin: e.target.value })}
            disabled={isEditingDisabled}
            required
            error={validationErrors.checkin}
          />

          <InputField
            label="Check-out Date & Time"
            type="datetime-local"
            value={formData.checkout}
            onChange={(e) => setFormData({ ...formData, checkout: e.target.value })}
            min={formData.checkin}
            disabled={isEditingDisabled}
            required
            error={validationErrors.checkout}
          />
        </div>
      </div>

      {/* Primary Guest Details */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Users size={20} />
          Primary Guest Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="Full Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter guest name"
            required
            error={validationErrors.name}
          />

          <InputField
            label="Phone Number"
            type="tel"
            value={formData.phone_no}
            onChange={(e) => setFormData({ ...formData, phone_no: e.target.value })}
            placeholder="10-digit phone number"
            maxLength={10}
            required
            error={validationErrors.phone_no}
          />

          <SelectField
            label="Gender"
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            required
            error={validationErrors.gender}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </SelectField>

          <InputField
            label="Age"
            type="number"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            placeholder="Guest age"
            min="18"
            required
            error={validationErrors.age}
          />

          <InputField
            label="Aadhar Number"
            type="text"
            value={formData.aadhar}
            onChange={(e) => setFormData({ ...formData, aadhar: e.target.value })}
            placeholder="12-digit Aadhar number"
            maxLength={12}
            required
            error={validationErrors.aadhar}
          />

          <InputField
            label="Nationality"
            type="text"
            value={formData.nationality}
            onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
            placeholder="Enter nationality"
            required
            error={validationErrors.nationality}
          />

          <div className="col-span-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-600">Permanent Address*</label>
              <textarea
                className={`w-full px-4 py-2 rounded-lg border ${
                  validationErrors.permanent_address ? 'border-red-500 focus:ring-red-500' : 
                  'border-gray-200 focus:ring-blue-500'
                } focus:border-transparent`}
                value={formData.permanent_address}
                onChange={(e) => setFormData({ ...formData, permanent_address: e.target.value })}
                placeholder="Enter permanent address"
                rows="2"
              />
              {validationErrors.permanent_address && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.permanent_address}</p>
              )}
            </div>
          </div>

          <FileUploadSection uploads={formData.uploads} />
        </div>
      </div>

      {/* Company Details */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Building2 size={20} />
          Company Details (Optional)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="Company Name"
            type="text"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            placeholder="Enter company name"
          />

          <InputField
            label="GSTIN"
            type="text"
            value={formData.GSTIN}
            onChange={(e) => setFormData({ ...formData, GSTIN: e.target.value })}
            placeholder="Enter GSTIN"
          />

          <InputField
            label="Designation"
            type="text"
            value={formData.designation}
            onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
            placeholder="Enter designation"
          />

          <InputField
            label="Purpose of Visit"
            type="text"
            value={formData.purpose_of_visit}
            onChange={(e) => setFormData({ ...formData, purpose_of_visit: e.target.value })}
            placeholder="Enter purpose of visit"
          />
        </div>
      </div>

      {/* Additional Guests */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Users size={20} />
            Additional Guests
          </h3>
          <button
            type="button"
            onClick={addDependant}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <PlusCircle className="h-5 w-5" />
            Add Guest
          </button>
        </div>

        {formData.dependants.map((dependant, index) => (
          <div key={index} className="mb-6 p-6 border rounded-lg bg-gray-50 relative">
            <button
              type="button"
              onClick={() => removeDependant(index)}
              className="absolute right-4 top-4 p-1 text-gray-400 hover:text-red-600 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Full Name"
                type="text"
                value={dependant.name}
                onChange={(e) => handleDependantChange(index, 'name', e.target.value)}
                placeholder="Enter guest name"
                required
                error={validationErrors[`dependants.${index}.name`]}
              />

              <InputField
                label="Phone Number"
                type="tel"
                value={dependant.phone_no}
                onChange={(e) => handleDependantChange(index, 'phone_no', e.target.value)}
                placeholder="10-digit phone number"
                maxLength={10}
                required
                error={validationErrors[`dependants.${index}.phone_no`]}
              />

              <SelectField
                label="Gender"
                value={dependant.gender}
                onChange={(e) => handleDependantChange(index, 'gender', e.target.value)}
                required
                error={validationErrors[`dependants.${index}.gender`]}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </SelectField>

              <InputField
                label="Age"
                type="number"
                value={dependant.age}
                onChange={(e) => handleDependantChange(index, 'age', e.target.value)}
                placeholder="Guest age"
                min="0"
                required
                error={validationErrors[`dependants.${index}.age`]}
              />

              <InputField
                label="Aadhar Number"
                type="text"
                value={dependant.aadhar}
                onChange={(e) => handleDependantChange(index, 'aadhar', e.target.value)}
                placeholder="12-digit Aadhar number"
                maxLength={12}
                required
                error={validationErrors[`dependants.${index}.aadhar`]}
              />

              <div className="flex items-center space-x-2 mt-4">
                <input
                  type="checkbox"
                  id={`kid-${index}`}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  checked={dependant.kid}
                  onChange={(e) => handleDependantChange(index, 'kid', e.target.checked)}
                />
                <label htmlFor={`kid-${index}`} className="text-sm font-medium text-gray-600">
                  Is Child (below 12 years)
                </label>
              </div>

              {/* File Upload Section for Dependant */}
              <FileUploadSection
                isGuest={true}
                guestIndex={index}
                uploads={dependant.uploads || []}
              />
            </div>
          </div>
        ))}

        {formData.dependants.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No additional guests added. Click "Add Guest" to add dependants.
          </div>
        )}
      </div>

      {/* Stay Summary */}
      {formData.checkin && formData.checkout && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Stay Summary</h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Check-in</p>
                <p className="font-medium">{new Date(formData.checkin).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Check-out</p>
                <p className="font-medium">{new Date(formData.checkout).toLocaleString()}</p>
              </div>
            </div>

            <div className="border-t border-blue-100 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Room Rate per Night</span>
                <span className="font-medium">₹{room.basePricePerNight}</span>
              </div>

              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-600">Number of Nights</span>
                <span className="font-medium">
                  {Math.ceil(
                    (new Date(formData.checkout) - new Date(formData.checkin)) /
                      (1000 * 60 * 60 * 24)
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-600">Total Guests</span>
                <span className="font-medium">
                  {1 + formData.dependants.length} ({formData.dependants.filter((d) => d.kid).length} children)
                </span>
              </div>

              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-600">Base Amount</span>
                <span className="font-medium">₹{formData.total_cost}</span>
              </div>

              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-600">GST ({room.gstPercentage}%)</span>
                <span className="font-medium">
                  ₹{(formData.total_cost * room.gstPercentage / 100).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t border-blue-100">
                <span className="font-semibold text-gray-800">Total Amount</span>
                <span className="font-bold text-lg text-green-600">
                  ₹{(formData.total_cost + (formData.total_cost * room.gstPercentage) / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingForm;
