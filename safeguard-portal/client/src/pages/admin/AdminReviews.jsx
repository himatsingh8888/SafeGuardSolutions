import './adminShared.css'
import './AdminReviews.css'
import '../../index.css'
import { useEffect, useMemo, useState } from 'react'
import { API_BASE } from '../../config/apiBase.js'

const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Date — newest first' },
  { value: 'date_asc', label: 'Date — oldest first' },
  { value: 'rating_desc', label: 'Rating — highest first' },
  { value: 'rating_asc', label: 'Rating — lowest first' },
]

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
      if (sortBy === 'date_desc') return new Date(b.reviewdate) - new Date(a.reviewdate)
      if (sortBy === 'date_asc') return new Date(a.reviewdate) - new Date(b.reviewdate)
      if (sortBy === 'rating_desc') return Number(b.rating) - Number(a.rating)
      if (sortBy === 'rating_asc') return Number(a.rating) - Number(b.rating)
      return 0
    })
    return out
  }, [reviews, sortBy, filterRating, search])

  if (loading) {
    return (
      <div className="clients-page">
        <div className="clients-main">
          <div className="adm-state">Loading reviews…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="clients-page">
      <div className="clients-main">
        <div className="clients-page-header">
          <div>
            <h1 className="clients-page-title">Reviews</h1>
            <p className="clients-page-sub">Client feedback linked to accounts</p>
          </div>
        </div>

        {error && (
          <p className="adm-state adm-state-error" role="alert">{error}</p>
        )}

        {!error && reviews.length === 0 && (
          <div className="clients-empty">No reviews yet.</div>
        )}

        {!error && reviews.length > 0 && (
          <>
            <div className="adm-filter-bar">
              <div className="adm-filter-group">
                <span className="adm-filter-label">Sort</span>
                <select className="form-select adm-select-compact" value={sortBy} onChange={e => setSortBy(e.target.value)} aria-label="Sort reviews">
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="adm-filter-group">
                <span className="adm-filter-label">Rating</span>
                <select className="form-select adm-select-compact" value={filterRating} onChange={e => setFilterRating(e.target.value)} aria-label="Filter by rating">
                  <option value="all">All ratings</option>
                  {[5, 4, 3, 2, 1, 0].map(n => (
                    <option key={n} value={n}>{'★'.repeat(n)}{'☆'.repeat(5 - n)} ({n})</option>
                  ))}
                </select>
              </div>
              <div className="clients-search-wrap">
                <svg className="clients-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  className="clients-search-input"
                  type="search"
                  placeholder="Search name, comment, client…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  aria-label="Search reviews"
                />
              </div>
              <span className="adm-toolbar-count">{filtered.length} of {reviews.length}</span>
            </div>

            {filtered.length === 0 && (
              <p className="adm-state">No reviews match the current filters.</p>
            )}

            {filtered.length > 0 && (
              <div className="adm-table-scroll">
                <div className="adm-table-wrap">
                  <table className="adm-table reviews-admin-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Public name</th>
                        <th>Rating</th>
                        <th>Client</th>
                        <th>Comment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(r => (
                        <tr key={r.reviewid}>
                          <td className="adm-mono adm-cell-nowrap">{formatDate(r.reviewdate)}</td>
                          <td className="reviews-name-cell">{r.reviewname || '—'}</td>
                          <td>
                            <span className="adm-stars" aria-hidden>
                              {'★'.repeat(Math.min(5, Math.max(0, Number(r.rating) || 0)))}
                              {'☆'.repeat(5 - Math.min(5, Math.max(0, Number(r.rating) || 0)))}
                            </span>
                            <span className="reviews-rating-num">{r.rating != null ? `${r.rating}/5` : '—'}</span>
                          </td>
                          <td>
                            <div className="reviews-client-name">{[r.client_fname, r.client_lname].filter(Boolean).join(' ') || '—'}</div>
                            <div className="reviews-client-email">{r.client_email || ''}</div>
                            <div className="reviews-client-id">ID {r.clientid}</div>
                          </td>
                          <td className="reviews-comment-cell">{r.reviewcomment || <span className="adm-muted-inline">—</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
