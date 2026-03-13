import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: 24 }}>
      <h2>Login</h2>
      <p>Select a role (fake login for now):</p>

      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={() => navigate("/client/dashboard")}>Login as Client</button>
        <button onClick={() => navigate("/tech/dashboard")}>Login as Technician</button>
        <button onClick={() => navigate("/admin/dashboard")}>Login as Admin</button>
      </div>
    </div>
  );
}