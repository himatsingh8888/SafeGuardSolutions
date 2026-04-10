import '../../index.css'
import './AdminInstallations.css'
import { useState, useEffect } from 'react'
import { API_BASE } from '../../config/apiBase.js'

export default function AdminInstallations() {
    // State for installations data
    const [installations, setInstallations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all');

    // Fetch installations data
    const fetchInstallations = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch(`${API_BASE}/api/installations`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch installations: ${response.status}`);
            }
            
            const data = await response.json();
            setInstallations(data);
        } catch (err) {
            console.error('Error fetching installations:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Load data on component mount
    useEffect(() => {
        fetchInstallations();
    }, []);

    // Update installation status
    const updateInstallationStatus = async (installationId, newStatus) => {
        try {
            const response = await fetch(`${API_BASE}/api/admin/updateInstallationStatus`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    installationid: installationId,
                    status: newStatus
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to update status: ${response.status}`);
            }

            // Update local state to reflect the change
            setInstallations(installations.map(installation => 
                installation.installationid === installationId 
                    ? { ...installation, status: newStatus, completeddate: newStatus === 'Completed' ? new Date().toISOString().split('T')[0] : installation.completeddate } 
                    : installation
            ));
        } catch (err) {
            console.error('Error updating installation status:', err);
            alert(`Failed to update status: ${err.message}`);
        }
    };

    // Calculate summary statistics
    const totalInstallations = installations.length;
    const scheduledInstallations = installations.filter(i => i.status === 'Scheduled').length;
    const completedInstallations = installations.filter(i => i.status === 'Completed').length;
    const totalRevenue = installations.reduce((sum, i) => sum + Number(i.price || 0), 0);

    // Filter installations based on active filter
    const filteredInstallations = activeFilter === 'all' 
        ? installations 
        : installations.filter(i => i.status.toLowerCase() === activeFilter);

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

    // Format currency for display
    const formatCurrency = (amount) => {
        return `$${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Render loading state
    if (loading) {
        return (
            <div className="admin-dashboard">
                <div className="loading-state">
                    <p>Loading installations data...</p>
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
                    <button className="retry-btn" onClick={fetchInstallations}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Render empty state
    if (installations.length === 0) {
        return (
            <div className="admin-dashboard">
                <div className="page-header">
                    <h1>Installations</h1>
                    <p className="page-subtitle">View and manage scheduled and completed installation jobs</p>
                </div>
                <div className="empty-state">
                    <p>No installations found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            {/* Page Header */}
            <div className="page-header">
                <h1>Installations</h1>
                <p className="page-subtitle">View and manage scheduled and completed installation jobs</p>
            </div>

            {/* Summary Cards */}
            <div className="summary-grid">
                <div className="summary-card">
                    <div className="summary-label">Total Installations</div>
                    <div className="summary-value">{totalInstallations}</div>
                </div>
                
                <div className="summary-card">
                    <div className="summary-label">Scheduled</div>
                    <div className="summary-value scheduled">{scheduledInstallations}</div>
                </div>
                
                <div className="summary-card">
                    <div className="summary-label">Completed</div>
                    <div className="summary-value completed">{completedInstallations}</div>
                </div>
                
                <div className="summary-card">
                    <div className="summary-label">Total Revenue</div>
                    <div className="summary-value revenue">{formatCurrency(totalRevenue)}</div>
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
                    className={`filter-btn ${activeFilter === 'scheduled' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('scheduled')}
                >
                    Scheduled
                </button>
                <button 
                    className={`filter-btn ${activeFilter === 'completed' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('completed')}
                >
                    Completed
                </button>
            </div>

            {/* Installations Table */}
            <div className="table-container">
                <table className="installations-table">
                    <thead>
                        <tr>
                            <th>Installation ID</th>
                            <th>Site ID</th>
                            <th>Scheduled Date</th>
                            <th>Description</th>
                            <th>Technicians</th>
                            <th>Price</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInstallations.map(installation => (
                            <tr key={installation.installationid}>
                                <td>{installation.installationid}</td>
                                <td>{installation.siteid}</td>
                                <td>{formatDate(installation.scheduleddate)}</td>
                                <td>{installation.description}</td>
                                <td>{installation.techniciannumbs}</td>
                                <td>{formatCurrency(installation.price)}</td>
                                <td>
                                    <span className={`status-badge status-${installation.status.toLowerCase()}`}>
                                        {installation.status}
                                    </span>
                                </td>
                                <td>
                                    {installation.status === 'Scheduled' ? (
                                        <button 
                                            className="mark-complete-btn"
                                            onClick={() => updateInstallationStatus(installation.installationid, 'Completed')}
                                        >
                                            Mark Complete
                                        </button>
                                    ) : (
                                        <span className="completed-text">
                                            Completed {formatDate(installation.completeddate)}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
