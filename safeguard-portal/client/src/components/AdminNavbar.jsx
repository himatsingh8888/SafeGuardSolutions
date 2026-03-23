import React from 'react'

import '../index.css'

export default function AdminNavbar(){

    return (
        <div
          style={{
            padding: 16,
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            borderBottom: "1px solid #ddd",
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