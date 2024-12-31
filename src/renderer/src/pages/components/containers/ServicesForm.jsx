import React, { useState } from 'react';
import { PlusCircle, X, ChevronDown, ChevronRight, Save } from 'lucide-react';
import { useRoomsStore } from '../../../store/roomsStore';

const SERVICE_TYPES = {
  FOOD: 'FOOD',
  LAUNDRY: 'LAUNDRY',
  HOUSEKEEPING: 'HOUSEKEEPING',
  OTHER: 'OTHER'
};

const ServicesForm = ({ formData, setFormData, space }) => {
  const [collapsedServices, setCollapsedServices] = useState(() => {
    return formData.services.reduce((acc, service, index) => {
      acc[index] = !service.isPending;
      return acc;
    }, {});
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState({});
  const [error, setError] = useState(null);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  
  const { setSpaces } = useRoomsStore();

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).replace(',', '');
  };

  const addService = () => {
    const now = new Date();
    const dateString = now.toISOString().slice(0, 16);
  
    const newService = {
      serviceName: '',
      serviceType: SERVICE_TYPES.FOOD,
      units: 1,
      costPerUnit: '',
      remarks: '',
      dateTime: dateString,
      isPending: true,
      _tempId: Math.random()
    };
    
    setFormData(prev => ({
      ...prev,
      services: [newService, ...prev.services]
    }));

    const newCollapsed = {};
    formData.services.forEach((_, index) => {
      newCollapsed[index + 1] = true;
    });
    newCollapsed[0] = false;
    setCollapsedServices(newCollapsed);
  };
  const saveService = async (index) => {
    try {
      setLoading(prev => ({ ...prev, [index]: true }));
      setError(null);

      const service = formData.services[index];

      if (!service.serviceName || !service.costPerUnit || !service.units) {
        throw new Error('Please fill all required fields');
      }

      // Use the original dateTime string without conversion
      const result = await window.electron.updateBookingServices({
        bookingId: space.bookingId,
        services: [{
          serviceName: service.serviceName,
          serviceType: service.serviceType,
          units: service.units,
          costPerUnit: service.costPerUnit,
          remarks: service.remarks,
          dateTime: service.dateTime  // Send original datetime string
        }]
      });

      if (!result.success) {
        throw new Error(result.message || 'Failed to save service');
      }

      const roomResult = await window.electron.getRoomData();
      if (roomResult.success) {
        setSpaces(roomResult.data.spaces);
      }

      // Keep the datetime in its original format when updating state
      const newServices = formData.services.map((s, i) => 
        i === index ? {
          ...result.data.serviceIds[0],
          isPending: false,
          dateTime: result.data.serviceIds[0].dateTime // Keep original format from backend
        } : s
      );

      setFormData(prev => ({
        ...prev,
        services: newServices
      }));

      setCollapsedServices(prev => ({
        ...prev,
        [index]: true
      }));

    } catch (error) {
      setError(error.message);
      setValidationErrors(prev => ({
        ...prev,
        [index]: error.message
      }));
    } finally {
      setLoading(prev => ({ ...prev, [index]: false }));
    }
  };

  const removeService = async (index) => {
    try {
      const service = formData.services[index];
      setLoading(prev => ({ ...prev, [index]: true }));
      
      if (service._id) {
        const result = await window.electron.deleteBookingService({
          bookingId: space.bookingId,
          serviceId: service._id
        });

        if (!result.success) {
          throw new Error(result.message || 'Failed to delete service');
        }
      }

      const roomResult = await window.electron.getRoomData();
      if (roomResult.success) {
        setSpaces(roomResult.data.spaces);
      }

      setFormData(prev => ({
        ...prev,
        services: prev.services.filter((_, i) => i !== index)
      }));

      const newCollapsed = {};
      Object.entries(collapsedServices).forEach(([key, value]) => {
        const keyNum = parseInt(key);
        if (keyNum < index) {
          newCollapsed[keyNum] = value;
        } else if (keyNum > index) {
          newCollapsed[keyNum - 1] = value;
        }
      });
      setCollapsedServices(newCollapsed);

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(prev => ({ ...prev, [index]: false }));
    }
  };

  const updateService = (index, field, value) => {
    const newServices = [...formData.services];
    newServices[index] = {
      ...newServices[index],
      [field]: field === 'units' || field === 'costPerUnit' ? 
        Number(value) || 0 : value,
      isPending: true
    };
    
    setFormData(prev => ({
      ...prev,
      services: newServices
    }));

    if (validationErrors[index]) {
      const newErrors = { ...validationErrors };
      delete newErrors[index];
      setValidationErrors(newErrors);
    }
  };

  const toggleServiceCollapse = (index) => {
    setCollapsedServices(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const calculateServiceTotal = (service) => {
    return (service.units || 0) * (service.costPerUnit || 0);
  };

  const calculateGrandTotal = () => {
    return formData.services.reduce((total, service) => 
      total + calculateServiceTotal(service), 0
    );
  };
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-lg">
            {error}
          </div>
        )}
        
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
                key={service._id || service._tempId || index}
                className="bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 
                  transition-colors"
              >
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
                      {!service.isPending && (
                        <span className="text-xs text-gray-500 ml-2">
                          {/* {formatDateTime(service.dateTime)} */}
                        </span>
                      )}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {!service.isPending && (
                      <span className="text-sm text-green-600">✓ Saved</span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setServiceToDelete(index);
                      }}
                      disabled={loading[index]}
                      className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {!collapsedServices[index] && (
                  <div className="px-4 pb-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-600">
                          Service Name*
                        </label>
                        <input
                          type="text"
                          value={service.serviceName}
                          onChange={(e) => updateService(index, 'serviceName', e.target.value)}
                          placeholder="Enter service name"
                          className="w-full px-4 py-2 rounded-lg border border-gray-200"
                        />
                      </div>

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

                      <div className="md:col-span-2 lg:col-span-3 pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">Total:</span>
                            <span className="text-lg font-semibold text-green-600">
                              ₹{calculateServiceTotal(service).toFixed(2)}
                            </span>
                          </div>
                          {service.isPending && (
                            <button
                              onClick={() => saveService(index)}
                              disabled={loading[index]}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg
                                hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                            >
                              <Save size={16} />
                              {loading[index] ? 'Saving...' : 'Save Changes'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

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

      {/* Delete Confirmation Modal */}
      {serviceToDelete !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full m-4">
            <h3 className="text-lg font-semibold mb-2">Delete Service</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this service? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setServiceToDelete(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  removeService(serviceToDelete);
                  setServiceToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ServicesForm;