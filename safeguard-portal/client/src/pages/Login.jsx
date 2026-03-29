import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { API_BASE } from "../config/apiBase.js";
import './Login.css'

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault()
    setError("")

    const formData = new FormData(e.target)

    const username = formData.get("username")
    const password = formData.get("password")
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      })

      let data = {}
      const text = await res.text()
      if (text) {
        try {
          data = JSON.parse(text)
        } catch {
          setError(`Server returned an invalid response. Check that the API is running (${API_BASE}).`)
          return
        }
      }

      if (res.ok) {
        //also save the token sent from the backend
        localStorage.setItem('token', data.token)
        const cid = data.clientId ?? data.clientID ?? data.ClientId
        if (cid !== undefined && cid !== null && cid !== '') {
          localStorage.setItem('clientId', String(cid))
        }
        const role = String(data.role ?? "").trim().toLowerCase()
        if (role === 'admin') {
          navigate('/admin')
        } else if (role === 'technician') {
          navigate('/tech/dashboard')
        } else if (role === 'client') {
          navigate('/client/dashboard')
        } else {
          setError(data.role ? `Unknown role: "${data.role}". Expected admin, technician, or client.` : "Login succeeded but no role was returned.")
        }
      } else {
        setError(data.message || `Login failed (${res.status})`)
      }
    } catch (err) {
      console.error(err)
      setError(`Cannot reach the server at ${API_BASE}. Start the backend with \`npm start\` in safeguard-portal/server (set PORT in server/.env or default 5001).`)
    }
  }

  return (
    <div className="login-page" style={{ display: "flex", gap: 12 }}>
      <form className="login-form" onSubmit={handleLogin} >
        <button type="button" className="back-btn" onClick={() => navigate('/')}>  &#8592; Back</button>
        <h1>Sign In</h1>
        <p>Access your security dashboard</p>
        <div className="input-box">
          <h4>EMAIL ADDRESS</h4>
          <input type="text" name="username" placeholder="Username" />
        </div>
        <div className="input-box">
          <h4>PASSWORD</h4>
          <input type="password" name="password" placeholder="Password" />
        </div>
        <button type="submit" className="login-btn">ACCESS DASHBOARD</button>
        {error && (
          <p style={{ color: "#b00020", fontSize: 14, marginTop: 12 }}>{error}</p>
        )}
      </form>
    </div>

  )
}