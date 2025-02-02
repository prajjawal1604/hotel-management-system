import React, { useState, useEffect } from 'react';
import ReactDOMServer from 'react-dom/server';
import { X, FileText, PlusCircle, Edit, Users } from 'lucide-react';
import HotelBill from './HotelBill';
import { useRoomsStore } from '../../../store/roomsStore';
import CheckoutDateTimeInput from '../../../components/CheckoutDateTimeInput';

const PAYMENT_MODES = {
  CASH: 'CASH',
  CREDIT_CARD: 'CREDIT_CARD',
  DEBIT_CARD: 'DEBIT_CARD',
  UPI: 'UPI',
  NET_BANKING: 'NET_BANKING'
};

const CheckoutModal = ({ formData, space, onClose }) => {
  // Base states
  const [checkoutData, setCheckoutData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modeOfPayment, setModeOfPayment] = useState(PAYMENT_MODES.CASH);
  const [miscCharges, setMiscCharges] = useState([]);
  const [checkoutDateTime, setCheckoutDateTime] = useState(new Date().toISOString());
  const [isEditingCheckout, setIsEditingCheckout] = useState(false);
  const [extraTariff, setExtraTariff] = useState({
    amount: formData.extraTariff?.amount || 0,
    remarks: formData.extraTariff?.remarks || '',
    guestCount: formData.extraTariff?.guestCount || 0,
  });

  // useEffect(() => {
  //   console.log('Extra Tariff updated:', extraTariff);
  // }, [extraTariff]);

  // Get advance amount and org details
  const advance = parseFloat(formData.advanceAmount);
  const orgDetails = useRoomsStore((state) => state.orgDetails);

  // Calculate total guests
  const calculateTotalGuests = () => {
    if (!formData.extraGuestCount || formData.extraGuestCount === 0) {
      return 1 + formData.additionalGuests.length; // Only additional registered guests
    } else {
      return 1 + formData.extraGuestCount; // Primary guest + extra guests
    }
  };

  // Check for valid checkout date
  useEffect(() => {
    const checkInDate = new Date(formData.checkIn);
    const checkOutDate = new Date(checkoutDateTime);
    
    if (checkOutDate < checkInDate) {
      setCheckoutDateTime(formData.checkIn);
      setError("Checkout date cannot be earlier than check-in date");
    }
  }, [checkoutDateTime, formData.checkIn]);

  // Helper function for calculating days
  const calculateDays = (checkIn, checkOut) => {
    const roundToPrevious8AM = (date) => {
      const roundedDate = new Date(date);
      roundedDate.setHours(8, 0, 0, 0);
      if (date.getHours() < 8) {
        roundedDate.setDate(roundedDate.getDate() - 1);
      }
      return roundedDate;
    };

    const roundToNext8AM = (date) => {
      const roundedDate = new Date(date);
      roundedDate.setHours(8, 0, 0, 0);
      if (date.getHours() >= 8) {
        roundedDate.setDate(roundedDate.getDate() + 1);
      }
      return roundedDate;
    };

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    const roundedCheckIn = roundToPrevious8AM(checkInDate);
    const roundedCheckOut = roundToNext8AM(checkOutDate);

    const timeDifference = roundedCheckOut - roundedCheckIn;
    const days = timeDifference / (1000 * 60 * 60 * 24);

    return days;
  };

  // Calculate checkout effect
  useEffect(() => {
    const calculateCheckout = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const days = calculateDays(formData.checkIn, checkoutDateTime);
        
        const result = await window.electron.calculateCheckout({
          spaceId: space._id,
          checkIn: formData.checkIn,
          checkOut: new Date(checkoutDateTime),
          services: formData.services,
          days: days,
          extraTariff: formData.extraTariff,
          extraGuestCount: formData.extraGuestCount || 0
        });

        if (!result.success) {
          throw new Error(result.message || 'Failed to calculate checkout details');
        }

        setCheckoutData({
          ...result.data,
          roomCharges: space.basePrice * days,
          extraTariffAmount: formData.extraTariff?.amount || 0
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    calculateCheckout();
  }, [space._id, formData.checkIn, checkoutDateTime, formData.services, formData.extraTariff, formData.extraGuestCount]);

  // Handle misc charges
  const addMiscCharge = () => {
    setMiscCharges([...miscCharges, { description: '', amount: '' }]);
  };

  const updateMiscCharge = (index, field, value) => {
    const updatedCharges = [...miscCharges];
    updatedCharges[index] = {
      ...updatedCharges[index],
      [field]: field === 'amount' ? value.replace(/[^\d.-]/g, '') : value
    };
    setMiscCharges(updatedCharges);
  };

  const removeMiscCharge = (index) => {
    setMiscCharges(miscCharges.filter((_, i) => i !== index));
  };

  // Calculate various totals
  const calculateTotals = () => {
    if (!checkoutData) return { grandTotal: 0 };

    const miscTotal = miscCharges.reduce((sum, charge) => 
      sum + (parseFloat(charge.amount) || 0), 0
    );

    const extraTariffAmount = extraTariff.amount || 0;
    
    const subtotal = checkoutData.roomCharges + 
                    checkoutData.serviceCharges + 
                    miscTotal + 
                    extraTariffAmount;

    // GST is applied to all charges except misc charges
    const gstableAmount = subtotal - miscTotal - extraTariffAmount - checkoutData.serviceCharges; 
    const gstAmount = gstableAmount * (orgDetails.gst / 100);

    return {
      roomCharges: checkoutData.roomCharges,
      serviceCharges: checkoutData.serviceCharges,
      miscTotal,
      extraTariffAmount,
      gstAmount,
      grandTotal: subtotal + gstAmount,
      subtotal
    };
  };

  // Get desktop path based on OS
  const getDesktopPath = async () => {
    const homeDir = await window.electron.getPath('home');
    const platform = await window.electron.getPlatform();
    
    switch (platform) {
      case 'win32':
        return `${homeDir}\\Desktop`;
      case 'darwin':
      case 'linux':
        return `${homeDir}/Desktop`;
      default:
        return homeDir;
    }
  };

  // Format date/time helpers
  const formatDisplayDateTime = (date) => {
    const d = new Date(date);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).replace(',', '');
  };
  
  const formatInputDateTime = (date) => {
    const d = new Date(date);
    return d.toISOString().slice(0, 16);
  };

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      setError(null);
  
      const totals = calculateTotals();
      const totalAmount = totals.grandTotal;
  
      // Get check-in and check-out dates for bill
      const checkInDate = new Date(formData.checkIn);
      const checkOutDate = new Date(checkoutDateTime);
      const days = calculateDays(formData.checkIn, checkoutDateTime);
  
      const checkoutData = {
        spaceId: space._id,
        bookingId: space.bookingId,
        modeOfPayment,
        checkOut: checkOutDate,
        charges: {
          roomCharges: totals.roomCharges,
          serviceCharges: totals.serviceCharges,
          miscCharges,
          extraTariff: extraTariff,
          gstAmount: totals.gstAmount,
          totalAmount: totalAmount
        },
        extraGuestCount: formData.extraGuestCount || 0,
        totalAmount: totalAmount
      };
  
      const result = await window.electron.completeCheckout(checkoutData);
  
      if (!result.success) {
        throw new Error(result.message || 'Checkout failed');
      }
  
      // Get all document paths
      const documentPaths = [
        ...(formData.documents?.map(doc => doc.filePath) || []),
        ...formData.additionalGuests.flatMap(guest => 
          guest.documents?.map(doc => doc.filePath) || []
        )
      ];

      console.log('Document paths before PDF:', documentPaths);
  
      // Generate PDF with document paths
      const path = await getDesktopPath();
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  
      const billHtml = (
        <HotelBill
          billingId={result.data._id}
          billingDate={new Date().toLocaleDateString()}
          hotelDetails={orgDetails}
          guestName={formData.fullName}
          guestPhone={formData.phoneNumber}
          guestDocument={formData.documentNumber}
          guestNationality={formData.nationality}
          roomName={space.spaceName}
          roomType={space.spaceType}
          checkIn={checkInDate.toLocaleDateString()}
          checkOut={checkOutDate.toLocaleDateString()}
          basePrice={space.basePrice}
          days={days}
          roomCost={totals.roomCharges}
          services={formData.services}
          servicesSubtotal={totals.serviceCharges}
          misc={miscCharges.map(charge => ({
            ...charge,
            amount: parseFloat(charge.amount) || 0
          }))}
          miscSubtotal={totals.miscTotal}
          extraTariff={{
            amount: totals.extraTariffAmount,
            remarks: formData.extraTariff?.remarks || '',
            guestCount: calculateTotalGuests() - 1 
          }}
          totalGuests={calculateTotalGuests()}
          gstPercentage={orgDetails.gst}
          sgstCost={totals.gstAmount / 2}
          cgstCost={totals.gstAmount / 2}
          gstTotal={totals.gstAmount}
          grandTotal={totals.grandTotal}
          advanceAmount={advance}
          amountDue={totals.grandTotal - advance}
          modeOfPayment={modeOfPayment}
          gstID={orgDetails.gstNumber}
          orgName={orgDetails.orgName}
          orgEmail={orgDetails.email}
        />
      );
      
      const billingHtml = ReactDOMServer.renderToString(billHtml);
    
      const pdfOptions = {
        htmlContent: billingHtml,
        imagePaths: documentPaths,
        savePath: `${path}/${orgDetails.orgName}/${currentYear}/${currentMonth}`,
        fileName: `${space.spaceName}-${result.data._id}.pdf`,
      };

  
      const pdfResult = await window.electron.generatePdf(pdfOptions);
      if (!pdfResult.success) throw new Error('Failed to generate PDF');
  
      // After PDF generation, clean up documents
      await window.electron.cleanupDocuments(space.bookingId);
  
      // Send email with checkout details
      // Email template with complete styling and data
      const emailData = {
        to: orgDetails.email,
        subject: 'Checkout Details',  
        html: billingHtml,
      };

  
      const response = window.electron.sendEmail(emailData);
      if (!response.success) {
        console.error('Failed to send email:', response.error);
      }
  
      // Get updated room data
      const roomData = await window.electron.getRoomData();
      if (roomData.success) {
        useRoomsStore.getState().setSpaces(roomData.data.spaces);
        useRoomsStore.getState().setStats(roomData.data.stats);
      }
  
      onClose();
    } catch (err) {
      setError(err.message);
      console.error('Checkout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state render
  if (isLoading || !checkoutData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-4xl w-full mx-4">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p>Calculating checkout details...</p>
          </div>
        </div>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b">
          <h2 className="text-2xl font-bold">Checkout - {space.spaceName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="my-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Guest Details Summary */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Guest Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><span className="font-medium">Name:</span> {formData.fullName}</p>
              <p><span className="font-medium">Phone:</span> {formData.phoneNumber}</p>
              <p><span className="font-medium">Check-in:</span> {formatDisplayDateTime(formData.checkIn)}</p>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Total Guests:</span>
                <span>{calculateTotalGuests()}</span>
                {formData.extraGuestCount > 0 && (
                  <span className="text-sm text-gray-500">
                    (including {formData.extraGuestCount} extra guests)
                  </span>
                )}
              </div>
              <p><span className="font-medium">Room Type:</span> {space.spaceType}</p>
              <div className="flex items-center gap-2">
                <span className="font-medium">Check-out:</span>
                <CheckoutDateTimeInput
                  value={checkoutDateTime}
                  isEditing={isEditingCheckout}
                  onSave={(newDateTime) => {
                    setCheckoutDateTime(newDateTime);
                    setIsEditingCheckout(false);
                  }}
                  onEditClick={() => setIsEditingCheckout(true)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Charges Breakdown */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Charges Breakdown</h3>
          <div className="space-y-4">
            {/* Room Charges */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <p className="font-medium">Room Charges</p>
                <p className="text-gray-600">₹{totals.roomCharges.toFixed(2)}</p>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {calculateDays(formData.checkIn, checkoutDateTime)} days @ ₹{space.basePrice}/day (8AM to 8AM policy)
              </p>
            </div>

            {/* Service Charges */}
            {formData.services.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <p className="font-medium">Service Charges</p>
                  <p className="text-gray-600">₹{totals.serviceCharges.toFixed(2)}</p>
                </div>
                <div className="mt-2 space-y-1">
                  {formData.services.map((service, index) => (
                    <div key={index} className="flex justify-between text-sm text-gray-500">
                      <span>{service.serviceName}</span>
                      <span>₹{(service.units * service.costPerUnit).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            

            {/* Misc Charges */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <p className="font-medium">Miscellaneous Charges</p>
                <button
                  onClick={addMiscCharge}
                  className="text-blue-600 flex items-center gap-1 text-sm"
                >
                  <PlusCircle size={16} />
                  Add Charge
                </button>
              </div>
              {miscCharges.map((charge, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={charge.description}
                    onChange={(e) => updateMiscCharge(index, 'description', e.target.value)}
                    placeholder="Description"
                    className="flex-1 px-3 py-1 border rounded-md"
                  />
                  <input
                    type="text"
                    value={charge.amount}
                    onChange={(e) => updateMiscCharge(index, 'amount', e.target.value)}
                    placeholder="Amount"
                    className="w-32 px-3 py-1 border rounded-md"
                  />
                  <button
                    onClick={() => removeMiscCharge(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X size={20} />
                  </button>
                </div>
              ))}
              {miscCharges.length > 0 && (
                <div className="flex justify-end mt-2">
                  <p className="text-gray-600">Total: ₹{totals.miscTotal.toFixed(2)}</p>
                </div>
              )}
            </div>

            {/* GST */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <p className="font-medium">GST ({orgDetails.gst}%)</p>
                <p className="text-gray-600">₹{totals.gstAmount.toFixed(2)}</p>
              </div>
              <div className="mt-2 space-y-1 text-sm text-gray-500">
                <div className="flex justify-between">
                  <span>CGST ({orgDetails.gst/2}%)</span>
                  <span>₹{(totals.gstAmount/2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST ({orgDetails.gst/2}%)</span>
                  <span>₹{(totals.gstAmount/2).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Advance Amount */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <p className="font-medium">Advance Amount</p>
                <p className="text-gray-600">₹{advance.toFixed(2)}</p>
              </div>
            </div>

           { /* Extra Tariff - Replace this whole section */}
           <div className="bg-gray-50 p-4 rounded-lg">
    <div className="flex justify-between items-center mb-4">
      <p className="font-medium">Extra Tariff</p>
    </div>
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Amount</label>
          <input
            type="number"
            min="0"
            value={extraTariff.amount}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              setExtraTariff((prev) => ({
                ...prev,
                amount: isNaN(value) || value < 0 ? 0 : value,
              }));
            }}
            placeholder="Amount"
            className="w-full px-3 py-1 border rounded-md"
          />
        </div>

        {/* Remarks Input */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Remark</label>
          <input
            type="text"
            value={extraTariff.remarks}
            onChange={(e) => {
              setExtraTariff((prev) => ({
                ...prev,
                remarks: e.target.value,
              }));
            }}
            placeholder="Remarks"
            className="w-full px-3 py-1 border rounded-md"
          />
        </div>

        {/* Guest Count Input */}
        {/* <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Guest Count</label>
          <input
            type="number"
            min="0"
            value={formData.extraTariff.guestCount}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              setExtraTariff((prev) => ({
                ...prev,
                guestCount: isNaN(value) || value < 0 ? 0 : value,
              }));
            }}
            placeholder="Guest Count"
            className="w-full px-3 py-1 border rounded-md"
          />
        </div> */}
      </div>
    </div>
  </div>

                        {/* Grand Total */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <p className="font-medium">Grand Total</p>
                <p className="text-gray-600">₹{totals.grandTotal.toFixed(2)}</p>
              </div>
            </div>

            {/* Total Amount Due */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <p className="font-medium">Total Amount Due</p>
                <p className="text-gray-600">₹{(totals.grandTotal - advance).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Mode of Payment
              </label>
              <select
                value={modeOfPayment}
                onChange={(e) => setModeOfPayment(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              >
                {Object.entries(PAYMENT_MODES).map(([key, value]) => (
                  <option key={value} value={value}>
                    {key.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-between items-center text-xl font-bold">
              <span>Total Amount Due:</span>
              <span className="text-green-600">₹{(totals.grandTotal - advance).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCheckout}
            disabled={isLoading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 
              disabled:opacity-50 flex items-center gap-2"
          >
            <FileText size={20} />
            {isLoading ? 'Processing...' : 'Complete Checkout'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;