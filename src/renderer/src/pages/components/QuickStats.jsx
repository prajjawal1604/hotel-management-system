import { memo } from 'react';
import { useRoomsStore } from '../../store/roomsStore';

const QuickStats = memo(() => {
  const stats = useRoomsStore(state => state.stats);
  const spaces = useRoomsStore(state => state.spaces);

  // Calculate checkout pending
  const checkoutPending = spaces.filter(space => {
    if (space.currentStatus !== 'OCCUPIED') return false;
    if (!space.currentBooking?.checkOut) return false;
    
    const checkoutDate = new Date(space.currentBooking.checkOut);
    return checkoutDate < new Date();
  }).length;

  const statCards = [
    { 
      label: 'Available Rooms', 
      value: stats.available, 
      color: 'text-green-600' 
    },
    { 
      label: 'Occupied Rooms', 
      value: stats.occupied, 
      color: 'text-red-600' 
    },
    { 
      label: 'Checkout Pending', 
      value: checkoutPending, 
      color: 'text-amber-500' 
    },
    { 
      label: 'Maintenance', 
      value: stats.maintenance, 
      color: 'text-gray-600' 
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {statCards.map(({ label, value, color }) => (
        <div className="bg-white rounded-lg shadow-sm p-6" key={label}>
          <h3 className="text-gray-600 text-sm font-medium mb-2">{label}</h3>
          <p className={`text-4xl font-bold ${color}`}>{value || 0}</p>
        </div>
      ))}
    </div>
  );
});

QuickStats.displayName = 'QuickStats';

export default QuickStats;