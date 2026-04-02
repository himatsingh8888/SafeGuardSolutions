import './AdminClients.css'
import { API_BASE } from '../../config/apiBase.js'

import { useState, useEffect } from 'react'

export default function AdminClients() {
    const [clients, setClients] = useState([])
    const [expandedId, setExpandedId] = useState(null)

    useEffect(() => {
        fetchClients()
    }, [])

    async function fetchClients() {
        try {
            const res = await fetch(`${API_BASE}/api/admin/getClients`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            const data = await res.json()
            setClients(data)
        } catch (error) {
            console.error(error)
        }
    }

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id)
    }

    return (
        <div>
            <div className="Admin-Dashboard" style={{ padding: 24 }}>
                <div className="Employee-pg-header">
                    <div className="header-title">
                        <h2>Clients</h2>
                        <p>Manage your clients</p>
                    </div>
                    <button>+ Add Client</button>
                </div>

                <div className="expand-list">
                    {clients.map(client => (
                        <div key={client.clientid} className="expand-row">
                            <div className="expand-header" onClick={() => toggleExpand(client.clientid)}>
                                <div className="expand-left">
                                    <div className="avatar">{client.fname[0]}{client.lname[0]}</div>
                                    <div>
                                        <div className="expand-name">{client.fname} {client.lname}</div>
                                        <div className="expand-email">{client.email}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span className={`badge ${client.customertype === 'Residential' ? 'res' : 'com'}`}>
                                        {client.customertype}
                                    </span>
                                    <span className="expand-arrow">{expandedId === client.clientid ? '▼' : '▶'}</span>
                                </div>
                            </div>

                            {expandedId === client.clientid && (
                                <div className="expand-body">
                                    <div className="expand-field"><label>Phone</label><span>{client.phone}</span></div>
                                    <div className="expand-field"><label>Billing Address</label><span>{client.billingaddress}</span></div>
                                    <div className="expand-field"><label>Type</label><span>{client.customertype}</span></div>
                                    <div className="expand-actions">
                                        <button>Edit</button>
                                        <button style={{ color: '#A32D2D' }}>Delete</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}