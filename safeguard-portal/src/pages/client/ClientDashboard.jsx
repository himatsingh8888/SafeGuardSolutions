import Navbar from "../../components/Navbar";
import { clients } from "../../mock/clients";
import { locations } from "../../mock/locations";
import { installations } from "../../mock/installations";
import { payments } from "../../mock/payments";


export default function ClientDashboard() {
    const currentClientId = "C001"; // fake logged-in client for now
    const myLocations = locations.filter((loc) => loc.clientId === currentClientId);
  
    const mySiteIds = myLocations.map((loc) => loc.siteId);
    const myInstallations = installations.filter((inst) => mySiteIds.includes(inst.siteId));
    const myPayments = payments.filter((p) => p.clientId === currentClientId);

    return (
    <div>
      <Navbar />

      <div style={{ padding: 24 }}>
        <h2>Client Dashboard</h2>
        <p>Later: view locations, installations, payments.</p>
        <h3>Clients</h3>

        <table border="1" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
            <tr>
            <th>Client ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Type</th>
            </tr>
        </thead>

        <tbody>
            {clients.map((c) => (
            <tr key={c.clientId}>
                <td>{c.clientId}</td>
                <td>{c.name}</td>
                <td>{c.email}</td>
                <td>{c.phone}</td>
                <td>{c.customerType}</td>
            </tr>
            ))}
        </tbody>
        </table>

        <h3 style={{ marginTop: 24 }}>My Locations</h3>

        <table border="1" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
            <tr>
            <th>Site ID</th>
            <th>Address</th>
            <th>Notes</th>
            </tr>
        </thead>

        <tbody>
            {myLocations.map((loc) => (
            <tr key={loc.siteId}>
                <td>{loc.siteId}</td>
                <td>{loc.address}</td>
                <td>{loc.notes}</td>
            </tr>
            ))}
        </tbody>
        </table>

        <h3 style={{ marginTop: 24 }}>My Installations</h3>

        <table border="1" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
            <tr>
            <th>Installation ID</th>
            <th>Site ID</th>
            <th>Status</th>
            <th>Scheduled Date</th>
            <th>Price</th>
            </tr>
        </thead>

        <tbody>
            {myInstallations.map((inst) => (
            <tr key={inst.installationId}>
                <td>{inst.installationId}</td>
                <td>{inst.siteId}</td>
                <td>{inst.status}</td>
                <td>{inst.scheduledDate}</td>
                <td>${inst.price}</td>
            </tr>
            ))}
        </tbody>
        </table>

        <h3 style={{ marginTop: 24 }}>My Payments</h3>

        <table border="1" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
            <tr>
            <th>Payment ID</th>
            <th>Installation ID</th>
            <th>Status</th>
            <th>Due Date</th>
            <th>Amount</th>
            <th>Type</th>
            </tr>
        </thead>

        <tbody>
            {myPayments.map((p) => (
            <tr key={p.paymentId}>
                <td>{p.paymentId}</td>
                <td>{p.installationId}</td>
                <td>{p.status}</td>
                <td>{p.dueDate}</td>
                <td>${p.totalAmount}</td>
                <td>{p.paymentType}</td>
            </tr>
            ))}
        </tbody>
        </table>
      </div>
    </div>

    
  );
}