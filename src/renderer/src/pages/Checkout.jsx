import { useState, useEffect } from "react";
import { X, FileText, Trash2, Plus, FileUp } from "lucide-react";

const formatNumber = (numberField) => {
  if (!numberField) return '';
  // Check if it's MongoDB format
  if (numberField.$numberLong) {
    return numberField.$numberLong.toString();
  }
  return numberField.toString();
};

const GuestDetailsSection = ({ guest, isDependent = false }) => (
  <div className={`${!isDependent ? 'border rounded-lg p-4' : 'border-t pt-4'} mb-4`}>
      <h4 className="font-medium mb-2">{isDependent ? 'Dependent Guest:' : 'Primary Guest Details:'}</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p><span className="font-medium">Name:</span> {guest.name}</p>
          <p><span className="font-medium">Phone:</span> {formatNumber(guest.phone_no)}</p>
          <p><span className="font-medium">Gender:</span> {guest.gender}</p>
          <p><span className="font-medium">Age:</span> {guest.age}</p>
          <p><span className="font-medium">Aadhar:</span> {formatNumber(guest.aadhar)}</p>
          <p><span className="font-medium">Nationality:</span> {guest.nationality}</p>
        </div>
        <div>
          <p><span className="font-medium">Address:</span> {guest.permanent_address}</p>
          {guest.company_name && <p><span className="font-medium">Company:</span> {guest.company_name}</p>}
          {guest.GSTIN && <p><span className="font-medium">GSTIN:</span> {guest.GSTIN}</p>}
          {guest.designation && <p><span className="font-medium">Designation:</span> {guest.designation}</p>}
          {guest.purpose_of_visit && (
            <p><span className="font-medium">Purpose:</span> {guest.purpose_of_visit}</p>
          )}
        </div>
        {guest.dependants?.length > 0 && (
          <div className="col-span-2 mt-4">
            <p className="font-medium mb-2">Additional Guests:</p>
            <div className="space-y-1">
              {guest.dependants.map((dependant, index) => (
                <p key={index} className="text-sm">
                  {index + 1}. {dependant.name} (Aadhar: {formatNumber(dependant.aadhar)})
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>

    
);

const CheckoutModal = ({ room, onClose, onCheckout }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [costDetails, setCostDetails] = useState(null);
  const [miscCharges, setMiscCharges] = useState([]);
  const [error, setError] = useState(null);

  const hotelDetails = {
    name: "Maa Mangala Residency",
    address: "Near Batamangala Temple, Jeypore Road, Koraput",
    gstin: "21ANKPP0202H1ZH",
    phone: "9439009761/67",
    state: "Odisha - 764020",
  };

  useEffect(() => {
    const loadCostDetails = async () => {
      try {
        const result = await window.electron.calculateCheckout(room.name);
        if (result.success) {
          setCostDetails(result.data);
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        setError(error.message);
        console.error("Error loading cost details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCostDetails();
  }, [room.name]);

  const calculateTotal = () => {
    if (!costDetails) return 0;
    const miscTotal = miscCharges.reduce((sum, misc) => sum + Number(misc.amount || 0), 0);
    return (
      costDetails.roomCharges +
      costDetails.serviceCharges +
      costDetails.gstAmount +
      miscTotal
    );
  };
  


  const handleAddMiscCharge = () => {
    setMiscCharges([...miscCharges, { remark: "", amount: "" }]);
  };

  const handleMiscChange = (index, field, value) => {
    const updatedCharges = [...miscCharges];
    updatedCharges[index] = {
      ...updatedCharges[index],
      [field]: field === "amount" ? value.replace(/[^\d.-]/g, "") : value,
    };
    setMiscCharges(updatedCharges);
  };

  const handleRemoveMiscCharge = (index) => {
    setMiscCharges(miscCharges.filter((_, i) => i !== index));
  };

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      setError(null);
  
      const billNo = new Date().getTime().toString();
      const checkoutTime = new Date().toISOString();
  
      // Prepare complete booking data with the exact structure we want in DB
      const bookingData = {
        billNo,
        hotelDetails,
        roomDetails: {
          name: room.name,
          category: room.categoryName,
          type: room.type,
          baseRate: room.basePricePerNight,
          gstPercentage: room.gstPercentage
        },
        guestDetails: {
          ...room.currentGuest,
          uploads: room.currentGuest.uploads || [], // Keep uploads for PDF generation
          phone_no: formatNumber(room.currentGuest.phone_no),
          aadhar: formatNumber(room.currentGuest.aadhar),
          dependants: (room.currentGuest.dependants || []).map(dep => ({
            ...dep,
            phone_no: formatNumber(dep.phone_no),
            aadhar: formatNumber(dep.aadhar)
          }))
        },
        stayDetails: {
          checkin: room.currentGuest.checkin,
          checkout: checkoutTime,
          fullDays: costDetails.breakdown.fullDays,
          extraHours: costDetails.breakdown.extraHours || 0,
          miceCharges: costDetails.miceCharges || 0
        },
        charges: {
          roomCharges: costDetails.roomCharges,
          miceCharges: costDetails.miceCharges || 0,
          serviceCharges: costDetails.serviceCharges,
          gstAmount: costDetails.gstAmount,
          gstBreakdown: {
            cgst: costDetails.gstAmount / 2,
            sgst: costDetails.gstAmount / 2
          },
          miscCharges: miscCharges,
          totalAmount: calculateTotal()
        },
        totalAmount: calculateTotal(),
        services: costDetails.breakdown.servicesBreakdown || [],
        status: 'COMPLETED',
        checkoutTimestamp: checkoutTime
      };
  
      const bookingResult = await window.electron.saveBooking(bookingData);
      if (!bookingResult.success) {
        throw new Error('Failed to save booking record');
      }
  
      // Generate PDF
      const pdfResult = await window.electron.generatePdf({
        ...bookingData,
        _id: bookingResult.data._id
      });
  
      if (!pdfResult.success) {
        throw new Error('Failed to generate PDF');
      }
  
      // Show success message
      await window.electron.showNotification({
        title: 'Checkout Complete',
        body: `Invoice saved to: ${pdfResult.filePath}`
      });
  
      // Clear room data
      await window.electron.updateRoom({
        name: room.name,
        status: 'Available',
        currentGuest: null,
        lastUpdated: new Date().toISOString()
      });
  
      onClose();
    } catch (error) {
      setError(error.message);
      console.error("Checkout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !costDetails) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-4xl w-full mx-4">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p>Loading checkout details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b">
          <h2 className="text-2xl font-bold">INVOICE</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Hotel Details */}
        <div className="flex justify-between  border-b-2 border-gray-200 py-4">
          <div>
          <h2 className="text-2xl font-bold mb-2">{hotelDetails.name}</h2>
          <p className="text-sm text-gray-600">{hotelDetails.address}</p>
          <p className="text-sm text-gray-600">Phone: {hotelDetails.phone}</p>
          <p className="text-sm text-gray-600">{hotelDetails.state}</p>
          <p className="text-sm font-medium mt-2">GSTIN: {hotelDetails.gstin}</p>

          </div>
          <div className="flex flex-col  justify-start mr-[2rem] ">
          <h3 className="text-xl font-bold">TAX INVOICE</h3>
          <p className="text-sm text-gray-600">
            Date: {new Date().toLocaleDateString()}<br/>Bill No: {new Date().getTime()}  
          </p>
        </div>

        </div>

        {/* Tax Invoice Title */}
        

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Guest Details */}
        <GuestDetailsSection guest={room.currentGuest} />

        {/* Charges Breakdown */}
        <div className="border rounded-lg p-4 mb-4">
          <h4 className="font-medium mb-4">Charges Breakdown:</h4>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Description</th>
                <th className="text-right py-2">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {/* Room Charges */}
              <tr>
                <td className="py-2">
                  Room Charges ({costDetails.breakdown.fullDays} days @ ₹
                  {costDetails.breakdown.baseRate}/day)
                </td>
                <td className="text-right">₹{costDetails.roomCharges.toFixed(2)}</td>
              </tr>

              {/* Services */}
              {costDetails.breakdown.servicesBreakdown?.map((service, index) => (
                <tr key={index}>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      {service.name} (₹{service.cost} × {service.units})
                    </div>
                  </td>
                  <td className="text-right">₹{(service.cost * service.units).toFixed(2)}</td>
                </tr>
              ))}

              {/* GST */}
              <tr>
                <td className="py-2">CGST ({room.gstPercentage / 2}%)</td>
                <td className="text-right">₹{(costDetails.gstAmount / 2).toFixed(2)}</td>
              </tr>
              <tr>
                <td className="py-2">SGST ({room.gstPercentage / 2}%)</td>
                <td className="text-right">₹{(costDetails.gstAmount / 2).toFixed(2)}</td>
              </tr>

              {/* Misc Charges */}
              {miscCharges.map((misc, index) => (
                <tr key={index}>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        className="border rounded px-2 py-1 w-48"
                        placeholder="Remark"
                        value={misc.remark}
                        onChange={(e) => handleMiscChange(index, "remark", e.target.value)}
                      />
                      <input
                        type="text"
                        className="border rounded px-2 py-1 w-24"
                        placeholder="Amount"
                        value={misc.amount}
                        onChange={(e) => handleMiscChange(index, "amount", e.target.value)}
                      />
                      <button 
                        onClick={() => handleRemoveMiscCharge(index)}
                        className="text-gray-500 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                  <td className="text-right">₹{Number(misc.amount || 0).toFixed(2)}</td>
                </tr>
              ))}

              {/* Add Misc Charge Button */}
              <tr>
                <td colSpan={2} className="py-2">
                  <button
                    onClick={handleAddMiscCharge}
                    className="flex items-center gap-2 text-blue-500 hover:text-blue-700"
                  >
                    <Plus size={16} /> Add Misc Charge
                  </button>
                </td>
              </tr>
            </tbody>

            {/* Total */}
            <tfoot>
              <tr className="border-t font-bold">
                <td className="py-2">Grand Total</td>
                <td className="text-right">₹{calculateTotal().toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCheckout}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 
              flex items-center gap-2 disabled:opacity-50"
          >
            <FileText size={20} />
            {isLoading ? "Processing..." : "Checkout & Generate Bill"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;