import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import BookingForm from '../BookingForm';
import ServicesForm from '../Services';
import CheckoutModal from '../Checkout';

const RoomOperationsModal = ({ room, onClose }) => {
  // Default view based on room status
  const [currentView, setCurrentView] = useState(
    room.status === 'Available' ? 'booking' : 'services'
  );
  const [showCheckout, setShowCheckout] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [formData, setFormData] = useState({
    category_name: room.categoryName,
    space_name: room.name,
    name: room.currentGuest?.name || '',
    phone_no: room.currentGuest?.phone_no?.$numberLong || '',
    gender: room.currentGuest?.gender || '',
    aadhar: room.currentGuest?.aadhar?.$numberLong || '',
    age: room.currentGuest?.age || '',
    permanent_address: room.currentGuest?.permanent_address || '',
    company_name: room.currentGuest?.company_name || '',
    nationality: room.currentGuest?.nationality || '',
    designation: room.currentGuest?.designation || '',
    purpose_of_visit: room.currentGuest?.purpose_of_visit || '',
    dependants: room.currentGuest?.dependants || [],
    GSTIN: room.currentGuest?.GSTIN || '',
    services: room.currentGuest?.services || [],
    total_cost: room.basePricePerNight,
    method_of_payment: room.currentGuest?.method_of_payment || '',
    checkin: room.currentGuest?.checkin?.$date || new Date().toISOString(),
    checkout: room.currentGuest?.checkout?.$date || '',
    uploads: room.currentGuest?.uploads || [],
  });

  // Effect to update total cost
  useEffect(() => {
    if (formData.checkin && formData.checkout) {
      const nights = Math.ceil(
        (new Date(formData.checkout) - new Date(formData.checkin)) / 
        (1000 * 60 * 60 * 24)
      );

      const roomCost = room.basePricePerNight * nights;
      const servicesCost = formData.services.reduce((total, service) => 
        total + (service.cost * service.units), 0);

      const subtotal = roomCost + servicesCost;
      const gstAmount = subtotal * (room.gstPercentage / 100);
      const finalTotal = subtotal + gstAmount;

      setFormData(prev => ({
        ...prev,
        total_cost: finalTotal
      }));
    }
  }, [formData.checkin, formData.checkout, formData.services, room.basePricePerNight, room.gstPercentage]);

  const validateBookingData = () => {
    const errors = {};

    if (!formData.name) errors.name = 'Guest name is required';
    if (!formData.phone_no) errors.phone_no = 'Phone number is required';
    if (!/^\d{10}$/.test(formData.phone_no)) errors.phone_no = 'Invalid phone number';
   
    const requiredFields = {
      name: 'Guest Name',
      phone_no: 'Phone Number',
      aadhar: 'Aadhar Number',
      gender: 'Gender',
      age: 'Age',
      permanent_address: 'Address',
      nationality: 'Nationality',
      checkin: 'Check-in Date',
      checkout: 'Check-out Date'
    };
    

    const missingFields = Object.entries(requiredFields)
      .filter(([key]) => !formData[key])
      .map(([_, label]) => label);

    if (missingFields.length > 0) {
      throw new Error(`Please fill required fields: ${missingFields.join(', ')}`);
    }

    if (!/^\d{10}$/.test(formData.phone_no)) {
      throw new Error('Please enter a valid 10-digit phone number');
    }

    if (!/^\d{12}$/.test(formData.aadhar)) {
      throw new Error('Please enter a valid 12-digit Aadhar number');
    }

    if (parseInt(formData.age) < 18) {
      throw new Error('Primary guest must be 18 years or older');
    }

    const checkin = new Date(formData.checkin);
    const checkout = new Date(formData.checkout);

    if (checkout <= checkin) {
      throw new Error('Check-out date must be after check-in date');
    }
    if (Object.keys(errors).length > 0) {
      throw { errors };  // Throw error object instead of message
    }
  };

  const handleSaveBooking = async (shouldValidate = false) => {
    try {
      setLoading(true);
      
        validateBookingData();
      

      const bookingData = {
        name: formData.space_name,
        status: room.status === 'Available' ? "Occupied" : room.status,
        currentGuest: {
          ...formData,
          phone_no: { $numberLong: formData.phone_no },
          aadhar: { $numberLong: formData.aadhar },
          age: Number(formData.age),
          dependants: formData.dependants.map(dep => ({
            ...dep,
            phone_no: { $numberLong: dep.phone_no },
            aadhar: { $numberLong: dep.aadhar },
            age: Number(dep.age)
          })),
          checkin: { $date: new Date(formData.checkin).toISOString() },
          checkout: { $date: new Date(formData.checkout).toISOString() }
        },
        lastUpdated: new Date().toISOString()
      };

      const result = await window.electron.updateRoom(bookingData);
      if (!result.success) {
        throw new Error(result.message || "Failed to save booking");
      }
      setHasUnsavedChanges(false);
      if (shouldValidate) {
        setCurrentView('services');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);
      await window.electron.checkoutRoom(room.name);
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (newData) => {
    setFormData(newData);
    setHasUnsavedChanges(true);
  };

  const renderContent = () => {
    if (showCheckout) {
      return (
        <CheckoutModal
          room={room}
          onClose={() => setShowCheckout(false)}
          onCheckout={handleCheckout}
        />
      );
    }

    if (currentView === 'services') {
      return (
        <ServicesForm 
          room={room} 
          formData={formData} 
          setFormData={handleFormChange}
        />
      );
    }

    return (
      <BookingForm 
        room={room} 
        formData={formData} 
        setFormData={handleFormChange}
        hasUnsavedChanges={hasUnsavedChanges}
      />
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl min-h-[80vh] max-h-[90vh] flex flex-col m-4">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">Room Operations - {room.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
          {renderContent()}
        </div>

        {!showCheckout && (
          <div className="p-4 border-t flex justify-between">
            {/* Back button for services view */}
            {currentView === 'services' && room.status !== 'Available' && (
              <button
                onClick={() => setCurrentView('booking')}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Back
              </button>
            )}
            
            {/* Empty div for spacing when in booking view */}
            {currentView === 'booking' && <div></div>}

            {/* Action buttons */}
            <div className="flex gap-2">
            {currentView === 'booking' && (
    <>
      {room.status !== 'Available' && hasUnsavedChanges && (
        <button
          onClick={() => handleSaveBooking(false)} // No navigation, just save with validation
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          disabled={loading}
        >
          Save Changes
        </button>
      )}
      <button
        onClick={() => {
          if (room.status === 'Available') {
            handleSaveBooking(true); // Save and navigate for new bookings
          } else {
            setCurrentView('services');
          }
        }}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        disabled={loading}
      >
        {room.status === 'Available' ? 'Save & Continue' : 'Next: Services'}
      </button>
    </>
  )}
              {currentView === 'services' && (
                <button
                  onClick={() => setShowCheckout(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={loading}
                >
                  Proceed to Checkout
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomOperationsModal;