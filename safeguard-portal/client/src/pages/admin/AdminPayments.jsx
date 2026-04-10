import '../../index.css'
import './AdminPayments.css'
import { useState, useEffect } from 'react'
import { API_BASE } from '../../config/apiBase.js'

export default function AdminPayments() {
    // State for payments data
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all');

    // Fetch payments data
    const fetchPayments = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch(`${API_BASE}/api/payments`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch payments: ${response.status}`);
            }
            
            const data = await response.json();
            setPayments(data);
        } catch (err) {
            console.error('Error fetching payments:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Load data on component mount
    useEffect(() => {
        fetchPayments();
    }, []);

    // Update payment status
    const updatePaymentStatus = async (paymentId, newStatus) => {
        try {
            const response = await fetch(`${API_BASE}/api/payments/${paymentId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    status: newStatus
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to update status: ${response.status}`);
            }

            // Update local state to reflect the change
            setPayments(payments.map(payment => 
                payment.paymentid === paymentId 
                    ? { ...payment, status: newStatus } 
                    : payment
            ));
        } catch (err) {
            console.error('Error updating payment status:', err);
            alert(`Failed to update status: ${err.message}`);
        }
    };

    // Calculate summary statistics
    const totalPayments = payments.length;
    const paidPayments = payments.filter(p => p.status === 'Paid').length;
    const pendingPayments = payments.filter(p => p.status === 'Pending').length;
    const overduePayments = payments.filter(p => p.status === 'Overdue').length;
    const totalCollected = payments
        .filter(p => p.status === 'Paid')
        .reduce((sum, p) => sum + Number(p.totalamount || 0), 0);

    // Filter payments based on active filter
    const filteredPayments = activeFilter === 'all' 
        ? payments 
        : payments.filter(p => p.status.toLowerCase() === activeFilter);

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
                    <p>Loading payments data...</p>
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
                    <button className="retry-btn" onClick={fetchPayments}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Render empty state
    if (payments.length === 0) {
        return (
            <div className="admin-dashboard">
                <div className="page-header">
                    <h1>Payments</h1>
                    <p className="page-subtitle">View and manage client payment records</p>
                </div>
                <div className="empty-state">
                    <p>No payments found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            {/* Page Header */}
            <div className="page-header">
                <h1>Payments</h1>
                <p className="page-subtitle">View and manage client payment records</p>
            </div>

            {/* Summary Cards */}
            <div className="summary-grid">
                <div className="summary-card">
                    <div className="summary-label">Total Payments</div>
                    <div className="summary-value">{totalPayments}</div>
                </div>
                
                <div className="summary-card">
                    <div className="summary-label">Paid</div>
                    <div className="summary-value paid">{paidPayments}</div>
                </div>
                
                <div className="summary-card">
                    <div className="summary-label">Pending</div>
                    <div className="summary-value pending">{pendingPayments}</div>
                </div>
                
                <div className="summary-card">
                    <div className="summary-label">Total Collected</div>
                    <div className="summary-value collected">{formatCurrency(totalCollected)}</div>
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
                    className={`filter-btn ${activeFilter === 'paid' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('paid')}
                >
                    Paid
                </button>
                <button 
                    className={`filter-btn ${activeFilter === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('pending')}
                >
                    Pending
                </button>
                {overduePayments > 0 && (
                    <button 
                        className={`filter-btn ${activeFilter === 'overdue' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('overdue')}
                    >
                        Overdue
                    </button>
                )}
            </div>

            {/* Payments Table */}
            <div className="table-container">
                <table className="payments-table">
                    <thead>
                        <tr>
                            <th>Payment ID</th>
                            <th>Client</th>
                            <th>Created Date</th>
                            <th>Due Date</th>
                            <th>Payment Type</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPayments.map(payment => (
                            <tr key={payment.paymentid}>
                                <td>{payment.paymentid}</td>
                                <td>{payment.client}</td>
                                <td>{formatDate(payment.createdate)}</td>
                                <td>{formatDate(payment.duedate)}</td>
                                <td>{payment.paymenttype}</td>
                                <td>{formatCurrency(payment.totalamount)}</td>
                                <td>
                                    <span className={`status-badge status-${payment.status.toLowerCase()}`}>
                                        {payment.status}
                                    </span>
                                </td>
                                <td>
                                    {payment.status !== 'Paid' ? (
                                        <button 
                                            className="mark-paid-btn"
                                            onClick={() => updatePaymentStatus(payment.paymentid, 'Paid')}
                                        >
                                            Mark Paid
                                        </button>
                                    ) : (
                                        <span className="paid-text">
                                            Paid on {formatDate(payment.createdate)}
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
