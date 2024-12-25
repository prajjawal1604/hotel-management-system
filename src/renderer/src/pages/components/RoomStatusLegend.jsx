const RoomStatusLegend = () => {
    const ROOM_STATUSES = {
        AVAILABLE: 'Available',
        OCCUPIED: 'Occupied',
        MAINTENANCE: 'Maintenance',
        CHECKOUT_PENDING: 'CheckoutPending'
      };
    
      const STATUS_COLORS = {
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
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-6">
          <span className="text-gray-600 font-medium">Room Status:</span>
          <div className="flex gap-6">
            {Object.entries(STATUS_COLORS).map(([status, config]) => (
              <div key={`${status}-2`} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded" 
                  style={{ backgroundColor: config.bg }}
                />
                <span className="text-sm text-gray-600">
                  {status === ROOM_STATUSES.CHECKOUT_PENDING ? 'Checkout Pending' : status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

export default RoomStatusLegend;