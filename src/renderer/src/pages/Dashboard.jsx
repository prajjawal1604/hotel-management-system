import { Navigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useRoomsStore } from '../store/roomsStore';
import AdminDashboard from './AdminDashboard';
import FrontOfficeDashboard from './FrontOfficeDashboard.jsx';

const Dashboard = () => {
  const { auth: { isAuthenticated, userRole } } = useStore();
  
  // Rooms state
  const { spaces, stats } = useRoomsStore();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {userRole === 'ADMIN' ? (
        <AdminDashboard />
      ) : (
        <FrontOfficeDashboard />
      )}
    </div>
  );
};

export default Dashboard;