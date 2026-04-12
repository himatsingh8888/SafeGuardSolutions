import './adminShared.css'
import './AdminQuoteRequests.css'
import React from 'react'
import { API_BASE } from '../../config/apiBase.js'

export default function AdminQuoteRequests() {
  const [requests, setRequests] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [showModal, setShowModal] = React.useState(false)
  const [selectedNote, setSelectedNote] = React.useState('')

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/quote-request`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      const data = await res.json()
      setRequests(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchRequests()
  }, [])

  function truncateNotes(notes, maxLength = 56) {
    if (!notes) return ''
    if (notes.length <= maxLength) return notes
    return `${notes.substring(0, maxLength)}…`
  }

  function openNotesModal(notes) {
    setSelectedNote(notes || '')
    setShowModal(true)
  }

  async function toggleStatus(requestid, currentStatus) {
    const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed'
    try {
      const res = await fetch(`${API_BASE}/api/quote-request/${requestid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setRequests(requests.map(req =>
          req.requestid === requestid ? { ...req, status: newStatus } : req
        ))
      }
    } catch (error) {
      console.error(error)
    }
  }

  if (loading) {
    return (
      <div className="clients-page">
        <div className="clients-main">
          <div className="adm-state">Loading quote requests…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="clients-page">
      {showModal && (
        <div className="overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Notes</h2>
              <button type="button" className="modal-close" onClick={() => setShowModal(false)} aria-label="Close">×</button>
            </div>
            <div className="modal-notes-content">
              <p>{selectedNote}</p>
            </div>
          </div>
        </div>
      )}

      <div className="clients-main">
        <div className="clients-page-header">
          <div>
            <h1 className="clients-page-title">Quote requests</h1>
            <p className="clients-page-sub">Inbound leads from the public quote form</p>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="clients-empty">No quote requests yet.</div>
        ) : (
          <>
            <div className="adm-table-scroll">
              <div className="adm-table-wrap">
                <table className="adm-table quote-requests-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Location</th>
                      <th>Address</th>
                      <th>Notes</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(request => (
                      <tr key={request.requestid}>
                        <td style={{ fontWeight: 500 }}>{request.name}</td>
                        <td className="adm-cell-clip">{request.email}</td>
                        <td>{request.locationtype || '—'}</td>
                        <td className="adm-cell-clip">{request.address || '—'}</td>
                        <td>
                          <span className="adm-notes-preview">{truncateNotes(request.notes)}</span>
                          {request.notes && request.notes.length > 56 && (
                            <button type="button" className="adm-link-btn" onClick={() => openNotesModal(request.notes)}>View</button>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`quote-status-pill ${request.status === 'Completed' ? 'done' : 'open'}`}
                            onClick={() => toggleStatus(request.requestid, request.status)}
                            title="Click to toggle"
                          >
                            {request.status || 'Pending'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="clients-footer">{requests.length} requests</div>
          </>
        )}
      </div>
    </div>
  )
}
