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
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
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

    function truncateNotes(notes, maxLength = 40) {
        if (!notes) return ''
        if (notes.length <= maxLength) return notes
        return notes.substring(0, maxLength) + '...'
    }

    function openNotesModal(notes) {
        setSelectedNote(notes)
        setShowModal(true)
    }

    async function toggleStatus(requestid, currentStatus) {
        const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed'
        console.log('Toggling status:', { requestid, currentStatus, newStatus });
        
        try {
            const res = await fetch(`${API_BASE}/api/quote-request/${requestid}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status: newStatus })
            })
            console.log('Response status:', res.status);
            
            if (res.ok) {
                const data = await res.json();
                console.log('Response data:', data);
                setRequests(requests.map(req =>
                    req.requestid === requestid ? { ...req, status: newStatus } : req
                ))
            } else {
                const errorData = await res.json();
                console.error('Error response:', errorData);
            }
        } catch (error) {
            console.error('Fetch error:', error)
        }
    }

    if (loading) {
        return (
            <div className="Admin-Dashboard" style={{ padding: 24 }}>
                <p>Loading...</p>
            </div>
        )
    }

    if (requests.length === 0) {
        return (
            <div className="Admin-Dashboard" style={{ padding: 24 }}>
                <div className="page-header">
                    <div className='header-title'>
                        <h2>Quote Requests</h2>
                        <p>View and manage customer quote requests</p>
                    </div>
                </div>
                <p>No requests found</p>
            </div>
        )
    }

    return (
        <div className="Admin-Dashboard" style={{ padding: 24 }}>
            {showModal && (
                <div className='overlay' onClick={() => setShowModal(false)}>
                    <div className='modal' onClick={(e) => e.stopPropagation()}>
                        <div className='modal-header'>
                            <h1>Full Notes</h1>
                            <button onClick={() => setShowModal(false)}>x</button>
                        </div>
                        <div className='modal-notes-content'>
                            <p>{selectedNote}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="page-header">
                <div className='header-title'>
                    <h2>Quote Requests</h2>
                    <p>View and manage customer quote requests</p>
                </div>
            </div>
            <div className='Inventory-Table'>
                <div className='Inventory-Header'>
                    <h4>NAME</h4>
                    <h4>EMAIL</h4>
                    <h4>LOCATION</h4>
                    <h4>ADDRESS</h4>
                    <h4>NOTES</h4>
                    <h4>STATUS</h4>
                </div>
                {requests.map((request) => (
                    <div key={request.requestid} className='quote-request-row'>
                        <h4>{request.name}</h4>
                        <div className='col-email'>
                            <p>{request.email}</p>
                        </div>
                        <div className='col-location'>
                            <p>{request.locationtype || '—'}</p>
                        </div>
                        <div className='col-address'>
                            <p>{request.address || '—'}</p>
                        </div>
                        <div className='col-notes'>
                            <p className='notes-preview'>{truncateNotes(request.notes)}</p>
                            {request.notes && request.notes.length > 40 && (
                                <button
                                    className='view-notes-btn'
                                    onClick={() => openNotesModal(request.notes)}
                                >
                                    View
                                </button>
                            )}
                        </div>
                        <div className='col-status'>
                            <span
                                className={`status-badge ${request.status === 'Completed' ? 'completed' : 'pending'}`}
                                onClick={() => toggleStatus(request.requestid, request.status)}
                                style={{ cursor: 'pointer' }}
                                title="Click to toggle status"
                            >
                                {request.status || 'Pending'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}