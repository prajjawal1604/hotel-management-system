import React, { useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { useRoomsStore } from '../../store/roomsStore';

const RevenueStats = () => {
  const { revenueStats, setRevenueStats } = useRoomsStore();

  useEffect(() => {
    const fetchRevenueStats = async () => {
      try {
        const result = await window.electron.ipcRenderer.invoke('get-revenue-stats');
        if (result.success) {
          setRevenueStats(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch revenue stats:', error);
      }
    };

    fetchRevenueStats();

    // Fetch every 5 minutes
    const interval = setInterval(fetchRevenueStats, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [setRevenueStats]);

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Daily Revenue */}
        <div className="bg-white rounded-lg shadow-sm flex justify-center items-center p-8">
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Today's Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900">
                ₹{revenueStats.dailyRevenue.toLocaleString()}
              </h3>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Weekly Revenue */}
        <div className="bg-white rounded-lg shadow-sm flex justify-center items-center">
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Weekly Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900">
                ₹{revenueStats.weeklyRevenue.toLocaleString()}
              </h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white rounded-lg shadow-sm flex justify-center items-center">
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900">
                ₹{revenueStats.monthlyRevenue.toLocaleString()}
              </h3>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueStats;