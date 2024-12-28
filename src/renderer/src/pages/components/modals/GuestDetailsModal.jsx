import { useState } from 'react';
import { X, Phone, User, Mail, Home, CreditCard, Building, 
  Flag, Briefcase, ChevronDown, ChevronUp } from 'lucide-react';

const formatDate = (dateObj) => {
  if (!dateObj) return 'Not set';
  try {
    if (dateObj.$date) {
      return new Date(dateObj.$date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return new Date(dateObj).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid date';
  }
};

const formatPhoneNumber = (phoneNo) => {
  if (!phoneNo) return 'Not provided';
  try {
    if (phoneNo.$numberLong) {
      return phoneNo.$numberLong;
    }
    return phoneNo.toString();
  } catch (error) {
    console.error('Phone number formatting error:', error);
    return 'Invalid phone number';
  }
};

const Section = ({ title, icon: Icon, children, isOpen, onToggle }) => (
  <div className="border rounded-lg overflow-hidden mb-4">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100"
    >
      <div className="flex items-center gap-2">
        <Icon size={20} className="text-gray-500" />
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>
      {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
    </button>
    {isOpen && <div className="p-4 border-t">{children}</div>}
  </div>
);

const GuestDetailsModal = ({ space, onClose }) => {
  // Check if we have an active booking
  const booking = space.bookingId;
  const primaryGuest = booking?.guestId;
  const additionalGuests = booking?.additionalGuestIds || [];
  const services = booking?.serviceIds || [];
  const [sections, setSections] = useState({
    personal: true,
    business: false,
    dependants: false,
    services: false
  });

  const toggleSection = (section) => {
    setSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!booking) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4">
          <div className="text-center">No guest details available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Guest Details - {space.spaceName}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Personal Information */}
          <Section
            title="Primary Guest"
            icon={User}
            isOpen={sections.personal}
            onToggle={() => toggleSection('personal')}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Name</label>
                <p className="font-medium">{primaryGuest?.fullName}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Phone</label>
                <p className="font-medium">{formatPhoneNumber(primaryGuest?.phoneNumber)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Age</label>
                <p className="font-medium">{primaryGuest?.age}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Gender</label>
                <p className="font-medium">{primaryGuest?.gender}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Aadhar</label>
                <p className="font-medium">{formatPhoneNumber(primaryGuest?.aadharNumber)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Nationality</label>
                <p className="font-medium">{primaryGuest?.nationality || 'Not provided'}</p>
              </div><div >
                <label className="text-sm text-gray-600">Advance Amount</label>
                <p className="font-medium">{booking.advanceAmount || 'Not provided'}</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm text-gray-600">Address</label>
                <p className="font-medium">{primaryGuest?.address || 'Not provided'}</p>
              </div>
              
            </div>
          </Section>

          {/* Business Information */}
          {(primaryGuest?.companyName || primaryGuest?.gstin || primaryGuest?.designation) && (
            <Section
              title="Business Information"
              icon={Building}
              isOpen={sections.business}
              onToggle={() => toggleSection('business')}
            >
              <div className="grid grid-cols-2 gap-4">
                {primaryGuest?.companyName && (
                  <div>
                    <label className="text-sm text-gray-600">Company</label>
                    <p className="font-medium">{primaryGuest.companyName}</p>
                  </div>
                )}
                {primaryGuest?.gstin && (
                  <div>
                    <label className="text-sm text-gray-600">GSTIN</label>
                    <p className="font-medium">{primaryGuest.gstin}</p>
                  </div>
                )}
                {primaryGuest?.designation && (
                  <div>
                    <label className="text-sm text-gray-600">Designation</label>
                    <p className="font-medium">{primaryGuest.designation}</p>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Additional Guests */}
          {additionalGuests.length > 0 && (
            <Section
              title={`Additional Guests (${additionalGuests.length})`}
              icon={User}
              isOpen={sections.dependants}
              onToggle={() => toggleSection('dependants')}
            >
              <div className="space-y-4">
                {additionalGuests.map((guest, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600">Name</label>
                        <p className="font-medium">{guest.fullName}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Phone</label>
                        <p className="font-medium">{formatPhoneNumber(guest.phoneNumber)}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Age</label>
                        <p className="font-medium">{guest.age}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Gender</label>
                        <p className="font-medium">{guest.gender}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Type</label>
                        <p className="font-medium">{guest.isKid ? 'Child' : 'Adult'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Services */}
          {services.length > 0 && (
            <Section
              title={`Services (${services.length})`}
              icon={Building}
              isOpen={sections.services}
              onToggle={() => toggleSection('services')}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Service</th>
                      <th className="px-4 py-2 text-left">Type</th>
                      <th className="px-4 py-2 text-right">Units</th>
                      <th className="px-4 py-2 text-right">Cost</th>
                      <th className="px-4 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((service, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2">{service.serviceName}</td>
                        <td className="px-4 py-2">{service.serviceType}</td>
                        <td className="px-4 py-2 text-right">{service.units}</td>
                        <td className="px-4 py-2 text-right">₹{service.costPerUnit}</td>
                        <td className="px-4 py-2 text-right">
                          ₹{(service.units * service.costPerUnit).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t font-medium">
                      <td colSpan="4" className="px-4 py-2 text-right">Total:</td>
                      <td className="px-4 py-2 text-right">
                        ₹{services.reduce((sum, service) => 
                          sum + (service.units * service.costPerUnit), 0).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {/* Stay Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-4">Stay Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Check-in</label>
                <p className="font-medium">{formatDate(booking?.checkIn)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Check-out</label>
                <p className="font-medium">{formatDate(booking?.checkOut)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestDetailsModal;
