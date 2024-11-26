// renderer/src/pages/GuestDetailsModal.jsx
import { useState } from 'react';
import { 
  X, Clock, Phone, User, Mail, Home, CreditCard, Building, 
  Flag, Briefcase, ChevronDown, ChevronUp, Users 
} from 'lucide-react';

// Helper functions
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

const GuestDetailsModal = ({ guest, onClose }) => {
  // State for collapsible sections
  const [openSections, setOpenSections] = useState({
    personal: true,
    additional: false,
    dependants: false,
    services: false
  });

  // Toggle section
  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Helper function for formatting dates and phone numbers (keep existing helpers)...

  // Section Header Component
  const SectionHeader = ({ title, section, count }) => (
    <button 
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-lg">{title}</h3>
        {count && <span className="text-sm text-gray-500">({count})</span>}
      </div>
      {openSections[section] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl h-[80vh] overflow-y-auto relative">
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold">Guest Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          

          {/* Personal Information - Collapsible */}
          <div className="border rounded-lg overflow-hidden">
            <SectionHeader title="Personal Information" section="personal" />
            {openSections.personal && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User size={18} className="text-gray-500" />
                    <label className="text-sm font-medium text-gray-600">Name</label>
                  </div>
                  <p className="text-lg ml-6">{guest.name || 'Not provided'}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User size={18} className="text-gray-500" />
                    <label className="text-sm font-medium text-gray-600">Age</label>
                  </div>
                  <p className="text-lg ml-6">{guest.age || 'Not provided'}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User size={18} className="text-gray-500" />
                    <label className="text-sm font-medium text-gray-600">Gender</label>
                  </div>
                  <p className="text-lg ml-6">{guest.gender || 'Not provided'}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone size={18} className="text-gray-500" />
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                  </div>
                  <p className="text-lg ml-6">{formatPhoneNumber(guest.phone_no)}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CreditCard size={18} className="text-gray-500" />
                    <label className="text-sm font-medium text-gray-600">Aadhar</label>
                  </div>
                  <p className="text-lg ml-6">{formatPhoneNumber(guest.aadhar)}</p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center gap-2">
                    <Home size={18} className="text-gray-500" />
                    <label className="text-sm font-medium text-gray-600">Address</label>
                  </div>
                  <p className="text-lg ml-6">{guest.permanent_address || 'Not provided'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Additional Details - Collapsible */}
          <div className="border rounded-lg overflow-hidden">
            <SectionHeader title="Additional Details" section="additional" />
            {openSections.additional && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building size={18} className="text-gray-500" />
                    <label className="text-sm font-medium text-gray-600">Company</label>
                  </div>
                  <p className="text-lg ml-6">{guest.company_name || 'Not provided'}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Briefcase size={18} className="text-gray-500" />
                    <label className="text-sm font-medium text-gray-600">Designation</label>
                  </div>
                  <p className="text-lg ml-6">{guest.designation || 'Not provided'}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Flag size={18} className="text-gray-500" />
                    <label className="text-sm font-medium text-gray-600">Nationality</label>
                  </div>
                  <p className="text-lg ml-6">{guest.nationality || 'Not provided'}</p>
                </div>

                {guest.GSTIN && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CreditCard size={18} className="text-gray-500" />
                      <label className="text-sm font-medium text-gray-600">GSTIN</label>
                    </div>
                    <p className="text-lg ml-6">{guest.GSTIN}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dependants - Collapsible */}
          {guest.dependants && guest.dependants.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <SectionHeader 
                title="Dependants" 
                section="dependants" 
                count={guest.dependants.length} 
              />
              {openSections.dependants && (
                <div className="p-4 space-y-4">
                  {guest.dependants.map((dep, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Name</label>
                          <p className="text-lg">{dep.name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Age</label>
                          <p className="text-lg">{dep.age}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Phone</label>
                          <p className="text-lg">{formatPhoneNumber(dep.phone_no)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Gender</label>
                          <p className="text-lg">{dep.gender}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Services - Collapsible */}
          {guest.services && guest.services.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <SectionHeader 
                title="Services Used" 
                section="services" 
                count={guest.services.length}
              />
              {openSections.services && (
                <div className="p-4 overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Service</th>
                        <th className="px-4 py-2 text-left">Type</th>
                        <th className="px-4 py-2 text-left">Units</th>
                        <th className="px-4 py-2 text-left">Cost</th>
                        <th className="px-4 py-2 text-left">Date & Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guest.services.map((service, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2">{service.name}</td>
                          <td className="px-4 py-2">{service.type}</td>
                          <td className="px-4 py-2">{service.units}</td>
                          <td className="px-4 py-2">₹{service.cost}</td>
                          <td className="px-4 py-2">{service.date} {service.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Stay Information - Always visible */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-lg mb-4">Stay Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 p-4 bg-white rounded-lg shadow-sm">
                <div className="flex items-center gap-2 text-green-600">
                  <Clock size={18} />
                  <label className="text-sm font-medium">Check-in Time</label>
                </div>
                <p className="text-lg">{formatDate(guest.checkin)}</p>
              </div>

              <div className="space-y-2 p-4 bg-white rounded-lg shadow-sm">
                <div className="flex items-center gap-2 text-red-600">
                  <Clock size={18} />
                  <label className="text-sm font-medium">Check-out Time</label>
                </div>
                <p className="text-lg">{formatDate(guest.checkout)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestDetailsModal;