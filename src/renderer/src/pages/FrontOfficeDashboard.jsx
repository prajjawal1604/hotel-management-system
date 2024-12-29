import QuickStats from './components/QuickStats';
import RoomStatusLegend from './components/RoomStatusLegend.jsx';
import SpacesGrid from './components/spaces/SpacesGrid.jsx';
// import AdvancedButton from './components/advanced/AdvancedButton.jsx';


const FrontOfficeDashboard = () => {
  return (
    <div className="min-h-screen">
      <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Front Office</h1>
          {/* <AdvancedButton /> */}
        </div>

        <QuickStats />
        <RoomStatusLegend />
        <SpacesGrid />
      </div>
    </div>
  )
};

export default FrontOfficeDashboard;