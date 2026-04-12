import '../../index.css'
import './adminShared.css'
import './AdminService.css'
import { useState, useEffect } from 'react'
import { API_BASE } from '../../config/apiBase.js'

function visitOutcomeBadge(status) {
  if (status === 'Completed') return 'clients-badge completed'
  if (status === 'Pending') return 'clients-badge pending'
  if (status === 'Follow-up required') return 'clients-badge followup'
  return 'clients-skill-tag'
}

export default function AdminService() {
  const [serviceVisits, setServiceVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [selectedNotes, setSelectedNotes] = useState('')

  const fetchServiceVisits = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${API_BASE}/api/service-visits`)
      if (!response.ok) throw new Error(`Failed to fetch service visits: ${response.status}`)
      const data = await response.json()
      setServiceVisits(data)
    } catch (err) {
      console.error('Error fetching service visits:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServiceVisits()
  }, [])

  const updateServiceVisitStatus = async (visitNumber, newStatus) => {
    try {
      const response = await fetch(`${API_BASE}/api/service-visits/${visitNumber}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ outcomestatus: newStatus }),
      })
      if (!response.ok) throw new Error(`Failed to update status: ${response.status}`)
      setServiceVisits(serviceVisits.map(visit =>
        visit.visitnumber === visitNumber ? { ...visit, outcomestatus: newStatus } : visit
      ))
    } catch (err) {
      console.error('Error updating service visit status:', err)
      alert(`Failed to update status: ${err.message}`)
    }
  }

  const totalVisits = serviceVisits.length
  const completedVisits = serviceVisits.filter(v => v.outcomestatus === 'Completed').length
  const pendingVisits = serviceVisits.filter(v => v.outcomestatus === 'Pending').length
  const followupVisits = serviceVisits.filter(v => v.outcomestatus === 'Follow-up required').length

  const filteredVisits = activeFilter === 'all'
    ? serviceVisits
    : serviceVisits.filter(v => {
      if (activeFilter === 'followup') return v.outcomestatus === 'Follow-up required'
      return v.outcomestatus.toLowerCase() === activeFilter
    })

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const truncateNotes = (notes, maxLength = 48) => {
    if (!notes) return '—'
    if (notes.length <= maxLength) return notes
    return `${notes.substring(0, maxLength)}…`
  }

  const openNotesModal = (notes) => {
    setSelectedNotes(notes || '')
    setShowModal(true)
  }

  const shell = (children) => (
    <div className="clients-page">
      <div className="clients-main">{children}</div>
    </div>
  )

  if (loading) {
    return shell(<div className="adm-state">Loading service visits…</div>)
  }

  if (error) {
    return shell(
      <div>
        <p className="adm-state adm-state-error" role="alert">{error}</p>
        <div style={{ textAlign: 'center' }}>
          <button type="button" className="adm-retry" onClick={fetchServiceVisits}>Retry</button>
        </div>
      </div>
    )
  }

  if (serviceVisits.length === 0) {
    return shell(
      <>
        <div className="clients-page-header">
          <div>
            <h1 className="clients-page-title">Service visits</h1>
            <p className="clients-page-sub">Field service and follow-ups</p>
          </div>
        </div>
        <div className="clients-empty">No service visits on file.</div>
      </>
    )
  }

  return (
    <div className="clients-page">
      {showModal && (
        <div className="overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Visit notes</h2>
              <button type="button" className="modal-close" onClick={() => setShowModal(false)} aria-label="Close">×</button>
            </div>
            <div className="modal-notes-content">
              <p>{selectedNotes || 'No notes.'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="clients-main">
        <div className="clients-page-header">
          <div>
            <h1 className="clients-page-title">Service visits</h1>
            <p className="clients-page-sub">Inspections, repairs, and follow-ups</p>
          </div>
        </div>

        <div className="clients-summary-strip">
          <div className="clients-stat-card">
            <div className="clients-stat-label">Total</div>
            <div className="clients-stat-value">{totalVisits}</div>
          </div>
          <div className="clients-stat-card">
            <div className="clients-stat-label">Completed</div>
            <div className="clients-stat-value adm-stat-pos">{completedVisits}</div>
          </div>
          <div className="clients-stat-card">
            <div className="clients-stat-label">Pending</div>
            <div className="clients-stat-value adm-stat-warn">{pendingVisits}</div>
          </div>
          <div className="clients-stat-card">
            <div className="clients-stat-label">Follow-up</div>
            <div className="clients-stat-value adm-stat-warn">{followupVisits}</div>
          </div>
        </div>

        <div className="clients-toolbar">
          <div className="clients-filter-row">
            {[
              ['all', 'All'],
              ['completed', 'Completed'],
              ['pending', 'Pending'],
              ['followup', 'Follow-up'],
            ].map(([id, label]) => (
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
            <table className="adm-table service-visits-admin-table">
              <thead>
                <tr>
                  <th>Visit</th>
                  <th>Installation</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Notes</th>
                  <th>Outcome</th>
                  <th>Update</th>
                </tr>
              </thead>
              <tbody>
                {filteredVisits.map(visit => (
                  <tr key={visit.visitnumber}>
                    <td className="adm-mono">{visit.visitnumber}</td>
                    <td className="adm-mono">{visit.installationid}</td>
                    <td>{formatDate(visit.visitdate)}</td>
                    <td>{visit.visittype || '—'}</td>
                    <td>
                      <span className="adm-notes-cell">{truncateNotes(visit.notes)}</span>
                      {visit.notes && visit.notes.length > 48 && (
                        <button type="button" className="adm-link-btn" onClick={() => openNotesModal(visit.notes)}>View</button>
                      )}
                    </td>
                    <td>
                      <span className={visitOutcomeBadge(visit.outcomestatus)}>{visit.outcomestatus}</span>
                    </td>
                    <td>
                      <select
                        className="adm-select-inline"
                        value={visit.outcomestatus}
                        onChange={e => updateServiceVisitStatus(visit.visitnumber, e.target.value)}
                        aria-label={`Status for visit ${visit.visitnumber}`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                        <option value="Follow-up required">Follow-up required</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="clients-footer">
          Showing {filteredVisits.length} of {serviceVisits.length} visits
        </div>
      </div>
    </div>
  )
}
