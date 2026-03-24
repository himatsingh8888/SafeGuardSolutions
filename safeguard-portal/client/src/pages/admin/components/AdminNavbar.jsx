import React from 'react'

import '../../../index.css'

export default function AdminNavbar() {

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
        <button>Logout</button>
      </div>
    </div>
  );
}