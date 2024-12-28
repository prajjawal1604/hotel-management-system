import { Settings } from 'lucide-react';
import { useState } from 'react';
import AdvancedBookingModal from './AdvancedBookingModal.jsx';

const OrgDetailsButton = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
          transition-colors flex items-center gap-2"
      >
        <Settings size={16} />
        Advanced Booking
      </button>

      {showModal && <AdvancedBookingModal onClose={() => setShowModal(false)} />}
    </>
  );
};

export default OrgDetailsButton;