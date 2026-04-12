import '../../index.css'
import './adminShared.css'
import './AdminDashboard.css'
import { useState, useEffect } from 'react'
import { API_BASE } from '../../config/apiBase.js'

export default function AdminDashboard() {
  const [clients, setClients] = useState([])
  const [employees, setEmployees] = useState([])
  const [installations, setInstallations] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [clientsRes, employeesRes, installationsRes, paymentsRes] = await Promise.all([
          fetch(`${API_BASE}/api/clients`),
          fetch(`${API_BASE}/api/employees`),
          fetch(`${API_BASE}/api/installations`),
          fetch(`${API_BASE}/api/payments`),
        ])
        setClients(clientsRes.ok ? await clientsRes.json() : [])
        setEmployees(employeesRes.ok ? await employeesRes.json() : [])
        setInstallations(installationsRes.ok ? await installationsRes.json() : [])
        setPayments(paymentsRes.ok ? await paymentsRes.json() : [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const upcomingInstallations = installations.filter(i => i.status === 'Scheduled').length
  const completedInstallations = installations.filter(i => i.status === 'Completed').length

  const totalRevenue = payments
    .filter(p => p.status === 'Paid')
    .reduce((sum, p) => sum + Number(p.totalamount), 0)

  const pendingCount = payments.filter(p => p.status === 'Pending').length
  const overdueCount = payments.filter(p => p.status === 'Overdue').length

  const recentInstallations = [...installations]
    .sort((a, b) => new Date(b.scheduleddate) - new Date(a.scheduleddate))
    .slice(0, 4)

  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.createdate) - new Date(a.createdate))
    .slice(0, 4)

  function statusClass(status) {
    const s = String(status || '').toLowerCase().replace(/\s+/g, '-')
    if (s.includes('complete')) return 'clients-badge completed'
    if (s.includes('schedule')) return 'clients-badge scheduled'
    if (s.includes('pending')) return 'clients-badge pending'
    if (s.includes('progress')) return 'clients-badge followup'
    return 'clients-skill-tag'
  }

  if (loading) {
    return (
      <div className="clients-page">
        <div className="clients-main">
          <div className="adm-state">Loading dashboard…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="clients-page">
      <div className="clients-main">
        <div className="clients-page-header">
          <div>
            <h1 className="clients-page-title">Dashboard</h1>
            <p className="clients-page-sub">Overview of clients, jobs, and payments</p>
          </div>
        </div>

        {error && (
          <div className="adm-state adm-state-error" role="alert">
            {error}
          </div>
        )}

        <section className="adm-section" aria-labelledby="overview-heading">
          <h2 id="overview-heading" className="adm-section-title">Overview</h2>
          <div className="clients-summary-strip">
            <div className="clients-stat-card">
              <div className="clients-stat-label">Clients</div>
              <div className="clients-stat-value">{clients.length}</div>
            </div>
            <div className="clients-stat-card">
              <div className="clients-stat-label">Employees</div>
              <div className="clients-stat-value">{employees.length}</div>
            </div>
            <div className="clients-stat-card">
              <div className="clients-stat-label">Scheduled</div>
              <div className="clients-stat-value adm-stat-warn">{upcomingInstallations}</div>
            </div>
            <div className="clients-stat-card">
              <div className="clients-stat-label">Completed jobs</div>
              <div className="clients-stat-value adm-stat-pos">{completedInstallations}</div>
            </div>
          </div>
        </section>

        <section className="adm-section" aria-labelledby="financial-heading">
          <h2 id="financial-heading" className="adm-section-title">Payments</h2>
          <div className="clients-summary-strip cols-3">
            <div className="clients-stat-card">
              <div className="clients-stat-label">Recorded revenue (paid)</div>
              <div className="clients-stat-value adm-stat-pos">${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            </div>
            <div className="clients-stat-card">
              <div className="clients-stat-label">Pending</div>
              <div className="clients-stat-value adm-stat-warn">{pendingCount}</div>
            </div>
            <div className="clients-stat-card">
              <div className="clients-stat-label">Overdue</div>
              <div className="clients-stat-value adm-stat-neg">{overdueCount}</div>
            </div>
          </div>
        </section>

        <section className="adm-section" aria-labelledby="activity-heading">
          <h2 id="activity-heading" className="adm-section-title">Recent activity</h2>
          <div className="adm-activity-grid">
            <div className="clients-stat-card" style={{ textAlign: 'left' }}>
              <div className="adm-activity-card-title">Installations</div>
              <div className="adm-activity-stack">
                {recentInstallations.length === 0 ? (
                  <span className="adm-muted-inline">No installations yet.</span>
                ) : (
                  recentInstallations.map((inst, index) => (
                    <div key={inst.installationid ?? index} className="adm-activity-item">
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{inst.client || 'Client'}</div>
                        <div className="adm-mono" style={{ marginTop: 2 }}>#{inst.installationid ?? '—'}</div>
                      </div>
                      <div className="adm-activity-meta">
                        <span className={statusClass(inst.status)}>{inst.status}</span>
                        <div style={{ marginTop: 4 }}>
                          {inst.scheduleddate ? new Date(inst.scheduleddate).toLocaleDateString() : '—'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="clients-stat-card" style={{ textAlign: 'left' }}>
              <div className="adm-activity-card-title">Payments</div>
              <div className="adm-activity-stack">
                {recentPayments.length === 0 ? (
                  <span className="adm-muted-inline">No payments yet.</span>
                ) : (
                  recentPayments.map((payment, index) => (
                    <div key={payment.paymentid ?? index} className="adm-activity-item">
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{payment.client || 'Client'}</div>
                        <div className="adm-mono" style={{ marginTop: 2 }}>#{payment.paymentid ?? '—'}</div>
                      </div>
                      <div className="adm-activity-meta">
                        <div>${Number(payment.totalamount || 0).toLocaleString()}</div>
                        <div style={{ marginTop: 4 }}>
                          {payment.createdate ? new Date(payment.createdate).toLocaleDateString() : '—'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
