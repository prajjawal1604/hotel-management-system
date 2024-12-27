import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useRoomsStore } from '../../../store/roomsStore';
import { useStore } from '../../../store/useStore'; // Add this import
import ConfirmationModal from '../modals/ConfirmationModal';
import RoomDetailsModal from '../modals/RoomDetailsModal';
import GuestDetailsModal from '../modals/GuestDetailsModal.jsx';
import BookingContainer from '../containers/BookingContainer';

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRoomDetails, setShowRoomDetails] = useState(false);
  const [showGuestDetails, setShowGuestDetails] = useState(false);
  const [showBookingContainer, setShowBookingContainer] = useState(false);

  const handleDelete = async () => {
    try {
      const response = await window.electron.deleteSpace(space._id);
      if (response.success) {
        useRoomsStore.getState().setSpaces(response.spaces);
        useRoomsStore.getState().setStats(response.stats);
        alert('Space deleted successfully');
      } else {
        alert(response.message || 'Failed to delete space');
      }
    } catch (error) {
      console.error('Failed to delete space:', error);
      alert('An error occurred while deleting the space');
    }
    setShowDeleteConfirm(false);
  };

  const canDelete = ['AVAILABLE', 'MAINTENANCE'].includes(space.currentStatus);
  const { auth: { userRole } } = useStore();
  const isAdmin = userRole === 'ADMIN';

  // Status-based styling
  const statusStyles = {
    AVAILABLE: 'bg-green-100 border-green-200 hover:bg-green-50',
    OCCUPIED: 'bg-red-100 border-red-200 hover:bg-red-50',
    MAINTENANCE: 'bg-gray-100 border-gray-200 hover:bg-gray-50'
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleCardClick = () => {
    if (!isAdmin) {
      setShowBookingContainer(true);
    } else {
      if (space.currentStatus === 'OCCUPIED') {
        setShowGuestDetails(true);
      } else {
        setShowRoomDetails(true);
      }
    }
  };

  return (
    <>
      <div 
        className={`rounded-lg p-4 border-2 transition-all cursor-pointer ${statusStyles[space.currentStatus]}`}
        onClick={handleCardClick}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">{space.spaceName}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {category?.name || category?.id || space.spaceType || 'Uncategorized'}
            </p>
            <p className="text-sm font-medium text-gray-700 mt-2">
              ₹{space.basePrice}
            </p>
          </div>
          {/* Only show delete button for admin */}
          {isAdmin && canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              className="p-1.5 text-gray-600 hover:bg-white rounded-full transition-colors"
              title="Delete Space"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {/* Status Tag and Guest Details */}
        <div className="mt-3">
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium
            ${space.currentStatus === 'AVAILABLE' ? 'bg-green-200 text-green-800' :
              space.currentStatus === 'OCCUPIED' ? 'bg-red-200 text-red-800' :
              'bg-gray-200 text-gray-800'}`}>
            {space.currentStatus}
          </span>

          {space.currentStatus === 'OCCUPIED' && space.bookingId && (
            <div className="mt-2 text-sm">
              <p className="text-gray-700 font-medium">
                Guest: {space.bookingId.guestId?.fullName || 'N/A'}
                {console.log(`space.bookingId.guestId?.fullName: ${space.bookingId._id}`)}
              </p>
              <div className="flex justify-between mt-1 text-gray-600">
                <span>In: {formatDate(space.bookingId.checkIn)}</span>
                <span>Out: {formatDate(space.bookingId.checkOut)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Only show delete confirmation for admin */}
      {isAdmin && showDeleteConfirm && (
        <ConfirmationModal
          title="Delete Space"
          message={`Are you sure you want to delete ${space.spaceName}? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {/* Add BookingContainer modal */}
      {showBookingContainer && (
        <BookingContainer
          space={space}
          category={category}
          onClose={() => setShowBookingContainer(false)}
        />
      )}

      {/* Modify existing modals to only show for admin */}
      {userRole === 'ADMIN' && showRoomDetails && (
        <RoomDetailsModal
          space={space}
          onClose={() => setShowRoomDetails(false)}
          isAdmin={isAdmin}
        />
      )}

      {userRole === 'ADMIN' && showGuestDetails && (
        <GuestDetailsModal
          guest={space.currentGuest}
          onClose={() => setShowGuestDetails(false)}
          isAdmin={isAdmin}
        />
      )}
    </>
  );
};

export default SpaceCard;