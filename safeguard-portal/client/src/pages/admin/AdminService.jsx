import '../../index.css'
import './AdminService.css'
import { useState, useEffect } from 'react'
import { API_BASE } from '../../config/apiBase.js'

export default function AdminService() {
    // State for service visits data
    const [serviceVisits, setServiceVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [selectedNotes, setSelectedNotes] = useState('');

    // Fetch service visits data
    const fetchServiceVisits = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch(`${API_BASE}/api/service-visits`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch service visits: ${response.status}`);
            }
            
            const data = await response.json();
            setServiceVisits(data);
        } catch (err) {
            console.error('Error fetching service visits:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Load data on component mount
    useEffect(() => {
        fetchServiceVisits();
    }, []);

    // Update service visit status
    const updateServiceVisitStatus = async (visitNumber, newStatus) => {
        try {
            const response = await fetch(`${API_BASE}/api/service-visits/${visitNumber}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    outcomestatus: newStatus
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to update status: ${response.status}`);
            }

            // Update local state to reflect the change
            setServiceVisits(serviceVisits.map(visit => 
                visit.visitnumber === visitNumber 
                    ? { ...visit, outcomestatus: newStatus } 
                    : visit
            ));
        } catch (err) {
            console.error('Error updating service visit status:', err);
            alert(`Failed to update status: ${err.message}`);
        }
    };

    // Calculate summary statistics
    const totalVisits = serviceVisits.length;
    const completedVisits = serviceVisits.filter(v => v.outcomestatus === 'Completed').length;
    const pendingVisits = serviceVisits.filter(v => v.outcomestatus === 'Pending').length;
    const followupVisits = serviceVisits.filter(v => v.outcomestatus === 'Follow-up required').length;

    // Filter service visits based on active filter
    const filteredVisits = activeFilter === 'all' 
        ? serviceVisits 
        : serviceVisits.filter(v => {
            if (activeFilter === 'followup') {
                return v.outcomestatus === 'Follow-up required';
            }
            return v.outcomestatus.toLowerCase() === activeFilter;
        });

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    // Truncate notes for display
    const truncateNotes = (notes, maxLength = 40) => {
        if (!notes) return '—';
        if (notes.length <= maxLength) return notes;
        return notes.substring(0, maxLength) + '...';
    };

    // Open notes modal
    const openNotesModal = (notes) => {
        setSelectedNotes(notes);
        setShowModal(true);
    };

    // Get status class name
    const getStatusClassName = (status) => {
        if (status === 'Completed') return 'status-completed';
        if (status === 'Pending') return 'status-pending';
        if (status === 'Follow-up required') return 'status-followup';
        return '';
    };

    // Render loading state
    if (loading) {
        return (
            <div className="admin-dashboard">
                <div className="loading-state">
                    <p>Loading service visits data...</p>
                </div>
            </div>
        );
    }

    // Render error state
    if (error) {
        return (
            <div className="admin-dashboard">
                <div className="error-state">
                    <p>Error: {error}</p>
                    <button className="retry-btn" onClick={fetchServiceVisits}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Render empty state
    if (serviceVisits.length === 0) {
        return (
            <div className="admin-dashboard">
                <div className="page-header">
                    <h1>Service Visits</h1>
                    <p className="page-subtitle">Track inspections, repairs, upgrades, and follow-up visits</p>
                </div>
                <div className="empty-state">
                    <p>No service visits found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            {/* Notes Modal */}
            {showModal && (
                <div className="overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h1>Service Visit Notes</h1>
                            <button onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal-notes-content">
                            <p>{selectedNotes || 'No notes available.'}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <div className="page-header">
                <h1>Service Visits</h1>
                <p className="page-subtitle">Track inspections, repairs, upgrades, and follow-up visits</p>
            </div>

            {/* Summary Cards */}
            <div className="summary-grid">
                <div className="summary-card">
                    <div className="summary-label">Total Visits</div>
                    <div className="summary-value">{totalVisits}</div>
                </div>
                
                <div className="summary-card">
                    <div className="summary-label">Completed</div>
                    <div className="summary-value completed">{completedVisits}</div>
                </div>
                
                <div className="summary-card">
                    <div className="summary-label">Pending</div>
                    <div className="summary-value pending">{pendingVisits}</div>
                </div>
                
                <div className="summary-card">
                    <div className="summary-label">Follow-up Required</div>
                    <div className="summary-value followup">{followupVisits}</div>
                </div>
            </div>

            {/* Filter Buttons */}
            <div className="filter-row">
                <button 
                    className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('all')}
                >
                    All
                </button>
                <button 
                    className={`filter-btn ${activeFilter === 'completed' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('completed')}
                >
                    Completed
                </button>
                <button 
                    className={`filter-btn ${activeFilter === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('pending')}
                >
                    Pending
                </button>
                <button 
                    className={`filter-btn ${activeFilter === 'followup' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('followup')}
                >
                    Follow-up Required
                </button>
            </div>

            {/* Service Visits Table */}
            <div className="table-container">
                <table className="service-visits-table">
                    <thead>
                        <tr>
                            <th>Visit Number</th>
                            <th>Installation ID</th>
                            <th>Visit Date</th>
                            <th>Visit Type</th>
                            <th>Notes</th>
                            <th>Outcome Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredVisits.map(visit => (
                            <tr key={visit.visitnumber}>
                                <td>{visit.visitnumber}</td>
                                <td>{visit.installationid}</td>
                                <td>{formatDate(visit.visitdate)}</td>
                                <td>{visit.visittype}</td>
                                <td>
                                    <div className="notes-container">
                                        {truncateNotes(visit.notes)}
                                        {visit.notes && visit.notes.length > 40 && (
                                            <button 
                                                className="view-notes-btn"
                                                onClick={() => openNotesModal(visit.notes)}
                                            >
                                                View
                                            </button>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <span className={`status-badge ${getStatusClassName(visit.outcomestatus)}`}>
                                        {visit.outcomestatus}
                                    </span>
                                </td>
                                <td>
                                    <select 
                                        className="status-select"
                                        value={visit.outcomestatus}
                                        onChange={(e) => updateServiceVisitStatus(visit.visitnumber, e.target.value)}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Follow-up required">Follow-up Required</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
