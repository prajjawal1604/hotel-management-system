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

const GuestDetailsModal = ({ guest, onClose }) => {
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

  if (!guest) {
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
          <h2 className="text-2xl font-bold">Guest Details</h2>
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
            title="Personal Information"
            icon={User}
            isOpen={sections.personal}
            onToggle={() => toggleSection('personal')}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Name</label>
                <p className="font-medium">{guest.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Phone</label>
                <p className="font-medium">{formatPhoneNumber(guest.phone_no)}</p>
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
                <label className="text-sm text-gray-600">Aadhar</label>
                <p className="font-medium">{formatPhoneNumber(guest.aadhar)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Nationality</label>
                <p className="font-medium">{guest.nationality || 'Not provided'}</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm text-gray-600">Address</label>
                <p className="font-medium">{guest.permanent_address || 'Not provided'}</p>
              </div>
            </div>
          </Section>

          {/* Business Information */}
          {(guest.company_name || guest.GSTIN || guest.designation) && (
            <Section
              title="Business Information"
              icon={Building}
              isOpen={sections.business}
              onToggle={() => toggleSection('business')}
            >
              <div className="grid grid-cols-2 gap-4">
                {guest.company_name && (
                  <div>
                    <label className="text-sm text-gray-600">Company</label>
                    <p className="font-medium">{guest.company_name}</p>
                  </div>
                )}
                {guest.GSTIN && (
                  <div>
                    <label className="text-sm text-gray-600">GSTIN</label>
                    <p className="font-medium">{guest.GSTIN}</p>
                  </div>
                )}
                {guest.designation && (
                  <div>
                    <label className="text-sm text-gray-600">Designation</label>
                    <p className="font-medium">{guest.designation}</p>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Dependants */}
          {guest.dependants?.length > 0 && (
            <Section
              title={`Dependants (${guest.dependants.length})`}
              icon={User}
              isOpen={sections.dependants}
              onToggle={() => toggleSection('dependants')}
            >
              <div className="space-y-4">
                {guest.dependants.map((dep, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600">Name</label>
                        <p className="font-medium">{dep.name}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Phone</label>
                        <p className="font-medium">{formatPhoneNumber(dep.phone_no)}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Age</label>
                        <p className="font-medium">{dep.age}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Gender</label>
                        <p className="font-medium">{dep.gender}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Services */}
          {guest.services?.length > 0 && (
            <Section
              title={`Services (${guest.services.length})`}
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
                      <th className="px-4 py-2 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guest.services.map((service, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2">{service.name}</td>
                        <td className="px-4 py-2">{service.type}</td>
                        <td className="px-4 py-2 text-right">{service.units}</td>
                        <td className="px-4 py-2 text-right">₹{service.cost}</td>
                        <td className="px-4 py-2">{service.date} {service.time}</td>
                      </tr>
                    ))}
                    <tr className="border-t font-medium">
                      <td colSpan="3" className="px-4 py-2 text-right">Total:</td>
                      <td className="px-4 py-2 text-right">
                        ₹{guest.services.reduce((sum, service) => 
                          sum + (service.units * service.cost), 0).toFixed(2)}
                      </td>
                      <td></td>
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
                <p className="font-medium">{formatDate(guest.checkin)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Check-out</label>
                <p className="font-medium">{formatDate(guest.checkout)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestDetailsModal;
