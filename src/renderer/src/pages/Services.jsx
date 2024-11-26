// ServicesForm.jsx
import { PlusCircle, X } from 'lucide-react';

const ServicesForm = ({ formData, setFormData }) => {
  // Add a new service
  const addService = () => {
    setFormData({
      ...formData,
      services: [...(formData.services || []), {
        name: '',
        remark: '',
        units: 1,
        cost: 0,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0,5),
        type: 'Facility'
      }]
    });
  };

  // Remove a service
  const removeService = (index) => {
    const newServices = formData.services.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      services: newServices
    });
  };

  // Update a service
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
  };

  const serviceTypes = ['Facility', 'Food & Beverage', 'Housekeeping', 'Laundry', 'Other'];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Additional Services</h3>
          <button
            type="button"
            onClick={addService}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <PlusCircle className="h-5 w-5" />
            Add Service
          </button>
        </div>

        {formData.services?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No services added yet. Click "Add Service" to begin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Service Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Units</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Cost per Unit</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Date & Time</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Total</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {formData.services.map((service, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        className="w-full px-3 py-1.5 rounded-md border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={service.name}
                        onChange={(e) => updateService(index, 'name', e.target.value)}
                        placeholder="Service name"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="w-full px-3 py-1.5 rounded-md border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={service.type}
                        onChange={(e) => updateService(index, 'type', e.target.value)}
                      >
                        {serviceTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        className="w-20 px-3 py-1.5 rounded-md border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={service.units}
                        onChange={(e) => updateService(index, 'units', e.target.value)}
                        min="1"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        className="w-24 px-3 py-1.5 rounded-md border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={service.cost}
                        onChange={(e) => updateService(index, 'cost', e.target.value)}
                        min="0"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <input
                          type="date"
                          className="w-32 px-3 py-1.5 rounded-md border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={service.date}
                          onChange={(e) => updateService(index, 'date', e.target.value)}
                        />
                        <input
                          type="time"
                          className="w-24 px-3 py-1.5 rounded-md border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={service.time}
                          onChange={(e) => updateService(index, 'time', e.target.value)}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      ₹{service.units * service.cost}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => removeService(index)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-right font-medium text-gray-600">
                    Total Services Cost:
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-semibold">
                    ₹{formData.services.reduce((sum, service) => sum + (service.units * service.cost), 0)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicesForm;