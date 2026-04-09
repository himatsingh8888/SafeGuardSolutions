import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { API_BASE } from "../../config/apiBase.js";
import "../Login.css";

export default function ClientLogin() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.target);
    const username = formData.get("username");
    const password = formData.get("password");

    try {
      const res = await fetch(`${API_BASE}/api/client-auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
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
        localStorage.setItem("clientToken", data.token);
        localStorage.setItem("clientId", String(data.clientId));
        navigate("/client/dashboard");
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
        <h1>Client Sign In</h1>
        <p>Access your client portal</p>
        <div className="input-box">
          <h4>USERNAME</h4>
          <input type="text" name="username" placeholder="your username" required />
        </div>
        <div className="input-box">
          <h4>PASSWORD</h4>
          <input type="password" name="password" placeholder="Enter your password" required />
        </div>
        <button type="submit" className="login-btn">
          ACCESS PORTAL
        </button>
        {error && (
          <p style={{ color: "#b00020", fontSize: 14, marginTop: 12 }}>{error}</p>
        )}
      </form>
    </div>
  );
}
