import '../../index.css'
import './adminShared.css'
import './AdminInstallations.css'
import { useState, useEffect } from 'react'
import { API_BASE } from '../../config/apiBase.js'

function installationBadgeClass(status) {
  const s = String(status || '').toLowerCase()
  if (s === 'completed') return 'clients-badge completed'
  if (s === 'scheduled') return 'clients-badge scheduled'
  return 'clients-skill-tag'
}

export default function AdminInstallations() {
  const [installations, setInstallations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')

  const fetchInstallations = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${API_BASE}/api/installations`)
      if (!response.ok) throw new Error(`Failed to fetch installations: ${response.status}`)
      const data = await response.json()
      setInstallations(data)
    } catch (err) {
      console.error('Error fetching installations:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInstallations()
  }, [])

  const updateInstallationStatus = async (installationId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/updateInstallationStatus`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ installationid: installationId, status: newStatus }),
      })
      if (!response.ok) throw new Error(`Failed to update status: ${response.status}`)
      setInstallations(installations.map(installation =>
        installation.installationid === installationId
          ? {
              ...installation,
              status: newStatus,
              completeddate: newStatus === 'Completed' ? new Date().toISOString().split('T')[0] : installation.completeddate,
            }
          : installation
      ))
    } catch (err) {
      console.error('Error updating installation status:', err)
      alert(`Failed to update status: ${err.message}`)
    }
  }

  const totalInstallations = installations.length
  const scheduledInstallations = installations.filter(i => i.status === 'Scheduled').length
  const completedInstallations = installations.filter(i => i.status === 'Completed').length
  const totalRevenue = installations.reduce((sum, i) => sum + Number(i.price || 0), 0)

  const filteredInstallations = activeFilter === 'all'
    ? installations
    : installations.filter(i => i.status.toLowerCase() === activeFilter)

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const formatCurrency = (amount) =>
    `$${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const shell = (children) => (
    <div className="clients-page">
      <div className="clients-main">{children}</div>
    </div>
  )

  if (loading) {
    return shell(
      <div className="adm-state">Loading installations…</div>
    )
  }

  if (error) {
    return shell(
      <div>
        <p className="adm-state adm-state-error" role="alert">{error}</p>
        <div style={{ textAlign: 'center' }}>
          <button type="button" className="adm-retry" onClick={fetchInstallations}>Retry</button>
        </div>
      </div>
    )
  }

  if (installations.length === 0) {
    return shell(
      <>
        <div className="clients-page-header">
          <div>
            <h1 className="clients-page-title">Installations</h1>
            <p className="clients-page-sub">Scheduled and completed installation jobs</p>
          </div>
        </div>
        <div className="clients-empty">No installations on file.</div>
      </>
    )
  }

  return (
    <div className="clients-page">
      <div className="clients-main">
        <div className="clients-page-header">
          <div>
            <h1 className="clients-page-title">Installations</h1>
            <p className="clients-page-sub">View and update job status</p>
          </div>
        </div>

        <div className="clients-summary-strip">
          <div className="clients-stat-card">
            <div className="clients-stat-label">Total</div>
            <div className="clients-stat-value">{totalInstallations}</div>
          </div>
          <div className="clients-stat-card">
            <div className="clients-stat-label">Scheduled</div>
            <div className="clients-stat-value adm-stat-warn">{scheduledInstallations}</div>
          </div>
          <div className="clients-stat-card">
            <div className="clients-stat-label">Completed</div>
            <div className="clients-stat-value adm-stat-pos">{completedInstallations}</div>
          </div>
          <div className="clients-stat-card">
            <div className="clients-stat-label">Revenue (sum)</div>
            <div className="clients-stat-value">{formatCurrency(totalRevenue)}</div>
          </div>
        </div>

        <div className="clients-toolbar">
          <div className="clients-filter-row">
            {[
              { id: 'all', label: 'All' },
              { id: 'scheduled', label: 'Scheduled' },
              { id: 'completed', label: 'Completed' },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={`clients-filter-btn${activeFilter === id ? ' active' : ''}`}
                onClick={() => setActiveFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="adm-table-scroll">
          <div className="adm-table-wrap">
            <table className="adm-table installations-admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Site</th>
                  <th>Scheduled</th>
                  <th>Description</th>
                  <th>Technicians</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInstallations.map(installation => (
                  <tr key={installation.installationid}>
                    <td className="adm-mono">{installation.installationid}</td>
                    <td className="adm-mono">{installation.siteid}</td>
                    <td>{formatDate(installation.scheduleddate)}</td>
                    <td>{installation.description || '—'}</td>
                    <td>{installation.techniciannumbs ?? '—'}</td>
                    <td>{formatCurrency(installation.price)}</td>
                    <td>
                      <span className={installationBadgeClass(installation.status)}>
                        {installation.status}
                      </span>
                    </td>
                    <td>
                      {installation.status === 'Scheduled' ? (
                        <button
                          type="button"
                          className="adm-btn-action"
                          onClick={() => updateInstallationStatus(installation.installationid, 'Completed')}
                        >
                          Mark complete
                        </button>
                      ) : (
                        <span className="adm-muted-inline">Done {formatDate(installation.completeddate)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="clients-footer">
          Showing {filteredInstallations.length} of {installations.length} installations
        </div>
      </div>
    </div>
  )
}
