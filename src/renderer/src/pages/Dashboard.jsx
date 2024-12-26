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
        const result = await window.electron.getRoomData();
        const orgResult = await window.electron.getOrgDetails();
        if (result.success) {
          // Update store with fetched data
          setSpaces(result.data.spaces);
          setCategories(result.data.categories);
          setStats(result.data.stats);
          setOrgDetails(orgResult.data);

        } else {
          console.error('Failed to fetch room data:', result.message);
        }
      } catch (error) {
        console.error('Error fetching room data:', error);
      }
    };

    if (isAuthenticated) {
      fetchRoomData();
    }
  }, [isAuthenticated, setSpaces, setCategories, setStats]);

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