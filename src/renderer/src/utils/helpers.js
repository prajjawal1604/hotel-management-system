// src/utils/helpers.js
export const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString()}`;
  };
  
  export const normalizeStatus = (status) => {
    const mapping = {
      [ROOM_STATUS.AVAILABLE]: 'Available',
      [ROOM_STATUS.OCCUPIED]: 'Occupied',
      [ROOM_STATUS.MAINTENANCE]: 'Maintenance',
      [ROOM_STATUS.CHECKOUT_PENDING]: 'Checkout Pending'
    };
    return mapping[status] || status;
  };
  
  export const calculateTimeUntilCheckout = (checkoutDate) => {
    const now = new Date();
    const checkOut = new Date(checkoutDate);
    const diff = checkOut - now;
  
    if (diff < 0) return 'Past checkout';
  
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m until checkout`;
  };