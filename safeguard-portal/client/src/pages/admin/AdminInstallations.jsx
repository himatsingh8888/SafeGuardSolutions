import '../../index.css'
import './adminShared.css'
import './AdminInstallations.css'
import { useState, useEffect } from 'react'
import { API_BASE } from '../../config/apiBase.js'
import CreateInstallationModal from './CreateInstallationModal.jsx'
import AssignTechniciansModal from './AssignTechniciansModal.jsx'

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
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [locations, setLocations] = useState([])
  const [locationsLoading, setLocationsLoading] = useState(false)
  const [createError, setCreateError] = useState(null)
  const [employees, setEmployees] = useState([])
  const [employeesLoading, setEmployeesLoading] = useState(false)
  const [assignInstallation, setAssignInstallation] = useState(null)

  const fetchInstallations = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${API_BASE}/api/admin/getInstallations`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
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

  useEffect(() => {
    let cancelled = false
    async function loadEmployees() {
      setEmployeesLoading(true)
      try {
        const res = await fetch(`${API_BASE}/api/admin/getEmployees`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
        const data = await res.json().catch(() => [])
        if (!cancelled) setEmployees(Array.isArray(data) ? data : [])
      } catch {
        if (!cancelled) setEmployees([])
      } finally {
        if (!cancelled) setEmployeesLoading(false)
      }
    }
    loadEmployees()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!showCreateModal) return
    let cancelled = false
    async function loadLocations() {
      setLocationsLoading(true)
      setCreateError(null)
      try {
        const res = await fetch(`${API_BASE}/api/admin/getLocations`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        })
        const data = await res.json().catch(() => [])
        if (!res.ok) throw new Error(data.error || data.message || `Failed to load sites (${res.status})`)
        if (!cancelled) setLocations(Array.isArray(data) ? data : [])
      } catch (e) {
        if (!cancelled) setCreateError(e.message)
      } finally {
        if (!cancelled) setLocationsLoading(false)
      }
    }
    loadLocations()
    return () => {
      cancelled = true
    }
  }, [showCreateModal])

  const todayMin = new Date().toISOString().split('T')[0]

  async function handleCreateInstallation(e) {
    e.preventDefault()
    setCreateError(null)
    const form = e.target
    const siteid = Number(form.siteid.value)
    if (!form.siteid.value || Number.isNaN(siteid) || siteid <= 0) {
      setCreateError('Please select a site')
      return
    }
    const scheduleddate = form.scheduleddate.value
    const internalcost = form.internalcost.value
    const price = form.price.value
    const techniciannumbs = form.techniciannumbs.value
    const description = form.description.value.trim()
    const employeeIds = [...form.querySelectorAll('input[name="employeeIds"]:checked')]
      .map((el) => Number(el.value))
      .filter((n) => !Number.isNaN(n) && n > 0)

    try {
      const res = await fetch(`${API_BASE}/api/admin/addInstallation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          siteid,
          scheduleddate,
          internalcost,
          price,
          techniciannumbs,
          description: description || null,
          employeeIds,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.detail || data.error || data.message || `Create failed (${res.status})`)
      }
      setShowCreateModal(false)
      await fetchInstallations()
    } catch (err) {
      setCreateError(err.message)
    }
  }

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
      const errBody = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(errBody.detail || errBody.error || errBody.message || `Failed to update status: ${response.status}`)
      }
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

  return (
    <div className="clients-page">
      <div className="clients-main">
        <CreateInstallationModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          locations={locations}
          locationsLoading={locationsLoading}
          employees={employees}
          employeesLoading={employeesLoading}
          createError={createError}
          todayMin={todayMin}
          onSubmit={handleCreateInstallation}
        />

        <AssignTechniciansModal
          open={assignInstallation != null}
          installation={assignInstallation}
          employees={employees}
          onClose={() => setAssignInstallation(null)}
          onSaved={() => fetchInstallations()}
        />

        <div className="clients-page-header">
          <div>
            <h1 className="clients-page-title">Installations</h1>
            <p className="clients-page-sub">View and update job status</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setCreateError(null)
              setShowCreateModal(true)
            }}
            className="clients-add-btn"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Create installation
          </button>
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
                {filteredInstallations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="clients-empty" style={{ padding: '24px 16px' }}>
                      No installations on file.
                    </td>
                  </tr>
                ) : (
                  filteredInstallations.map(installation => (
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
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                          <button
                            type="button"
                            className="clients-btn-edit"
                            onClick={() => setAssignInstallation(installation)}
                          >
                            Assign techs
                          </button>
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
                        </div>
                      </td>
                    </tr>
                  ))
                )}
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
