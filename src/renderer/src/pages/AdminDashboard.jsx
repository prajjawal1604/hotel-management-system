import RevenueStats from './components/RevenueStats';
import QuickStats from './components/QuickStats';

const AdminDashboard = () => {
  return (
    <div className="min-h-screen">
      <div className="space-y-6 p-6">
        <RevenueStats />
        <QuickStats />
        <SearchAndFilters />
        <RoomStatusLegend />
      </div>
    </div>
  )
};

export default AdminDashboard;