import React from "react";

const HotelBill = ({
  billingId = "N/A",
  billingDate = "N/A",
  guestName = "N/A",
  guestPhone = "N/A",
  guestAadhar = "N/A",
  guestNationality = "N/A",
  roomName = "N/A",
  roomType = "N/A",
  checkIn = "N/A",
  checkOut = "N/A",
  basePrice = 0,
  days = 0,
  roomCost = 0,
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
            }}
          >
            {header}
          </th>
        ))}
      </tr>
    </thead>
  );

  const renderTableCell = (value, isBold = false) => (
    <td
      style={{
        border: "1px solid #ddd",
        padding: "8px",
        fontWeight: isBold ? "bold" : "normal",
      }}
    >
      {value}
    </td>
  );

  const renderNoDataMessage = (colSpan, message) => (
    <tr>
      <td
        colSpan={colSpan}
        style={{
          textAlign: "center",
          padding: "8px",
        }}
      >
        {message}
      </td>
    </tr>
  );

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        margin: "20px auto",
        padding: "20px",
        backgroundColor: "#fff",
        maxWidth: "800px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        color: "#333",
      }}
    >
      {/* Billing Information */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "20px",
          fontSize: "14px",
        }}
      >
        <p>
          <strong>Billing ID:</strong> {billingId}
        </p>
        <p>
          <strong>Date:</strong> {billingDate}
        </p>
      </div>

      {/* Hotel Details */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h1 style={{ margin: 0, fontSize: "24px", color: "#007bff" }}>{orgName}</h1>
        <p>1234 Residency Lane, Bhubaneswar, Odisha, India</p>
        <p>Email: {orgEmail} | Phone: +91 98765 43210</p>
        <p>GST Number: {gstID}</p>
      </div>

      {/* Guest Details */}
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "15px", fontSize: "18px", color: "#333" }}>
          Guest Details
        </h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              {renderTableCell(`Name: ${guestName}`)}
              {renderTableCell(`Phone: ${guestPhone}`)}
            </tr>
            <tr>
              {renderTableCell(`Aadhar Number: ${guestAadhar}`)}
              {renderTableCell(`Nationality: ${guestNationality}`)}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Room Details */}
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "15px", fontSize: "18px", color: "#333" }}>
          Room Details and Cost
        </h2>
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
              {renderTableCell(`Price Per Day: ₹${basePrice}`)}
              {renderTableCell(`Total Days: ${days}`)}
            </tr>
            <tr>
              <td colSpan="2" style={{ border: "1px solid #ddd", padding: "8px" }}>
                <strong>Total Room Cost:</strong> ₹{roomCost}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Services */}
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "15px", fontSize: "18px", color: "#333" }}>
          Services
        </h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          {renderTableHeader(["Service Description", "Service Type", "Per Unit Cost", "Quantity", "Total Cost"])}
          <tbody>
            {services.length > 0 ? (
              services.map((service, index) => (
                <tr key={index}>
                  {renderTableCell(service.serviceName)}
                  {renderTableCell(service.serviceType)}
                  {renderTableCell(`₹${service.costPerUnit}`)}
                  {renderTableCell(service.units)}
                  {renderTableCell(`₹${service.costPerUnit * service.units}`)}
                </tr>
              ))
            ) : (
              renderNoDataMessage(5, "No services availed")
            )}
            <tr>
              <td colSpan="4" style={{ fontWeight: "bold", padding: "8px", textAlign: "right" }}>
                Subtotal:
              </td>
              {renderTableCell(`₹${servicesSubtotal}`, true)}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Miscellaneous Costs */}
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "15px", fontSize: "18px", color: "#333" }}>
          Miscellaneous Costs
        </h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          {renderTableHeader(["Cost Title", "Total Cost"])}
          <tbody>
            {misc.length > 0 ? (
              misc.map((item, index) => (
                <tr key={index}>
                  {renderTableCell(item.description)}
                  {renderTableCell(`₹${item.amount}`)}
                </tr>
              ))
            ) : (
              renderNoDataMessage(2, "No miscellaneous costs")
            )}
            <tr>
              {renderTableCell("Subtotal:", true)}
              {renderTableCell(`₹${miscSubtotal}`, true)}
            </tr>
          </tbody>
        </table>
      </div>

      {/* GST Details */}
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "15px", fontSize: "18px", color: "#333" }}>
          GST Details
        </h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          {renderTableHeader(["Type", "Percentage", "Total Cost"])}
          <tbody>
            <tr>
              {renderTableCell("SGST")}
              {renderTableCell(`${gstPercentage / 2}%`)}
              {renderTableCell(`₹${sgstCost}`)}
            </tr>
            <tr>
              {renderTableCell("CGST")}
              {renderTableCell(`${gstPercentage / 2}%`)}
              {renderTableCell(`₹${cgstCost}`)}
            </tr>
            <tr>
              {renderTableCell("Total GST", true)}
              <td colSpan="2" style={{ fontWeight: "bold", padding: "8px" }}>
                ₹{gstTotal}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Final Amount */}
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "15px", fontSize: "18px", color: "#333" }}>
          Final Amount
        </h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              {renderTableCell("Grand Total:", true)}
              {renderTableCell(`₹${grandTotal}`, true)}
            </tr>
            <tr>
              {renderTableCell("Advance Paid:")}
              {renderTableCell(`- ₹${advanceAmount}`)}
            </tr>
            <tr>
              {renderTableCell("Amount Due:", true)}
              {renderTableCell(`₹${amountDue}`, true)}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mode of Payment */}
      <p style={{ textAlign: "right", fontWeight: "bold" }}>Mode of Payment: {modeOfPayment}</p>

    </div>
  );
};

export default HotelBill;
