import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";

export default function ClientDashboard() {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/clients')
      .then((response) => response.json())
      .then((data) => setClients(data))
      .catch((error) => console.error('Error fetching clients:', error));
  }, []);

  return (
    <div>
      <Navbar />

      <div style={{ padding: 24 }}>
        <h2>Client Dashboard</h2>
        <h3>Client List</h3>

        <table border="1" cellPadding="8" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Client ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
            </tr>
          </thead>

          <tbody>
            {clients.map((c) => (
              <tr key={c.clientid}>
                <td>{c.clientid}</td>
                <td>{c.fname} {c.lname}</td>
                <td>{c.email}</td>
                <td>{c.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}