import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <div
      style={{
        padding: 16,
        display: "flex",
        gap: 12,
        alignItems: "center",
        borderBottom: "1px solid #ddd",
      }}
    >
      <strong>Safeguard Solutions</strong>

      <Link to="/login">Login</Link>
      <Link to="/client/dashboard">Client</Link>
      <Link to="/tech/dashboard">Tech</Link>
      <Link to="/admin/dashboard">Admin</Link>
    </div>
  );
}