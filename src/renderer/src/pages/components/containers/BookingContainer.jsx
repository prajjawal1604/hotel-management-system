import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import BookingForm from './BookingForm';
import ServicesForm from './ServicesForm';
import CheckoutModal from './CheckoutModal';
import { useRoomsStore } from '../../../store/roomsStore';

const STAGES = {
  BOOKING: 'BOOKING',
  SERVICES: 'SERVICES',
  CHECKOUT: 'CHECKOUT'
};

const BookingContainer = ({ space, category, onClose }) => {
  // Check if there's an existing booking
  const hasExistingBooking = space.currentStatus === 'OCCUPIED' && space.bookingId;

  // Stage management
  const [currentStage, setCurrentStage] = useState(() => {
    if (!hasExistingBooking) {
      return STAGES.BOOKING;
    }
    return STAGES.SERVICES;
  });

  // Form data state
  const [formData, setFormData] = useState(() => {
    if (hasExistingBooking) {
      return {
        // Primary Guest
        fullName: space.bookingId.guestId?.fullName || '',
        phoneNumber: space.bookingId.guestId?.phoneNumber || '',
        gender: space.bookingId.guestId?.gender || '',
        age: space.bookingId.guestId?.age || '',
        aadharNumber: space.bookingId.guestId?.aadharNumber || '',
        nationality: space.bookingId.guestId?.nationality || '',
        address: space.bookingId.guestId?.address || '',
        companyName: space.bookingId.guestId?.companyName || '',
        gstin: space.bookingId.guestId?.gstin || '',
        designation: space.bookingId.guestId?.designation || '',
        purposeOfVisit: space.bookingId.guestId?.purposeOfVisit || '',
        
        // Booking details
        checkIn: space.bookingId.checkIn || '',
        checkOut: space.bookingId.checkOut || '',
        bookingType: 'CURRENT',
        advanceAmount: space.bookingId.advanceAmount || 0,
        
        // Arrays
        additionalGuests: space.bookingId.additionalGuestIds || [],
        services: space.bookingId.serviceIds || []
      };
    }
    
    return {
      fullName: '',
      phoneNumber: '',
      gender: '',
      age: '',
      aadharNumber: '',
      nationality: '',
      address: '',
      companyName: '',
      gstin: '',
      designation: '',
      purposeOfVisit: '',
      checkIn: new Date().toISOString(),
      checkOut: '',
      bookingType: 'CURRENT',
      advanceAmount: 0,
      additionalGuests: [],
      services: []
    };
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Calculate total cost including 8am policy
  const calculateTotalCost = () => {
    if (!formData.checkIn || !formData.checkOut) return 0;

    const checkIn = new Date(formData.checkIn);
    const checkOut = new Date(formData.checkOut);
    
    // Set time to 8am for comparison
    const normalizeDate = (date) => {
      const normalized = new Date(date);
      normalized.setHours(8, 0, 0, 0);
      return normalized;
    };

    const normalizedCheckIn = normalizeDate(checkIn);
    const normalizedCheckOut = normalizeDate(checkOut);

    // If checkout is after 8am, count it as a full day
    let days = Math.ceil((normalizedCheckOut - normalizedCheckIn) / (1000 * 60 * 60 * 24));
    if (checkOut.getHours() >= 8) {
      days += 1;
    }

    const baseAmount = days * space.basePrice;
    const servicesAmount = formData.services.reduce((total, service) => 
      total + (service.costPerUnit * service.units), 0);

    return baseAmount + servicesAmount;
  };

  // Validation
  const validateBookingData = () => {
    const errors = {};

    // Primary guest validation
    if (!formData.fullName?.trim()) errors.fullName = 'Name is required';
    if (!formData.phoneNumber?.trim()) errors.phoneNumber = 'Phone number is required';
    if (!/^\d{10}$/.test(formData.phoneNumber)) errors.phoneNumber = 'Invalid phone number';
    if (!formData.gender) errors.gender = 'Gender is required';
    if (!formData.age || formData.age < 18) errors.age = 'Guest must be at least 18 years old';
    if (!formData.aadharNumber || !/^\d{12}$/.test(formData.aadharNumber)) {
      errors.aadharNumber = 'Valid Aadhar number is required';
    }
    if (!formData.nationality?.trim()) errors.nationality = 'Nationality is required';
    if (!formData.address?.trim()) errors.address = 'Address is required';

    // Booking details validation
    if (!formData.checkIn) errors.checkIn = 'Check-in date is required';
    if (!formData.checkOut) errors.checkOut = 'Check-out date is required';
    if (new Date(formData.checkOut) <= new Date(formData.checkIn)) {
      errors.checkOut = 'Check-out must be after check-in';
    }

    // Additional guests validation if any
    if (formData.additionalGuests.length > 0) {
      formData.additionalGuests.forEach((guest, index) => {
        if (!guest.fullName?.trim()) errors[`additionalGuest.${index}.fullName`] = 'Name is required';
        if (guest.phoneNumber && !/^\d{10}$/.test(guest.phoneNumber)) {
          errors[`additionalGuest.${index}.phoneNumber`] = 'Invalid phone number';
        }
        if (!guest.aadharNumber || !/^\d{12}$/.test(guest.aadharNumber)) {
          errors[`additionalGuest.${index}.aadharNumber`] = 'Valid Aadhar number is required';
        }
      });
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle stage transitions
  const handleNext = async () => {
    try {
      setLoading(true);
      setError(null);
  
      if (currentStage === STAGES.BOOKING) {
        // Validate booking data
        if (!validateBookingData()) {
          throw new Error('Please fill all required fields correctly');
        }
  
        const bookingData = {
          spaceId: space._id,
          // Primary Guest Data
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          gender: formData.gender,
          age: parseInt(formData.age),
          aadharNumber: formData.aadharNumber,
          nationality: formData.nationality,
          address: formData.address,
          companyName: formData.companyName || null,
          gstin: formData.gstin || null,
          designation: formData.designation || null,
          purposeOfVisit: formData.purposeOfVisit || null,
          // Booking details
          checkIn: formData.checkIn,
          checkOut: formData.checkOut,
          // Additional Guests
          additionalGuests: formData.additionalGuests.map(guest => ({
            ...guest,
            age: parseInt(guest.age),
            isKid: guest.isKid || false
          }))
        };
  
        const result = await window.electron.createBooking(bookingData);
  
        if (!result.success) {
          throw new Error(result.message || 'Failed to create booking');
        }

        // Get updated room data to reflect changes
        const roomData = await window.electron.getRoomData();
        
        if (roomData.success) {
          useRoomsStore.getState().setSpaces(roomData.data.spaces);
          useRoomsStore.getState().setStats(roomData.data.stats);
        }
        // Set the bookingId from the result
        space.bookingId = result.data._id;
        console.log('created:', space.bookingId);
  
        setCurrentStage(STAGES.SERVICES);
      } 
      else if (currentStage === STAGES.SERVICES) {
        
  
        // Move to checkout stage
        setCurrentStage(STAGES.CHECKOUT);
      }
    } catch (err) {
      setError(err.message);
      console.error('Booking error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle back button
  const handleBack = () => {
    if (currentStage === STAGES.SERVICES) {
      setCurrentStage(STAGES.BOOKING);
    }
  };

  // Render content based on current stage
  const renderContent = () => {
    switch (currentStage) {
      case STAGES.BOOKING:
        return (
          <BookingForm 
            formData={formData}
            setFormData={setFormData}
            space={space}
            disabled={hasExistingBooking}
            validationErrors={validationErrors}
          />
        );
      case STAGES.SERVICES:
        return (
          <ServicesForm 
            formData={formData}
            setFormData={setFormData}
            space={space}
          />
        );
      case STAGES.CHECKOUT:
        return (
          <CheckoutModal
            formData={formData}
            space={space}
            onClose={onClose}
            totalCost={calculateTotalCost()}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl min-h-[80vh] max-h-[90vh] flex flex-col m-4">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {currentStage === STAGES.BOOKING ? 'New Booking' : 
             currentStage === STAGES.SERVICES ? 'Add Services' : 'Checkout'} 
            - {space.spaceName}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
          {renderContent()}
        </div>

        {/* Footer */}
        {currentStage !== STAGES.CHECKOUT && (
          <div className="p-4 border-t flex justify-between">
            {currentStage === STAGES.SERVICES && (
              <button
                onClick={handleBack}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Back
              </button>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Processing...' : 
                 currentStage === STAGES.BOOKING ? 'Save & Continue' : 
                 'Proceed to Checkout'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingContainer;