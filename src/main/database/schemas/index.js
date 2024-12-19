const mongoose = require('mongoose');

// Organization Schema (Master DB)
const organizationSchema = new mongoose.Schema({
    orgname: String,
    subscriptionEndDate: Date,
    subscribedOn: Date,
    orgDbUri: String,
    email: String,
    gstNumber: String,
    gst: String
});

// Hotel DB Schemas
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["ADMIN", "FRONT_OFFICE"], required: true }
});

const categorySchema = new mongoose.Schema({
    categoryName: { type: String, required: true },
    lastUpdated: { type: Date, default: Date.now }
});

const spaceSchema = new mongoose.Schema({
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    spaceName: { type: String, required: true },
    spaceType: { type: String, enum: ["NON A/C", "A/C", "SUIT", "DELUX"], required: true },
    currentStatus: { type: String, enum: ["AVAILABLE", "OCCUPIED", "MAINTENANCE"], default: "AVAILABLE" },
    basePrice: { type: Number, required: true },
    maxOccupancy: {
        adults: { type: Number, required: true },
        kids: { type: Number, required: true }
    },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    lastUpdated: { type: Date, default: Date.now }
});

const primaryGuestSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    phoneNumber: String,
    gender: { type: String, enum: ["MALE", "FEMALE", "OTHER"] },
    age: Number,
    aadharNumber: Number,
    nationality: String,
    address: String,
    documents: String,
    companyName: String,
    gstin: String,
    designation: String,
    purposeOfVisit: String
});

const additionalGuestSchema = new mongoose.Schema({
    fullName: String,
    phoneNumber: String,
    gender: { type: String, enum: ["MALE", "FEMALE", "OTHER"] },
    age: Number,
    aadharNumber: String,
    isKid: Boolean,
    documents: String
});

const serviceSchema = new mongoose.Schema({
    serviceName: String,
    serviceType: { type: String, enum: ["FOOD", "LAUNDRY", "HOUSEKEEPING", "OTHER"] },
    units: Number,
    remarks: String,
    costPerUnit: Number
});

const bookingSchema = new mongoose.Schema({
    spaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Space", required: true },
    guestId: { type: mongoose.Schema.Types.ObjectId, ref: "PrimaryGuest", required: true },
    additionalGuestIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "AdditionalGuest" }],
    serviceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }],
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    advanceAmount: { type: Number, default: 0 },
    bookingType: { type: String, enum: ["Advance", "Current"], required: true },
    modeOfPayment: { type: String, enum: ["CASH", "CREDIT_CARD", "DEBIT_CARD", "UPI", "NET_BANKING"], required: true },
    status: { type: String, enum: ["ONGOING", "COMPLETED", "CANCELLED"], default: "ONGOING" }
});

const invoiceSchema = new mongoose.Schema({
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    totalAmount: Number,
    paymentDate: Date
});

module.exports = {
    organization: organizationSchema,
    user: userSchema,
    category: categorySchema,
    space: spaceSchema,
    primaryGuest: primaryGuestSchema,
    additionalGuest: additionalGuestSchema,
    service: serviceSchema,
    booking: bookingSchema,
    invoice: invoiceSchema
};