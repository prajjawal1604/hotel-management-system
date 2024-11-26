// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Loader } from 'lucide-react';
import AllDashboard from './AllDashboard';

const Dashboard = () => {
  const { role } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [appState, setAppState] = useState({
    auth: {
      isAuthenticated: false,
      role: null
    }
  });

  useEffect(() => {
    const initState = async () => {
      try {
        const state = await window.electron.getState();
        setAppState(state);
      } catch (error) {
        console.error('State fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initState();

    const unsubscribe = window.electron.onStateUpdate((newState) => {
      setAppState(newState);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader className="animate-spin" size={24} />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!appState.auth.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (appState.auth.role !== role) {
    return <Navigate to={`/dashboard/${appState.auth.role}`} replace />;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <Dashboard userRole={role} />
    </div>
  );
};

export default Dashboard;