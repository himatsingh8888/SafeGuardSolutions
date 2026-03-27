import '../../index.css'
import './AdminDashboard.css'
import { useState, useEffect } from 'react'

export default function AdminDashboard() {
  // State for API data
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [installations, setInstallations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from backend APIs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Starting data fetch...');

        // Fetch all endpoints separately to handle individual failures
        const clientsRes = await fetch('http://localhost:5000/api/clients');
        const employeesRes = await fetch('http://localhost:5000/api/employees');
        const installationsRes = await fetch('http://localhost:5000/api/installations');
        const paymentsRes = await fetch('http://localhost:5000/api/payments');

        console.log('Responses received:', {
          clients: clientsRes,
          employees: employeesRes,
          installations: installationsRes,
          payments: paymentsRes
        });

        // Parse JSON responses individually - if one fails, others still work
        const clientsData = clientsRes.ok ? await clientsRes.json() : [];
        const employeesData = employeesRes.ok ? await employeesRes.json() : [];
        const installationsData = installationsRes.ok ? await installationsRes.json() : [];
        const paymentsData = paymentsRes.ok ? await paymentsRes.json() : [];

        console.log('Parsed data:', {
          clients: clientsData,
          employees: employeesData,
          installations: installationsData,
          payments: paymentsData
        });

        // Verify data structure
        console.log('Data types and lengths:', {
          clients: { type: Array.isArray(clientsData) ? 'array' : typeof clientsData, length: Array.isArray(clientsData) ? clientsData.length : 'N/A' },
          employees: { type: Array.isArray(employeesData) ? 'array' : typeof employeesData, length: Array.isArray(employeesData) ? employeesData.length : 'N/A' },
          installations: { type: Array.isArray(installationsData) ? 'array' : typeof installationsData, length: Array.isArray(installationsData) ? installationsData.length : 'N/A' },
          payments: { type: Array.isArray(paymentsData) ? 'array' : typeof paymentsData, length: Array.isArray(paymentsData) ? paymentsData.length : 'N/A' }
        });

        // Update state
        setClients(clientsData);
        setEmployees(employeesData);
        setInstallations(installationsData);
        setPayments(paymentsData);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate statistics from real data
  const upcomingInstallations = installations.filter(
    i => i.status === 'Scheduled'
  ).length;

  const completedInstallations = installations.filter(
    i => i.status === 'Completed'
  ).length;

  // Compute financial data from payments API
  const totalRevenue = payments
    .filter(p => p.status === 'Paid')
    .reduce((sum, p) => sum + Number(p.totalamount), 0);

  const pendingCount = payments.filter(p => p.status === 'Pending').length;
  const overdueCount = payments.filter(p => p.status === 'Overdue').length;

  // Financial summary with computed values
  const financialSummary = [
    { label: 'Revenue This Month', value: `$${totalRevenue.toLocaleString()}`, color: '#4caf50' },
    { label: 'Overdue Payments', value: overdueCount, color: '#f44336' },
    { label: 'Pending Payments', value: pendingCount, color: '#ff9800' }
  ];

  // Dynamic recent activity from real data
  const recentInstallations = [...installations]
    .sort((a, b) => new Date(b.scheduleddate) - new Date(a.scheduleddate))
    .slice(0, 3);

  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.createdate) - new Date(a.createdate))
    .slice(0, 3);

  return (
    <div className="admin-dashboard">
      <div className="dashboard-container">
        <h2 className="dashboard-title">Admin Dashboard</h2>
        
        {/* Overview Section */}
        <section className="dashboard-section">
          <h3 className="section-title">Overview</h3>
          <div className="overview-grid">
            <div className="stat-card">
              <span className="stat-label">Total Clients</span>
              <span className="stat-value">{loading ? 'Loading...' : clients.length}</span>
            </div>

            <div className="stat-card">
              <span className="stat-label">Total Employees</span>
              <span className="stat-value">{loading ? 'Loading...' : employees.length}</span>
            </div>

            <div className="stat-card">
              <span className="stat-label">Upcoming Installations</span>
              <span className="stat-value">{loading ? 'Loading...' : upcomingInstallations}</span>
            </div>

            <div className="stat-card">
              <span className="stat-label">Completed Installations</span>
              <span className="stat-value">{loading ? 'Loading...' : completedInstallations}</span>
            </div>
          </div>
        </section>

        {/* Financial Summary Section */}
        <section className="dashboard-section">
          <h3 className="section-title">Financial Summary</h3>
          <div className="financial-grid">
            {financialSummary.map((item, index) => (
              <div key={index} className="financial-card">
                <span className="financial-label">{item.label}</span>
                <span className={`financial-value ${item.label.toLowerCase().replace(/\s+/g, '-')}-color`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Filter Bar Section */}
        <section className="dashboard-section">
          <h3 className="section-title">Filters</h3>
          <div className="filter-container">
            <div className="filter-group">
              <label className="filter-label">Month</label>
              <select className="filter-select">
                <option value="current">Current Month</option>
                <option value="january">January</option>
                <option value="february">February</option>
                <option value="march">March</option>
                <option value="april">April</option>
                <option value="may">May</option>
                <option value="june">June</option>
                <option value="july">July</option>
                <option value="august">August</option>
                <option value="september">September</option>
                <option value="october">October</option>
                <option value="november">November</option>
                <option value="december">December</option>
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Payment Status</label>
              <select className="filter-select">
                <option value="all">All</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
        </section>

        {/* Recent Activity Section */}
        <section className="dashboard-section">
          <h3 className="section-title">Recent Activity</h3>
          <div className="activity-grid">
            {/* Recent Installations */}
            <div className="activity-card">
              <h4 className="activity-header">Recent Installations</h4>
              <div className="activity-list">
                {recentInstallations.map((install, index) => (
                  <div key={index} className="activity-item">
                    <div>
                      <div className="activity-client">{install.client || 'Unknown Client'}</div>
                      <div className="activity-id">{install.installationid || 'N/A'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className={`activity-status status-${install.status.toLowerCase().replace(' ', '-')}`}>
                        {install.status}
                      </div>
                      <div className="activity-date">
                        {install.scheduleddate ? new Date(install.scheduleddate).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Payments */}
            <div className="activity-card">
              <h4 className="activity-header">Recent Payments</h4>
              <div className="activity-list">
                {recentPayments.map((payment, index) => (
                  <div key={index} className="activity-item">
                    <div>
                      <div className="activity-client">{payment.client || 'Unknown Client'}</div>
                      <div className="activity-id">{payment.paymentid || 'N/A'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="activity-value">
                        ${Number(payment.totalamount || 0).toLocaleString()}
                      </div>
                      <div className="activity-date">
                        {payment.createdate ? new Date(payment.createdate).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

