// src/utils/constants.js
export const ROOM_STATUS = {
    AVAILABLE: 'Available',
    OCCUPIED: 'Occupied',
    MAINTENANCE: 'Maintenance',
    CHECKOUT_PENDING: 'CheckoutPending'
  };
  
export const STATUS_COLORS = {
    [ROOM_STATUS.AVAILABLE]: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      style: {
        backgroundColor: '#dcfce7',
        color: '#166534'
      }
    },
    [ROOM_STATUS.OCCUPIED]: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      style: {
        backgroundColor: '#fee2e2',
        color: '#991b1b'
      }
    },
    [ROOM_STATUS.MAINTENANCE]: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      style: {
        backgroundColor: '#f3f4f6',
        color: '#1f2937'
      }
    },
    [ROOM_STATUS.CHECKOUT_PENDING]: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      style: {
        backgroundColor: '#fef3c7',
        color: '#92400e'
      }
    }
  };