import '../../index.css'
import './adminShared.css'
import './AdminPayments.css'
import { useState, useEffect } from 'react'
import { API_BASE } from '../../config/apiBase.js'

function paymentBadgeClass(status) {
  const s = String(status || '').toLowerCase()
  if (s === 'paid') return 'clients-badge paid'
  if (s === 'pending') return 'clients-badge pending'
  if (s === 'overdue') return 'clients-badge overdue'
  return 'clients-skill-tag'
}

export default function AdminPayments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')

  const fetchPayments = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${API_BASE}/api/payments`)
      if (!response.ok) throw new Error(`Failed to fetch payments: ${response.status}`)
      const data = await response.json()
      setPayments(data)
    } catch (err) {
      console.error('Error fetching payments:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  const updatePaymentStatus = async (paymentId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE}/api/payments/${paymentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!response.ok) throw new Error(`Failed to update status: ${response.status}`)
      setPayments(payments.map(payment =>
        payment.paymentid === paymentId ? { ...payment, status: newStatus } : payment
      ))
    } catch (err) {
      console.error('Error updating payment status:', err)
      alert(`Failed to update status: ${err.message}`)
    }
  }

  const totalPayments = payments.length
  const paidPayments = payments.filter(p => p.status === 'Paid').length
  const pendingPayments = payments.filter(p => p.status === 'Pending').length
  const overduePayments = payments.filter(p => p.status === 'Overdue').length
  const totalCollected = payments
    .filter(p => p.status === 'Paid')
    .reduce((sum, p) => sum + Number(p.totalamount || 0), 0)

  const filteredPayments = activeFilter === 'all'
    ? payments
    : payments.filter(p => p.status.toLowerCase() === activeFilter)

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
    return shell(<div className="adm-state">Loading payments…</div>)
  }

  if (error) {
    return shell(
      <div>
        <p className="adm-state adm-state-error" role="alert">{error}</p>
        <div style={{ textAlign: 'center' }}>
          <button type="button" className="adm-retry" onClick={fetchPayments}>Retry</button>
        </div>
      </div>
    )
  }

  if (payments.length === 0) {
    return shell(
      <>
        <div className="clients-page-header">
          <div>
            <h1 className="clients-page-title">Payments</h1>
            <p className="clients-page-sub">Client billing and collection status</p>
          </div>
        </div>
        <div className="clients-empty">No payments on file.</div>
      </>
    )
  }

  return (
    <div className="clients-page">
      <div className="clients-main">
        <div className="clients-page-header">
          <div>
            <h1 className="clients-page-title">Payments</h1>
            <p className="clients-page-sub">Record and track payment status</p>
          </div>
        </div>

        <div className="clients-summary-strip">
          <div className="clients-stat-card">
            <div className="clients-stat-label">Total</div>
            <div className="clients-stat-value">{totalPayments}</div>
          </div>
          <div className="clients-stat-card">
            <div className="clients-stat-label">Paid</div>
            <div className="clients-stat-value adm-stat-pos">{paidPayments}</div>
          </div>
          <div className="clients-stat-card">
            <div className="clients-stat-label">Pending</div>
            <div className="clients-stat-value adm-stat-warn">{pendingPayments}</div>
          </div>
          <div className="clients-stat-card">
            <div className="clients-stat-label">Collected</div>
            <div className="clients-stat-value">{formatCurrency(totalCollected)}</div>
          </div>
        </div>

        <div className="clients-toolbar">
          <div className="clients-filter-row">
            <button type="button" className={`clients-filter-btn${activeFilter === 'all' ? ' active' : ''}`} onClick={() => setActiveFilter('all')}>All</button>
            <button type="button" className={`clients-filter-btn${activeFilter === 'paid' ? ' active' : ''}`} onClick={() => setActiveFilter('paid')}>Paid</button>
            <button type="button" className={`clients-filter-btn${activeFilter === 'pending' ? ' active' : ''}`} onClick={() => setActiveFilter('pending')}>Pending</button>
            {overduePayments > 0 && (
              <button type="button" className={`clients-filter-btn${activeFilter === 'overdue' ? ' active' : ''}`} onClick={() => setActiveFilter('overdue')}>Overdue</button>
            )}
          </div>
        </div>

        <div className="adm-table-scroll">
          <div className="adm-table-wrap">
            <table className="adm-table payments-admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Client</th>
                  <th>Created</th>
                  <th>Due</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map(payment => (
                  <tr key={payment.paymentid}>
                    <td className="adm-mono">{payment.paymentid}</td>
                    <td>{payment.client || '—'}</td>
                    <td>{formatDate(payment.createdate)}</td>
                    <td>{formatDate(payment.duedate)}</td>
                    <td>{payment.paymenttype || '—'}</td>
                    <td>{formatCurrency(payment.totalamount)}</td>
                    <td>
                      <span className={paymentBadgeClass(payment.status)}>{payment.status}</span>
                    </td>
                    <td>
                      {payment.status !== 'Paid' ? (
                        <button type="button" className="adm-btn-action" onClick={() => updatePaymentStatus(payment.paymentid, 'Paid')}>
                          Mark paid
                        </button>
                      ) : (
                        <span className="adm-muted-inline">{formatDate(payment.createdate)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="clients-footer">
          Showing {filteredPayments.length} of {payments.length} payments
        </div>
      </div>
    </div>
  )
}
