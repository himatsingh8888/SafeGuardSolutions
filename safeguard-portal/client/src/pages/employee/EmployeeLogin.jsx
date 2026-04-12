import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { API_BASE } from "../../config/apiBase.js";
import "../Login.css";

export default function EmployeeLogin() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.target);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const res = await fetch(`${API_BASE}/api/employee/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let data = {};
      const text = await res.text();
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          setError(`Server returned an invalid response. Is the backend running at ${API_BASE}?`);
          return;
        }
      }

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("employeeId", String(data.employeeId));
        navigate("/employee/dashboard");
      } else {
        setError(data.message || `Login failed (${res.status})`);
      }
    } catch {
      setError(`Cannot reach the server at ${API_BASE}. Make sure the backend is running.`);
    }
  }

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleLogin}>
        <button type="button" className="back-btn" onClick={() => navigate("/")}>
          &#8592; Back
        </button>
        <h1>Employee Sign In</h1>
        <p>Access your work dashboard</p>
        <div className="input-box">
          <h4>WORK EMAIL</h4>
          <input type="email" name="email" placeholder="you@company.com" required />
        </div>
        <div className="input-box">
          <h4>PASSWORD</h4>
          <input type="password" name="password" placeholder="Enter your password" required />
        </div>
        <button type="submit" className="login-btn">
          ACCESS DASHBOARD
        </button>
        {error && (
          <p style={{ color: "#b00020", fontSize: 14, marginTop: 12 }}>{error}</p>
        )}
      </form>
    </div>
  );
}
