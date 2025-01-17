import React from "react";

const HotelBill = ({
  billingId = "N/A",
  billingDate = "N/A",
  guestName = "N/A",
  guestPhone = "N/A",
  guestDocument = "N/A",  // Changed from guestAadhar
  guestNationality = "N/A",
  roomName = "N/A",
  roomType = "N/A",
  checkIn = "N/A",
  checkOut = "N/A",
  basePrice = 0,
  days = 0,
  roomCost = 0,
  extraTariff = {},
  totalGuests = 0,
  services = [],
  servicesSubtotal = 0,
  misc = [],
  miscSubtotal = 0,
  gstPercentage = 0,
  sgstCost = 0,
  cgstCost = 0,
  gstTotal = 0,
  grandTotal = 0,
  advanceAmount = 0,
  amountDue = 0,
  modeOfPayment = "N/A",
  gstID = "N/A",
  orgName = "N/A",
  orgEmail = "N/A",
}) => {
  const renderTableHeader = (headers) => (
    <thead>
      <tr>
        {headers.map((header, index) => (
          <th
            key={index}
            style={{
              border: "1px solid #ddd",
              padding: "8px",
              backgroundColor: "#007bff",
              color: "#fff",
              textAlign: "left",
            }}
          >
            {header}
          </th>
        ))}
      </tr>
    </thead>
  );

  const renderTableCell = (value, isBold = false, align = "left") => (
    <td
      style={{
        border: "1px solid #ddd",
        padding: "8px",
        fontWeight: isBold ? "bold" : "normal",
        textAlign: align,
      }}
    >
      {value}
    </td>
  );

  const renderSectionHeader = (title) => (
    <h2 style={{ 
      textAlign: "center", 
      marginBottom: "15px", 
      fontSize: "18px", 
      color: "#333",
      backgroundColor: "#f8f9fa",
      padding: "10px",
      borderRadius: "4px"
    }}>
      {title}
    </h2>
  );
  console.log(extraTariff)

  return (
    <div style={{
      fontFamily: "Arial, sans-serif",
      margin: "auto auto",
      padding: "20px",
      backgroundColor: "#fff",
      maxWidth: "800px",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      color: "#333",
    }}>
      {/* Header Section */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "20px",
        fontSize: "14px",
        backgroundColor: "#f8f9fa",
        padding: "10px",
        borderRadius: "4px"
      }}>
        <p><strong>Billing ID:</strong> {billingId}</p>
        <p><strong>Date:</strong> {billingDate}</p>
      </div>

      {/* Hotel Details */}
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <h1 style={{ margin: 0, fontSize: "28px", color: "#007bff", marginBottom: "10px" }}>{orgName}</h1>
        <p style={{ margin: "5px 0" }}>Near Batamangala Temple, Jeypore Road, Koraput, Odisha - 764020</p>
        <p style={{ margin: "5px 0" }}>Email: {orgEmail} | Phone: 06852291018,0685225128</p>
        <p style={{ margin: "5px 0", fontWeight: "bold" }}>GST Number: {gstID}</p>
      </div>

      {/* Guest Details */}
      <div style={{ marginBottom: "20px", pageBreakInside: "avoid" }}>
        {renderSectionHeader("Guest Details")}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              {renderTableCell(`Name: ${guestName}`)}
              {renderTableCell(`Phone: ${guestPhone}`)}
            </tr>
            <tr>
              {renderTableCell(`Document Number: ${guestDocument}`)}
              {renderTableCell(`Nationality: ${guestNationality}`)}
            </tr>
            <tr>
              {renderTableCell(`Total Guests: ${totalGuests}`)}
              {extraTariff?.guestCount > 0 ? 
                renderTableCell(`Extra Guests: ${extraTariff.guestCount}`) :
                renderTableCell('Regular Booking')
              }
            </tr>
          </tbody>
        </table>
      </div>

      {/* Room Details */}
      <div style={{ marginBottom: "20px", pageBreakInside: "avoid" }}>
        {renderSectionHeader("Room Details and Cost")}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              {renderTableCell(`Room Name: ${roomName}`)}
              {renderTableCell(`Room Type: ${roomType}`)}
            </tr>
            <tr>
              {renderTableCell(`Check-In: ${checkIn}`)}
              {renderTableCell(`Check-Out: ${checkOut}`)}
            </tr>
            <tr>
              {renderTableCell(`Price Per Day: ₹${basePrice.toFixed(2)}`)}
              {renderTableCell(`Total Days: ${days}`)}
            </tr>
            <tr>
              <td colSpan="2" style={{ border: "1px solid #ddd", padding: "8px", backgroundColor: "#f8f9fa" }}>
                <strong>Total Room Cost:</strong> ₹{roomCost.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Extra Tariff Section */}
      {extraTariff?.amount > 0 && (
        <div style={{ marginBottom: "20px", pageBreakInside: "avoid" }}>
          {renderSectionHeader("Extra Tariff Details")}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            {renderTableHeader(["Description", "Guest Count", "Total Cost"])}
            <tbody>
              <tr>
                {renderTableCell(extraTariff.remarks || 'Extra Guest Charges')}
                {renderTableCell(extraTariff.guestCount)}
                {/* {renderTableCell(`₹${(extraTariff.amount / extraTariff.guestCount).toFixed(2)}`)} */}
                {renderTableCell(`₹${extraTariff.amount.toFixed(2)}`, true, "right")}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Services */}
      <div style={{ marginBottom: "20px", pageBreakInside: "avoid" }}>
        {renderSectionHeader("Services")}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          {renderTableHeader(["Service Description", "Service Type", "Per Unit Cost", "Quantity", "Total Cost"])}
          <tbody>
            {services.length > 0 ? (
              services.map((service, index) => (
                <tr key={index}>
                  {renderTableCell(service.serviceName)}
                  {renderTableCell(service.serviceType)}
                  {renderTableCell(`₹${service.costPerUnit.toFixed(2)}`, false, "right")}
                  {renderTableCell(service.units, false, "center")}
                  {renderTableCell(`₹${(service.costPerUnit * service.units).toFixed(2)}`, false, "right")}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "8px" }}>
                  No services availed
                </td>
              </tr>
            )}
            <tr>
              <td colSpan="4" style={{ fontWeight: "bold", padding: "8px", textAlign: "right", backgroundColor: "#f8f9fa" }}>
                Services Total:
              </td>
              {renderTableCell(`₹${servicesSubtotal.toFixed(2)}`, true, "right")}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Miscellaneous Costs */}
      <div style={{ marginBottom: "20px", pageBreakInside: "avoid" }}>
        {renderSectionHeader("Miscellaneous Costs")}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          {renderTableHeader(["Description", "Amount"])}
          <tbody>
            {misc.length > 0 ? (
              misc.map((item, index) => (
                <tr key={index}>
                  {renderTableCell(item.description)}
                  {renderTableCell(`₹${item.amount.toFixed(2)}`, false, "right")}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2" style={{ textAlign: "center", padding: "8px" }}>
                  No miscellaneous charges
                </td>
              </tr>
            )}
            {misc.length > 0 && (
              <tr>
                {renderTableCell("Misc Total:", true)}
                {renderTableCell(`₹${miscSubtotal.toFixed(2)}`, true, "right")}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* GST Details */}
      <div style={{ marginBottom: "20px", pageBreakInside: "avoid" }}>
        {renderSectionHeader("GST Details")}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          {renderTableHeader(["Type", "Percentage", "Amount"])}
          <tbody>
            <tr>
              {renderTableCell("SGST")}
              {renderTableCell(`${(gstPercentage / 2).toFixed(1)}%`, false, "center")}
              {renderTableCell(`₹${sgstCost.toFixed(2)}`, false, "right")}
            </tr>
            <tr>
              {renderTableCell("CGST")}
              {renderTableCell(`${(gstPercentage / 2).toFixed(1)}%`, false, "center")}
              {renderTableCell(`₹${cgstCost.toFixed(2)}`, false, "right")}
            </tr>
            <tr style={{ backgroundColor: "#f8f9fa" }}>
              {renderTableCell("Total GST", true)}
              {renderTableCell(`${gstPercentage.toFixed(1)}%`, true, "center")}
              {renderTableCell(`₹${gstTotal.toFixed(2)}`, true, "right")}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Final Amount */}
      <div style={{ marginBottom: "20px", pageBreakInside: "avoid", backgroundColor: "#f8f9fa", padding: "15px", borderRadius: "4px" }}>
        {renderSectionHeader("Final Amount")}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              {renderTableCell("Grand Total:", true, "right")}
              {renderTableCell(`₹${grandTotal.toFixed(2)}`, true, "right")}
            </tr>
            <tr>
              {renderTableCell("Advance Paid:", false, "right")}
              {renderTableCell(`- ₹${advanceAmount.toFixed(2)}`, false, "right")}
            </tr>
            <tr style={{ backgroundColor: "#e9ecef" }}>
              {renderTableCell("Final Amount Due:", true, "right")}
              {renderTableCell(`₹${amountDue.toFixed(2)}`, true, "right")}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mode of Payment */}
      <div style={{ 
        textAlign: "right", 
        fontWeight: "bold",
        backgroundColor: "#f8f9fa",
        padding: "10px",
        borderRadius: "4px",
        marginTop: "20px"
      }}>
        Mode of Payment: {modeOfPayment.replace('_', ' ')}
      </div>

      {/* Footer */}
      <div style={{ 
        marginTop: "30px", 
        textAlign: "center",
        borderTop: "1px solid #ddd",
        paddingTop: "20px",
        color: "#666",
        fontSize: "14px"
      }}>
        <p style={{ margin: "5px 0" }}>Thank you for choosing {orgName}!</p>
        <p style={{ margin: "5px 0" }}>For any queries, please contact us at {orgEmail}</p>
      </div>
    </div>
  );
};

export default HotelBill;