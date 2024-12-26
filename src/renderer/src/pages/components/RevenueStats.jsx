import React, { useEffect } from 'react';
import { DollarSign, Activity } from 'lucide-react';
import { useRoomsStore } from '../../store/roomsStore';

const StatCard = ({ title, value, Icon, bgColor, iconColor }) => (
  <div className="bg-white rounded-lg shadow-sm flex justify-center items-center p-8">
    <div className="flex items-center justify-between gap-6">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">
          ₹{value.toLocaleString()}
        </h3>
      </div>
      <div className={`p-3 ${bgColor} rounded-full`}>
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
    </div>
  </div>
);

const RevenueStats = () => {
  const { revenueStats, setRevenueStats } = useRoomsStore();

  useEffect(() => {
    const fetchRevenueStats = async () => {
      try {
        const result = await window.electron.getRevenueStats();
        if (result.success) {
          setRevenueStats(result.data);
        } else {
          console.error('Failed to fetch revenue stats:', result.message);
        }
      } catch (error) {
        console.error('Revenue stats error:', error);
      }
    };

    fetchRevenueStats();
    const interval = setInterval(fetchRevenueStats, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [setRevenueStats]);

  const stats = [
    {
      title: "Today's Revenue",
      value: revenueStats.dailyRevenue,
      Icon: DollarSign,
      bgColor: "bg-green-100",
      iconColor: "text-green-600"
    },
    {
      title: "Weekly Revenue",
      value: revenueStats.weeklyRevenue,
      Icon: Activity,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      title: "Monthly Revenue",
      value: revenueStats.monthlyRevenue,
      Icon: DollarSign,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600"
    }
  ];

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>
    </div>
  );
};

export default RevenueStats;