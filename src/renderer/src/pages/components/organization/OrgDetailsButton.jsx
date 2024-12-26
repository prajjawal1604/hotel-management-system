// components/organization/OrgDetailsButton.jsx
import { Settings } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../../../store/useStore';
import OrgDetailsModal from './OrgDetailsModal';

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
        Organization Settings
      </button>

      {showModal && <OrgDetailsModal onClose={() => setShowModal(false)} />}
    </>
  );
};

export default OrgDetailsButton;