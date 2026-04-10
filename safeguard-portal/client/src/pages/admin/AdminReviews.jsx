import './AdminDashboard.css'
import '../../index.css'
import { useEffect, useState } from 'react'
import { API_BASE } from '../../config/apiBase.js'

export default function AdminReviews() {
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                setLoading(true)
                setError(null)
                const res = await fetch(`${API_BASE}/api/admin/getReviews`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                })
                const data = await res.json()
                if (!res.ok) {
                    throw new Error(data.error || data.message || 'Failed to load reviews')
                }
                setReviews(Array.isArray(data) ? data : [])
            } catch (e) {
                console.error(e)
                setError(e.message || 'Could not load reviews')
                setReviews([])
            } finally {
                setLoading(false)
            }
        }
        fetchReviews()
    }, [])

    const formatDate = (value) => {
        if (!value) return '—'
        const d = new Date(value)
        return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString()
    }

    return (
        <div className="admin-dashboard">
            <div className="dashboard-container">
                <h2 className="dashboard-title">Client reviews</h2>
                <p style={{ color: '#555', marginTop: -12, marginBottom: 24 }}>
                    Reviews submitted by clients, linked to their accounts.
                </p>

                {loading && <p style={{ color: '#666' }}>Loading reviews…</p>}
                {error && (
                    <p style={{ color: '#c62828', marginBottom: 16 }} role="alert">
                        {error}
                    </p>
                )}

                {!loading && !error && reviews.length === 0 && (
                    <p style={{ color: '#666' }}>No reviews yet.</p>
                )}

                {!loading && reviews.length > 0 && (
                    <div
                        style={{
                            overflowX: 'auto',
                            background: '#fff',
                            borderRadius: 12,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }}
                    >
                        <table
                            style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                fontSize: '0.95rem',
                            }}
                        >
                            <thead>
                                <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                                    <th
                                        style={{
                                            textAlign: 'left',
                                            padding: '14px 16px',
                                            color: '#555',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Date
                                    </th>
                                    <th
                                        style={{
                                            textAlign: 'left',
                                            padding: '14px 16px',
                                            color: '#555',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Public name
                                    </th>
                                    <th
                                        style={{
                                            textAlign: 'left',
                                            padding: '14px 16px',
                                            color: '#555',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Rating
                                    </th>
                                    <th
                                        style={{
                                            textAlign: 'left',
                                            padding: '14px 16px',
                                            color: '#555',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Client (account)
                                    </th>
                                    <th
                                        style={{
                                            textAlign: 'left',
                                            padding: '14px 16px',
                                            color: '#555',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Comment
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {reviews.map((r) => (
                                    <tr
                                        key={r.reviewid}
                                        style={{ borderBottom: '1px solid #eee' }}
                                    >
                                        <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                                            {formatDate(r.reviewdate)}
                                        </td>
                                        <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                                            {r.reviewname || '—'}
                                        </td>
                                        <td style={{ padding: '12px 16px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                                            <span style={{ color: '#f9a825' }} aria-hidden>
                                                {'★'.repeat(Math.min(5, Math.max(0, Number(r.rating) || 0)))}
                                            </span>
                                            <span style={{ marginLeft: 6, color: '#666' }}>
                                                {r.rating != null ? `${r.rating}/5` : '—'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                                            <div style={{ fontWeight: 500 }}>
                                                {[r.client_fname, r.client_lname].filter(Boolean).join(' ') || '—'}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                                {r.client_email || ''}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#999' }}>
                                                ID {r.clientid}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 16px', verticalAlign: 'top', maxWidth: 360 }}>
                                            {r.reviewcomment || '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
