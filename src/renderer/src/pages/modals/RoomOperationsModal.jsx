// RoomOperationsModal.jsx
import { useState, useEffect } from 'react';
import { X, ChevronRight } from 'lucide-react';
import BookingForm from '../BookingForm';
import ServicesForm from '../Services';

const stages = [
  { id: 'booking', label: 'Booking' },
  { id: 'services', label: 'Add Services' },
  { id: 'checkout', label: 'Checkout & Bill' }
];

const RoomOperationsModal = ({ room, onClose }) => {

  const getInitialStage = () => {
    if (room.status === 'Occupied' || room.status === 'CheckoutPending') {
      return 'services';
    }
    return 'booking';
  };

  const [currentStage, setCurrentStage] = useState(getInitialStage());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Initialize form data at modal level
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
    checkout: room.currentGuest?.checkout?.$date || ''
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

  const calculateTotalCost = () => {
    if (!formData.checkin || !formData.checkout) return;

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
  };

  // Validation functions
  const validateBookingData = () => {
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

    // Phone number validation
    if (!/^\d{10}$/.test(formData.phone_no)) {
      throw new Error('Please enter a valid 10-digit phone number');
    }

    // Aadhar validation
    if (!/^\d{12}$/.test(formData.aadhar)) {
      throw new Error('Please enter a valid 12-digit Aadhar number');
    }

    // Age validation
    if (parseInt(formData.age) < 18) {
      throw new Error('Primary guest must be 18 years or older');
    }

    const checkin = new Date(formData.checkin);
    const checkout = new Date(formData.checkout);
    const now = new Date();

    if (checkout <= checkin) {
      throw new Error('Check-out date must be after check-in date');
    }

    
  };

  const validateServicesData = () => {
    if (formData.services.length > 0) {
      formData.services.forEach((service, index) => {
        if (!service.name) {
          throw new Error(`Please enter a name for service #${index + 1}`);
        }
        if (!service.cost || service.cost <= 0) {
          throw new Error(`Please enter a valid cost for ${service.name}`);
        }
        if (!service.units || service.units < 1) {
          throw new Error(`Please enter valid units for ${service.name}`);
        }
      });
    }
  };

  const handleNext = async () => {
    try {
      // Validate booking data
      validateBookingData();
  
      // Prepare booking data for the update
      const bookingData = {
        category_name: formData.category_name,
        space_name: formData.space_name,
        name: formData.name,
        phone_no: { $numberLong: formData.phone_no },
        gender: formData.gender,
        aadhar: { $numberLong: formData.aadhar },
        age: Number(formData.age),
        permanent_address: formData.permanent_address,
        company_name: formData.company_name,
        nationality: formData.nationality,
        designation: formData.designation,
        purpose_of_visit: formData.purpose_of_visit,
        dependants: formData.dependants.map(dep => ({
          ...dep,
          phone_no: { $numberLong: dep.phone_no },
          aadhar: { $numberLong: dep.aadhar },
          age: Number(dep.age),
        })),
        GSTIN: formData.GSTIN,
        services: formData.services,
        total_cost: formData.total_cost,
        method_of_payment: formData.method_of_payment,
        checkin: { $date: new Date(formData.checkin).toISOString() },
        checkout: { $date: new Date(formData.checkout).toISOString() },
      };
  
      if (room.status === "Occupied") {
        // Room is occupied: update the existing guest details
        const result = await window.electron.updateRoom({
          name: formData.space_name,
          status: "Occupied", // Keep the room occupied
          currentGuest: bookingData,
          lastUpdated: new Date().toISOString(),
        });
  
        if (!result.success) {
          throw new Error(result.message || "Failed to update room");
        }
      } else {
        // Room is vacant: create a new booking
        const result = await window.electron.updateRoom({
          name: formData.space_name,
          status: "Occupied", // Mark the room as occupied
          currentGuest: bookingData,
          lastUpdated: new Date().toISOString(),
        });
  
        if (!result.success) {
          throw new Error(result.message || "Failed to book room");
        }
      }
  
      // Move to the next stage after a successful update
      const currentIndex = stages.findIndex(s => s.id === currentStage);
      setCurrentStage(stages[currentIndex + 1].id);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };
  

  const handleBack = () => {
    setError(null);
    const currentIndex = stages.findIndex(s => s.id === currentStage);
    setCurrentStage(stages[currentIndex - 1].id);
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      setError(null);

      // Final validation
      validateBookingData();
      validateServicesData();

      const updatedRoomData = {
        name: room.name,
        status: 'Occupied',
        lastUpdated: new Date().toISOString(),
        currentGuest: {
          ...formData,
          phone_no: { $numberLong: formData.phone_no },
          aadhar: { $numberLong: formData.aadhar },
          age: Number(formData.age),
          checkin: { $date: new Date(formData.checkin).toISOString() },
          checkout: { $date: new Date(formData.checkout).toISOString() },
          dependants: formData.dependants.map(dep => ({
            ...dep,
            phone_no: { $numberLong: dep.phone_no },
            aadhar: { $numberLong: dep.aadhar },
            age: Number(dep.age)
          }))
        }
      };

      const result = await window.electron.updateRoom(updatedRoomData);

      if (result.success) {
        onClose();
      } else {
        setError(result.message || 'Failed to complete booking');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStageComponent = () => {
    switch (currentStage) {
      case 'booking':
        return <BookingForm room={room} formData={formData} setFormData={setFormData} />;
      case 'services':
        return <ServicesForm room={room} formData={formData} setFormData={setFormData} onClose={onClose} />;
      case 'checkout':
        return <CheckoutForm room={room} formData={formData} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl min-h-[80vh] max-h-[90vh] flex flex-col m-4">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Room Operations - {room.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 relative">
            <div className="absolute top-[28%] left-5 h-0.5 bg-gray-200 w-[90%]" />
            <div className="relative flex justify-between">
              {stages.map((stage, index) => (
                <div key={stage.id} className="flex flex-col items-center">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center
                      ${currentStage === stage.id 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-600'}`}
                  >
                    {index + 1}
                  </div>
                  <span className="mt-2 text-sm font-medium">{stage.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
          {getStageComponent()}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <div className="space-x-2">
            {currentStage !== 'booking' && (
              <button
                onClick={handleBack}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Back
              </button>
            )}
            {currentStage !== 'checkout' && (
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
              >
                {currentStage === 'services' ? "Proceed to Checkout" : "Next"}
              </button>
            )}
            {currentStage === 'checkout' && (
              <button
                onClick={handleComplete}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Complete Booking'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomOperationsModal;