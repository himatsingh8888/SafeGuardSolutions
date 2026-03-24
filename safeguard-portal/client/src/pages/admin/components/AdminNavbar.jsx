import React from 'react'
import { useNavigate } from 'react-router-dom'

import '../../../index.css'

export default function AdminNavbar() {

  const navigate = useNavigate()

  function handleLogout() {
    localStorage.removeItem('token')
    navigate('/login')
  }



  return (
    <div
      style={{
        padding: 5,
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "center"
      }}
    >
      <strong>Safeguard Solutions</strong>
      <div
        className='Logout-section'>
        <p>Admin</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}