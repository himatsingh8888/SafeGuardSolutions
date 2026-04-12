import './AdminDashboard.css'
import '../../index.css'
import { useEffect, useMemo, useState } from 'react'
import { API_BASE } from '../../config/apiBase.js'

const SORT_OPTIONS = [
    { value: 'date_desc',   label: 'Date — newest first' },
    { value: 'date_asc',    label: 'Date — oldest first' },
    { value: 'rating_desc', label: 'Rating — highest first' },
    { value: 'rating_asc',  label: 'Rating — lowest first' },
]

const ctrl = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: '0.875rem',
    color: '#444',
    fontWeight: 500,
}
const select = {
    fontFamily: 'inherit',
    fontSize: '0.875rem',
    color: '#222',
    background: '#fff',
    border: '1px solid #ddd',
    borderRadius: 7,
    padding: '6px 10px',
    cursor: 'pointer',
    outline: 'none',
}
const thStyle = {
    textAlign: 'left',
    padding: '12px 16px',
    color: '#888',
    fontWeight: 600,
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    background: '#fafafa',
    borderBottom: '1px solid #eee',
    whiteSpace: 'nowrap',
}

export default function AdminReviews() {
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [sortBy, setSortBy] = useState('date_desc')
    const [filterRating, setFilterRating] = useState('all')
    const [search, setSearch] = useState('')

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                setLoading(true)
                setError(null)
                const res = await fetch(`${API_BASE}/api/admin/getReviews`, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || data.message || 'Failed to load reviews')
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

    const filtered = useMemo(() => {
        let out = [...reviews]

        if (filterRating !== 'all') {
            const n = parseInt(filterRating, 10)
            out = out.filter(r => Number(r.rating) === n)
        }

        if (search.trim()) {
            const q = search.toLowerCase()
            out = out.filter(r =>
                (r.reviewname || '').toLowerCase().includes(q) ||
                (r.reviewcomment || '').toLowerCase().includes(q) ||
                (r.client_fname || '').toLowerCase().includes(q) ||
                (r.client_lname || '').toLowerCase().includes(q) ||
                (r.client_email || '').toLowerCase().includes(q)
            )
        }

        out.sort((a, b) => {
            if (sortBy === 'date_desc')   return new Date(b.reviewdate) - new Date(a.reviewdate)
            if (sortBy === 'date_asc')    return new Date(a.reviewdate) - new Date(b.reviewdate)
            if (sortBy === 'rating_desc') return Number(b.rating) - Number(a.rating)
            if (sortBy === 'rating_asc')  return Number(a.rating) - Number(b.rating)
            return 0
        })

        return out
    }, [reviews, sortBy, filterRating, search])

    return (
        <div className="admin-dashboard">
            <div className="dashboard-container">
                <h2 className="dashboard-title">Client reviews</h2>
                <p style={{ color: '#555', marginTop: -12, marginBottom: 24 }}>
                    Reviews submitted by clients, linked to their accounts.
                </p>

                {/* Filter bar */}
                {!loading && reviews.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 18, alignItems: 'center' }}>
                        <div style={ctrl}>
                            <span>Sort</span>
                            <select style={select} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                        <div style={ctrl}>
                            <span>Rating</span>
                            <select style={select} value={filterRating} onChange={e => setFilterRating(e.target.value)}>
                                <option value="all">All ratings</option>
                                {[5,4,3,2,1,0].map(n => (
                                    <option key={n} value={n}>{'★'.repeat(n)}{'☆'.repeat(5-n)} ({n})</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ ...ctrl, marginLeft: 'auto' }}>
                            <input
                                type="search"
                                placeholder="Search name, comment, client…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ ...select, width: 240 }}
                            />
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#aaa' }}>
                            {filtered.length} of {reviews.length}
                        </span>
                    </div>
                )}

                {loading && <p style={{ color: '#666' }}>Loading reviews…</p>}
                {error && <p style={{ color: '#c62828', marginBottom: 16 }} role="alert">{error}</p>}
                {!loading && !error && reviews.length === 0 && <p style={{ color: '#666' }}>No reviews yet.</p>}
                {!loading && reviews.length > 0 && filtered.length === 0 && (
                    <p style={{ color: '#999' }}>No reviews match the current filters.</p>
                )}

                {!loading && filtered.length > 0 && (
                    <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>Date</th>
                                    <th style={thStyle}>Public name</th>
                                    <th style={thStyle}>Rating</th>
                                    <th style={thStyle}>Client (account)</th>
                                    <th style={thStyle}>Comment</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((r) => (
                                    <tr key={r.reviewid} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '12px 16px', verticalAlign: 'top', whiteSpace: 'nowrap', color: '#888', fontSize: '0.85rem' }}>
                                            {formatDate(r.reviewdate)}
                                        </td>
                                        <td style={{ padding: '12px 16px', verticalAlign: 'top', fontWeight: 500 }}>
                                            {r.reviewname || '—'}
                                        </td>
                                        <td style={{ padding: '12px 16px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                                            <span style={{ color: '#f9a825' }}>
                                                {'★'.repeat(Math.min(5, Math.max(0, Number(r.rating) || 0)))}
                                                {'☆'.repeat(5 - Math.min(5, Math.max(0, Number(r.rating) || 0)))}
                                            </span>
                                            <span style={{ marginLeft: 6, color: '#888', fontSize: '0.85rem' }}>
                                                {r.rating != null ? `${r.rating}/5` : '—'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                                            <div style={{ fontWeight: 500 }}>
                                                {[r.client_fname, r.client_lname].filter(Boolean).join(' ') || '—'}
                                            </div>
                                            <div style={{ fontSize: '0.82rem', color: '#777' }}>{r.client_email || ''}</div>
                                            <div style={{ fontSize: '0.78rem', color: '#bbb' }}>ID {r.clientid}</div>
                                        </td>
                                        <td style={{ padding: '12px 16px', verticalAlign: 'top', maxWidth: 360, color: '#444', lineHeight: 1.5 }}>
                                            {r.reviewcomment || <span style={{ color: '#ccc' }}>—</span>}
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
