import { PlusCircle, X, Calendar, Building2, Users, CreditCard } from 'lucide-react';

const BookingForm = ({ room, formData, setFormData }) => {
  const isEditingDisabled = room.status === 'Occupied' || room.status === 'CheckoutPending';

  const handleDependantChange = (index, field, value) => {
    const newDependants = [...formData.dependants];
    newDependants[index] = {
      ...newDependants[index],
      [field]: value,
    };
    setFormData({ ...formData, dependants: newDependants });
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
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Check-in Date & Time*</label>
            <input
              type="datetime-local"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.checkin}
              onChange={(e) => setFormData({ ...formData, checkin: e.target.value })}
              disabled={isEditingDisabled}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Check-out Date & Time*</label>
            <input
              type="datetime-local"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.checkout}
              onChange={(e) => setFormData({ ...formData, checkout: e.target.value })}
              min={formData.checkin}
              disabled={isEditingDisabled}
            />
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
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter guest name"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Phone Number*</label>
            <input
              type="tel"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.phone_no}
              onChange={(e) => setFormData({ ...formData, phone_no: e.target.value })}
              placeholder="10-digit phone number"
              maxLength={10}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Gender*</label>
            <select
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Age*</label>
            <input
              type="number"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              placeholder="Guest age"
              min="18"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Aadhar Number*</label>
            <input
              type="text"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.aadhar}
              onChange={(e) => setFormData({ ...formData, aadhar: e.target.value })}
              placeholder="12-digit Aadhar number"
              maxLength={12}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Nationality*</label>
            <input
              type="text"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.nationality}
              onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
              placeholder="Enter nationality"
            />
          </div>

          <div className="col-span-2 space-y-2">
            <label className="block text-sm font-medium text-gray-600">Permanent Address*</label>
            <textarea
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.permanent_address}
              onChange={(e) => setFormData({ ...formData, permanent_address: e.target.value })}
              placeholder="Enter permanent address"
              rows="2"
            />
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
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              placeholder="Enter company name"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">GSTIN</label>
            <input
              type="text"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.GSTIN}
              onChange={(e) => setFormData({ ...formData, GSTIN: e.target.value })}
              placeholder="Enter GSTIN"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Designation</label>
            <input
              type="text"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              placeholder="Enter designation"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Purpose of Visit</label>
            <input
              type="text"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.purpose_of_visit}
              onChange={(e) => setFormData({ ...formData, purpose_of_visit: e.target.value })}
              placeholder="Enter purpose of visit"
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
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-600">Full Name*</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={dependant.name}
                  onChange={(e) => handleDependantChange(index, 'name', e.target.value)}
                  placeholder="Enter guest name"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-600">Phone Number*</label>
                <input
                  type="tel"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={dependant.phone_no}
                  onChange={(e) => handleDependantChange(index, 'phone_no', e.target.value)}
                  placeholder="10-digit phone number"
                  maxLength={10}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-600">Gender*</label>
                <select
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={dependant.gender}
                  onChange={(e) => handleDependantChange(index, 'gender', e.target.value)}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-600">Age*</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={dependant.age}
                  onChange={(e) => handleDependantChange(index, 'age', e.target.value)}
                  placeholder="Guest age"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-600">Aadhar Number*</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={dependant.aadhar}
                  onChange={(e) => handleDependantChange(index, 'aadhar', e.target.value)}
                  placeholder="12-digit Aadhar number"
                  maxLength={12}
                />
              </div>

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
