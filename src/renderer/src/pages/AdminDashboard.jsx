import RevenueStats from './components/RevenueStats';
import QuickStats from './components/QuickStats';
import RoomStatusLegend from './components/RoomStatusLegend.jsx';
import SpacesGrid from './components/spaces/SpacesGrid.jsx';
import OrgDetailsButton from './components/organization/OrgDetailsButton';


const AdminDashboard = () => {
  return (
    <div className="min-h-screen">
      <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <OrgDetailsButton />
        </div>

        <RevenueStats />
        <QuickStats />
        <RoomStatusLegend />
        <SpacesGrid />
      </div>
    </div>
  )
};

export default AdminDashboard;