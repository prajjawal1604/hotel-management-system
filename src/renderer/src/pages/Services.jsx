import { useState, useEffect } from 'react';
import { PlusCircle, X, Save, ChevronDown, ChevronRight } from 'lucide-react';

const ConfirmationDialog = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-lg font-semibold mb-2">Discard Changes?</h3>
        <p className="text-gray-600 mb-4">
          You have unsaved changes. Are you sure you want to discard them?
        </p>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            onClick={onConfirm}
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
};

const DeleteServiceDialog = ({ isOpen, onClose, onConfirm, serviceName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-lg font-semibold mb-2">Delete Service?</h3>
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete {serviceName || 'this service'}? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const ServicesForm = ({ formData, setFormData, room, onClose }) => {
  const [originalServices, setOriginalServices] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [collapsedServices, setCollapsedServices] = useState({});
  const [serviceToDelete, setServiceToDelete] = useState(null);

  useEffect(() => {
    const initialCollapsedState = {};
    // Set all existing services to collapsed
    formData.services?.forEach((_, index) => {
      initialCollapsedState[index] = true; // true means collapsed
    });
    setCollapsedServices(initialCollapsedState);
  }, []);

  useEffect(() => {
    setOriginalServices(JSON.stringify(formData.services || []));
  }, []);

  useEffect(() => {
    const currentServices = JSON.stringify(formData.services || []);
    setHasUnsavedChanges(currentServices !== originalServices);
  }, [formData.services, originalServices]);

  const handleRemoveService = (index) => {
    setServiceToDelete(index);
  };

  const toggleServiceCollapse = (index) => {
    setCollapsedServices(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const validateServices = () => {
    const errors = {};
    formData.services.forEach((service, index) => {
      if (!service.name?.trim()) {
        errors[`${index}-name`] = 'Service name is required';
      }
      if (!service.cost || service.cost <= 0) {
        errors[`${index}-cost`] = 'Cost must be greater than 0';
      }
      if (!service.units || service.units < 1) {
        errors[`${index}-units`] = 'Units must be at least 1';
      }
      if (!service.date) {
        errors[`${index}-date`] = 'Date is required';
      }
      if (!service.time) {
        errors[`${index}-time`] = 'Time is required';
      }
    });
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const addService = () => {
    const newService = {
      name: '',
      remark: '',
      units: 1,
      cost: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0,5),
      type: 'Facility'
    };
    setFormData({
      ...formData,
      services: [...(formData.services || []), newService]
    });
    setCollapsedServices(prev => ({
      ...prev,
      [formData.services.length]: false
    }));
  };

  const removeService = (index) => {
    const newServices = formData.services.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      services: newServices
    });
    const newCollapsed = { ...collapsedServices };
    delete newCollapsed[index];
    setCollapsedServices(newCollapsed);
  };

  const updateService = (index, field, value) => {
    const newServices = [...formData.services];
    newServices[index] = {
      ...newServices[index],
      [field]: field === 'units' || field === 'cost' ? Number(value) : value
    };
    setFormData({
      ...formData,
      services: newServices
    });
    if (validationErrors[`${index}-${field}`]) {
      const newErrors = { ...validationErrors };
      delete newErrors[`${index}-${field}`];
      setValidationErrors(newErrors);
    }
  };

  const handleSave = async () => {
    if (!validateServices()) {
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);

      const result = await window.electron.updateRoom({
        name: room.name,
        currentGuest: {
          ...room.currentGuest,
          services: formData.services
        }
      });

      if (!result.success) {
        throw new Error(result.message || 'Failed to save services');
      }

      setOriginalServices(JSON.stringify(formData.services));
      setHasUnsavedChanges(false);
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = (e) => {
    if (hasUnsavedChanges) {
      e?.preventDefault();
      setShowDiscardDialog(true);
      return;
    }
    onClose?.();
  };

  const serviceTypes = ['Facility', 'Food & Beverage', 'Housekeeping', 'Laundry', 'Other'];

  return (
    <div className="space-y-6">
      {saveError && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4">
          <div className="ml-3">
            <p className="text-sm text-red-700">{saveError}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Additional Services</h3>
            <p className="text-sm text-gray-600 mt-1">Add or modify services for the current guest</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addService}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <PlusCircle className="h-5 w-5" />
              Add Service
            </button>
            {hasUnsavedChanges && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Save className="h-5 w-5" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>

        {formData.services?.length === 0 ? (
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
                className="bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
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
                      {service.name || `Service #${index + 1}`}
                      {service.name && <span className="text-sm text-gray-500 ml-2">
                        (₹{(service.units * service.cost).toFixed(2)})
                      </span>}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveService(index);
                      }}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {!collapsedServices[index] && (
                  <div className="px-4 pb-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                      {/* Service Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Service Name*
                        </label>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 rounded-md border ${
                            validationErrors[`${index}-name`] ? 'border-red-500' : 'border-gray-200'
                          } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          value={service.name}
                          onChange={(e) => updateService(index, 'name', e.target.value)}
                          placeholder="Enter service name"
                        />
                        {validationErrors[`${index}-name`] && (
                          <p className="mt-1 text-sm text-red-500">{validationErrors[`${index}-name`]}</p>
                        )}
                      </div>

                      {/* Service Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Type
                        </label>
                        <select
                          className="w-full px-3 py-2 rounded-md border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={service.type}
                          onChange={(e) => updateService(index, 'type', e.target.value)}
                        >
                          {serviceTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      {/* Units */}
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Units*
                        </label>
                        <input
                          type="number"
                          className={`w-full px-3 py-2 rounded-md border ${
                            validationErrors[`${index}-units`] ? 'border-red-500' : 'border-gray-200'
                          } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          value={service.units}
                          onChange={(e) => updateService(index, 'units', e.target.value)}
                          min="1"
                        />
                        {validationErrors[`${index}-units`] && (
                          <p className="mt-1 text-sm text-red-500">{validationErrors[`${index}-units`]}</p>
                        )}
                      </div>

                      {/* Cost per Unit */}
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Cost per Unit*
                        </label>
                        <input
                          type="number"
                          className={`w-full px-3 py-2 rounded-md border ${
                            validationErrors[`${index}-cost`] ? 'border-red-500' : 'border-gray-200'
                          } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          value={service.cost}
                          onChange={(e) => updateService(index, 'cost', e.target.value)}
                          min="0"
                        />
                        {validationErrors[`${index}-cost`] && (
                          <p className="mt-1 text-sm text-red-500">{validationErrors[`${index}-cost`]}</p>
                        )}
                      </div>

                      {/* Date & Time */}
                      <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                          Date & Time*
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="date"
                            className={`flex-1 px-3 py-2 rounded-md border ${
                              validationErrors[`${index}-date`] ? 'border-red-500' : 'border-gray-200'
                            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            value={service.date}
                            onChange={(e) => updateService(index, 'date', e.target.value)}
                          />
                          <input
                            type="time"
                            className={`w-24 px-3 py-2 rounded-md border ${
                              validationErrors[`${index}-time`] ? 'border-red-500' : 'border-gray-200'
                            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            value={service.time}
                            onChange={(e) => updateService(index, 'time', e.target.value)}
                          />
                        </div>
                        {(validationErrors[`${index}-date`] || validationErrors[`${index}-time`]) && (
                          <p className="mt-1 text-sm text-red-500">Please select both date and time</p>
                        )}
                      </div>

                      {/* Remarks */}
                      <div className="md:col-span-2 lg:col-span-3">
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Remarks
                        </label>
                        <textarea
                          className="w-full px-3 py-2 rounded-md border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={service.remark}
                          onChange={(e) => updateService(index, 'remark', e.target.value)}
                          placeholder="Add any additional notes or remarks about this service"
                          rows="2"
                        />
                      </div>

                      {/* Total for this service */}
                      <div className="md:col-span-2 lg:col-span-3 pt-2 border-t">
                        <div className="flex justify-end items-center gap-2">
                          <span className="text-gray-600">Total:</span>
                          <span className="text-lg font-semibold text-green-600">
                            ₹{(service.units * service.cost).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Services Summary */}
            {formData.services.length > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Total Services Cost:</span>
                  <span className="text-xl font-bold text-green-600">
                    ₹{formData.services.reduce((sum, service) => 
                      sum + (service.units * service.cost), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog 
        isOpen={showDiscardDialog}
        onClose={() => setShowDiscardDialog(false)}
        onConfirm={() => {
          setShowDiscardDialog(false);
          onClose?.();
        }}
      />

      <DeleteServiceDialog
        isOpen={serviceToDelete !== null}
        onClose={() => setServiceToDelete(null)}
        onConfirm={() => {
          if (serviceToDelete !== null) {
            removeService(serviceToDelete);
            setServiceToDelete(null);
          }
        }}
        serviceName={serviceToDelete !== null ? 
          formData.services[serviceToDelete]?.name || `Service #${serviceToDelete + 1}` : 
          ''
        }
      />
    </div>
  );
};

export default ServicesForm;

