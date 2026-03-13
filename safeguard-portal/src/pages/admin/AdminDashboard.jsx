import Navbar from "../../components/Navbar";

export default function AdminDashboard() {
  return (
    <div>
          <Navbar />

        <div style={{ padding: 24 }}>
            <h2>Admin Dashboard</h2>
            <p>Later: create clients/locations, create installations, assign techs.</p>
        </div>
    </div>
  );
}