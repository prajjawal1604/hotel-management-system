import { useRoomsStore } from '../../store/roomsStore';

const QuickStats = () => {
  const stats = useRoomsStore(state => state.stats);
  const spaces = useRoomsStore(state => state.spaces);

  // Debug logs
  console.log('Current stats:', stats);
  console.log('Current spaces:', spaces);

  // Add null check for spaces
  const now = new Date();
  const checkoutPending = spaces?.filter(space => {
    console.log('Checking space:', space);
    return space?.currentStatus === 'OCCUPIED' && 
           space?.bookingId?.checkOut && 
           new Date(space.bookingId.checkOut) < now;
  })?.length || 0;  // Default to 0 if undefined

  console.log('Computed checkout pending:', checkoutPending);

  const computedStats = {
    available: stats?.available || 0,
    maintenance: stats?.maintenance || 0,
    checkoutPending,
    occupied: (stats?.occupied || 0) - checkoutPending
  };

  const statCards = [
    { 
      label: 'Available Spaces', 
      value: computedStats.available, 
      color: 'text-green-600' 
    },
    { 
      label: 'Occupied Spaces', 
      value: computedStats.occupied,
      color: 'text-red-600' 
    },
    { 
      label: 'Checkout Pending', 
      value: checkoutPending, 
      color: 'text-amber-500' 
    },
    { 
      label: 'Maintenance', 
      value: computedStats.maintenance, 
      color: 'text-gray-600' 
    }
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
};

QuickStats.displayName = 'QuickStats';

export default QuickStats;