import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useRoomsStore } from '../store/roomsStore';
import AdminDashboard from './AdminDashboard';

const Dashboard = () => {
  const { auth: { isAuthenticated, userRole } } = useStore();
  const { setSpaces, setStats, setCategories, setOrgDetails } = useRoomsStore();

  // Fetch room data when dashboard mounts
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const [roomResult, orgResult] = await Promise.all([
          window.electron.getRoomData(),
          window.electron.getOrgDetails()
        ]);

        // Handle room data
        if (roomResult.success) {
          setSpaces(roomResult.data.spaces);
          setCategories(roomResult.data.categories);
          setStats(roomResult.data.stats);
        }

        // Handle org data
        if (orgResult.success) {
          setOrgDetails(orgResult.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (isAuthenticated) {
      fetchRoomData();
    }
  }, [isAuthenticated, setSpaces, setCategories, setStats, setOrgDetails]);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {userRole === 'ADMIN' ? (
        <AdminDashboard />
      ) : (
        // <FrontOfficeDashboard />
        <></>
      )}
    </div>
  );
};

export default Dashboard;