// src/constants/space.js

// Space Status Constants
export const SPACE_STATUSES = {
    AVAILABLE: 'AVAILABLE',
    OCCUPIED: 'OCCUPIED',
    MAINTENANCE: 'MAINTENANCE',
    CHECKOUT_PENDING: 'CHECKOUT_PENDING'  // Computed status
  };
  
  // Space Types from Schema
  export const SPACE_TYPES = {
    NON_AC: 'NON A/C',
    AC: 'A/C',
    SUIT: 'SUIT',
    DELUX: 'DELUX'
  };
  
  // Sort Options
  export const SORT_OPTIONS = {
    DEFAULT: 'default',
    PRICE_HIGH: 'price_high',
    PRICE_LOW: 'price_low'
  };
  
  // Status Colors (from your old code)
  export const STATUS_COLORS = {
    [SPACE_STATUSES.AVAILABLE]: {
      bg: '#dcfce7',
      text: '#166534',
      className: 'bg-green-100 text-green-800'
    },
    [SPACE_STATUSES.OCCUPIED]: {
      bg: '#fee2e2',
      text: '#991b1b',
      className: 'bg-red-100 text-red-800'
    },
    [SPACE_STATUSES.MAINTENANCE]: {
      bg: '#f3f4f6',
      text: '#1f2937',
      className: 'bg-gray-100 text-gray-800'
    },
    [SPACE_STATUSES.CHECKOUT_PENDING]: {
      bg: '#fef3c7',
      text: '#92400e',
      className: 'bg-yellow-100 text-yellow-800'
    }
  };