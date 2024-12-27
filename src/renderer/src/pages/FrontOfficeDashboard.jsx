import QuickStats from './components/QuickStats';
import RoomStatusLegend from './components/RoomStatusLegend.jsx';
import SpacesGrid from './components/spaces/SpacesGrid.jsx';
import OrgDetailsButton from './components/organization/OrgDetailsButton';


const FrontOfficeDashboard = () => {
  return (
    <div className="min-h-screen">
      <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Front Office</h1>
          <OrgDetailsButton />
        </div>

        <QuickStats />
        <RoomStatusLegend />
        <SpacesGrid />
      </div>
    </div>
  )
};

export default FrontOfficeDashboard;