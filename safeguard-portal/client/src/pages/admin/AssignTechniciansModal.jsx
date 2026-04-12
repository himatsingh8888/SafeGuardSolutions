import { useEffect, useState } from 'react'
import { API_BASE } from '../../config/apiBase.js'
import './adminShared.css'

export default function AssignTechniciansModal({
  open,
  installation,
  employees,
  onClose,
  onSaved,
}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(() => new Set())
  const [saving, setSaving] = useState(false)

  const iid = installation?.installationid

  useEffect(() => {
    if (!open || !iid) return
    let cancelled = false
    setLoading(true)
    setError(null)
    setSelected(new Set())

    fetch(
      `${API_BASE}/api/admin/getInstallationAssignments?installationid=${encodeURIComponent(iid)}`,
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    )
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (cancelled) return
        if (!ok) throw new Error(d.error || d.message || 'Failed to load assignments')
        const ids = Array.isArray(d.employeeIds) ? d.employeeIds : []
        setSelected(new Set(ids))
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Failed to load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, iid])

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!iid) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/admin/setInstallationAssignments`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          installationid: iid,
          employeeIds: [...selected],
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail || data.error || data.message || `Save failed (${res.status})`)
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!open || !installation) return null

  return (
    <div className="overlay" onClick={() => !saving && onClose()} role="presentation">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Assign technicians · #{iid}</h2>
          <button type="button" className="modal-close" onClick={onClose} disabled={saving} aria-label="Close">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p className="adm-muted-inline" style={{ marginBottom: 12 }}>
              The employee portal lists jobs from the <strong>assignment</strong> table. Select who works this installation.
            </p>
            {error && (
              <p className="adm-state-error" role="alert" style={{ marginBottom: 8 }}>
                {error}
              </p>
            )}
            {loading ? (
              <p className="adm-muted-inline">Loading…</p>
            ) : employees.length === 0 ? (
              <p className="adm-muted-inline">No employees in the database.</p>
            ) : (
              <div className="assign-tech-list">
                {employees.map((emp) => (
                  <label key={emp.employeeid} className="assign-tech-row">
                    <input
                      type="checkbox"
                      checked={selected.has(emp.employeeid)}
                      onChange={() => toggle(emp.employeeid)}
                    />
                    <span>
                      {emp.fname} {emp.lname}
                      <span className="adm-mono" style={{ marginLeft: 8 }}>
                        #{emp.employeeid}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="clients-btn-edit" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="clients-btn-primary" disabled={saving || loading}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
