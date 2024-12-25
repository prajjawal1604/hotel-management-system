import { useState } from 'react';


// SpaceCard.jsx
const STATUS_COLORS = {
    'AVAILABLE': {
      bg: '#dcfce7',
      text: '#166534',
      className: 'bg-green-100 text-green-800'
    },
    'OCCUPIED': {
      bg: '#fee2e2',
      text: '#991b1b',
      className: 'bg-red-100 text-red-800'
    },
    'MAINTENANCE': {
      bg: '#f3f4f6',
      text: '#1f2937',
      className: 'bg-gray-100 text-gray-800'
    }
  };

  const SpaceCard = ({ space, category }) => {
    console.log('Space data:', space); // Debug log
  
    return (
      <div
        className={`p-4 rounded-lg transition-transform hover:scale-105 border border-gray-100
          cursor-pointer group relative ${STATUS_COLORS[space.currentStatus]?.className}`}
      >
        {/* Room Header */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold">{space.spaceName}</h3>
          <span 
            className={`text-sm px-3 py-0.5 rounded-full capitalize ${STATUS_COLORS[space.currentStatus]?.className}`}
          >
            {space.currentStatus.toLowerCase()}
          </span>
        </div>
  
        {/* Room Details */}
        <p className="text-sm mb-1">{space.spaceType}</p>
        <p className="font-medium">₹{space.basePrice}/night</p>
  
        {/* Guest Info - if room is occupied */}
        {space.bookingId && space.currentStatus === 'OCCUPIED' && (
          <div className="mt-2 text-sm space-y-1">
            {/* Add booking details here when implementing booking feature */}
          </div>
        )}
        
        {/* Max Occupancy */}
        {/* <div className="mt-2 text-sm">
          <p>Max Occupancy: {space.maxOccupancy.adults} Adults, {space.maxOccupancy.kids} Kids</p>
        </div> */}
      </div>
    );
  };

export default SpaceCard;