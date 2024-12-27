import React, { useState } from 'react';
import { PlusCircle, X, ChevronDown, ChevronRight } from 'lucide-react';

// Service types from schema
const SERVICE_TYPES = {
  FOOD: 'FOOD',
  LAUNDRY: 'LAUNDRY',
  HOUSEKEEPING: 'HOUSEKEEPING',
  OTHER: 'OTHER'
};

const ServicesForm = ({ formData, setFormData, space }) => {
  // Track which services are collapsed
  const [collapsedServices, setCollapsedServices] = useState({});
  const [validationErrors, setValidationErrors] = useState({});

  // Add new service
  const addService = () => {
    setFormData(prev => ({
      ...prev,
      services: [
        ...prev.services,
        {
          serviceName: '',
          serviceType: SERVICE_TYPES.FOOD,
          units: 1,
          costPerUnit: '',
          remarks: '',
          dateTime: new Date().toISOString()
        }
      ]
    }));
    // Expand the newly added service
    setCollapsedServices(prev => ({
      ...prev,
      [formData.services.length]: false
    }));
  };

  // Remove service
  const removeService = (index) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
    // Remove from collapsed state
    const newCollapsed = { ...collapsedServices };
    delete newCollapsed[index];
    setCollapsedServices(newCollapsed);
  };

  // Update service
  const updateService = (index, field, value) => {
    const newServices = [...formData.services];
    newServices[index] = {
      ...newServices[index],
      [field]: field === 'units' || field === 'costPerUnit' ? 
        Number(value) || 0 : value
    };
    setFormData(prev => ({
      ...prev,
      services: newServices
    }));

    // Clear validation error if exists
    if (validationErrors[`${index}-${field}`]) {
      const newErrors = { ...validationErrors };
      delete newErrors[`${index}-${field}`];
      setValidationErrors(newErrors);
    }
  };

  // Toggle service collapse
  const toggleServiceCollapse = (index) => {
    setCollapsedServices(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Calculate total for a service
  const calculateServiceTotal = (service) => {
    return (service.units || 0) * (service.costPerUnit || 0);
  };

  // Calculate grand total
  const calculateGrandTotal = () => {
    return formData.services.reduce((total, service) => 
      total + calculateServiceTotal(service), 0
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Additional Services</h3>
            <p className="text-sm text-gray-600 mt-1">Add services for {space.spaceName}</p>
          </div>
          <button
            onClick={addService}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg 
              hover:bg-blue-100 transition-colors"
          >
            <PlusCircle size={20} />
            Add Service
          </button>
        </div>

        {/* Services List */}
        {formData.services.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-gray-500">
              <PlusCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No services added yet</p>
              <p className="mt-1">Click "Add Service" to begin adding services</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {formData.services.map((service, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 
                  transition-colors"
              >
                {/* Service Header */}
                <div
                  className="p-4 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleServiceCollapse(index)}
                >
                  <div className="flex items-center gap-2">
                    {collapsedServices[index] ? (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                    <h4 className="font-medium text-gray-800">
                      {service.serviceName || `Service #${index + 1}`}
                      {service.serviceName && (
                        <span className="text-sm text-gray-500 ml-2">
                          (₹{calculateServiceTotal(service).toFixed(2)})
                        </span>
                      )}
                    </h4>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeService(index);
                    }}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Service Details */}
                {!collapsedServices[index] && (
                  <div className="px-4 pb-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                      {/* Service Name */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-600">
                          Service Name*
                        </label>
                        <input
                          type="text"
                          value={service.serviceName}
                          onChange={(e) => updateService(index, 'serviceName', e.target.value)}
                          placeholder="Enter service name"
                          className={`w-full px-4 py-2 rounded-lg border ${
                            validationErrors[`${index}-serviceName`] ? 
                              'border-red-500' : 'border-gray-200'
                          }`}
                        />
                      </div>

                      {/* Service Type */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-600">
                          Service Type*
                        </label>
                        <select
                          value={service.serviceType}
                          onChange={(e) => updateService(index, 'serviceType', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-gray-200"
                        >
                          {Object.entries(SERVICE_TYPES).map(([key, value]) => (
                            <option key={key} value={value}>
                              {key.charAt(0) + key.slice(1).toLowerCase()}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Units */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-600">
                          Units*
                        </label>
                        <input
                          type="number"
                          value={service.units}
                          onChange={(e) => updateService(index, 'units', e.target.value)}
                          min="1"
                          className="w-full px-4 py-2 rounded-lg border border-gray-200"
                        />
                      </div>

                      {/* Cost per Unit */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-600">
                          Cost per Unit*
                        </label>
                        <input
                          type="number"
                          value={service.costPerUnit}
                          onChange={(e) => updateService(index, 'costPerUnit', e.target.value)}
                          min="0"
                          step="0.01"
                          className="w-full px-4 py-2 rounded-lg border border-gray-200"
                        />
                      </div>

                      {/* Date & Time */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-600">
                          Date & Time*
                        </label>
                        <input
                          type="datetime-local"
                          value={service.dateTime}
                          onChange={(e) => updateService(index, 'dateTime', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-gray-200"
                        />
                      </div>

                      {/* Remarks */}
                      <div className="space-y-2 md:col-span-2 lg:col-span-3">
                        <label className="block text-sm font-medium text-gray-600">
                          Remarks
                        </label>
                        <textarea
                          value={service.remarks}
                          onChange={(e) => updateService(index, 'remarks', e.target.value)}
                          placeholder="Add any additional notes"
                          rows="2"
                          className="w-full px-4 py-2 rounded-lg border border-gray-200"
                        />
                      </div>

                      {/* Service Total */}
                      <div className="md:col-span-2 lg:col-span-3 pt-2 border-t">
                        <div className="flex justify-end items-center gap-2">
                          <span className="text-gray-600">Total:</span>
                          <span className="text-lg font-semibold text-green-600">
                            ₹{calculateServiceTotal(service).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Grand Total */}
            {formData.services.length > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Total Services Cost:</span>
                  <span className="text-xl font-bold text-green-600">
                    ₹{calculateGrandTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicesForm;