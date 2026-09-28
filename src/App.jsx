import DriverDashboard from "./DriverDashboard";

function App() {
  return (
    <DriverDashboard
      profile={{
        id: "driver-demo-001",
        full_name: "Driver Demo",
        vehicle_number: "TN-38-AB-24018",
      }}
      onLogout={() => {
        console.log("Driver signed out");
      }}
    />
  );
}

export default App;