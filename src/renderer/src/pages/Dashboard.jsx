import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useRoomsStore } from '../store/roomsStore';
import AdminDashboard from './AdminDashboard';
import FrontOfficeDashboard from './FrontOfficeDashboard';

const Dashboard = () => {
  const { auth: { isAuthenticated, userRole } } = useStore();
  const { setSpaces, setStats, setCategories, setOrgDetails } = useRoomsStore();

  // Function to fetch room data
  const fetchRoomData = async () => {
    try {
      const [roomResult, orgResult] = await Promise.all([
        window.electron.getRoomData(),
        window.electron.getOrgDetails()
      ]);

      if (roomResult.success) {
        setSpaces(roomResult.data.spaces);
        setCategories(roomResult.data.categories);
        setStats(roomResult.data.stats);
      }

      if (orgResult.success) {
        setOrgDetails(orgResult.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Initial data fetch and auto-refresh setup
  useEffect(() => {
    if (isAuthenticated) {
      // Initial fetch
      fetchRoomData();

      // Set up auto-refresh every 30 minutes
      const refreshInterval = setInterval(fetchRoomData, 30 * 60 * 1000);

      // Cleanup on unmount
      return () => clearInterval(refreshInterval);
    }
  }, [isAuthenticated]);

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