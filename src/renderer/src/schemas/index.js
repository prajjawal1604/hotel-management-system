// src/schemas/index.js
export const RoomSchema = {
    name: String,
    type: String,
    status: String, // 'Available', 'Occupied', 'Maintenance', 'CheckoutPending'
    basePricePerNight: Number,
    gstPercentage: Number,
    currentGuest: {}, // Will be populated with BookingSchema data when occupied
    maxPeople: {
      kids: Number,
      adults: Number
    },
    lastUpdated: String,
    categoryName: String,
    categoryType: String
  };
  
  export const BookingSchema = {
    category_name: String,
    space_name: String,
    name: String,
    phone_no: Number,
    gender: String,
    aadhar: Number,
    age: Number,
    permanent_address: String,
    company_name: String,
    nationality: String,
    designation: String,
    purpose_of_visit: String,
    dependants: Array, // Array of { name, phone_no, gender, aadhar, age, kid }
    GSTIN: String,
    services: Array, // Array of { name, remark, units, cost }
    total_cost: Number,
    method_of_payment: String,
    checkin: Date,
    checkout: Date
  };
  
  export const CategorySchema = {
    name: String,
    type: String,
    lastUpdated: String
  };
  
  // Constants for the application
  export const ROOM_STATUSES = {
    AVAILABLE: 'Available',
    OCCUPIED: 'Occupied',
    MAINTENANCE: 'Maintenance',
    CHECKOUT_PENDING: 'CheckoutPending'
  };
  
  export const STATUS_COLORS = {
    [ROOM_STATUSES.AVAILABLE]: {
      bg: '#dcfce7',
      text: '#166534',
      className: 'bg-green-100 text-green-800'
    },
    [ROOM_STATUSES.OCCUPIED]: {
      bg: '#fee2e2',
      text: '#991b1b',
      className: 'bg-red-100 text-red-800'
    },
    [ROOM_STATUSES.MAINTENANCE]: {
      bg: '#f3f4f6',
      text: '#1f2937',
      className: 'bg-gray-100 text-gray-800'
    },
    [ROOM_STATUSES.CHECKOUT_PENDING]: {
      bg: '#fef3c7',
      text: '#92400e',
      className: 'bg-yellow-100 text-yellow-800'
    }
  };