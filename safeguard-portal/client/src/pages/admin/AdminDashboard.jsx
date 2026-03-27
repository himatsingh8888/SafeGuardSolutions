import '../../index.css'
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
  const upcomingInstallations = installations.filter(inst => inst.status === 'Scheduled').length;
  const pendingPayments = payments.filter(payment => payment.status === 'Pending').length;

  // Mock data for financial summary (keeping as mock since not specified in requirements)
  const financialSummary = [
    { label: 'Revenue This Month', value: '$12,500', color: '#4caf50' },
    { label: 'Overdue Payments', value: 3, color: '#f44336' },
    { label: 'Pending Payments', value: 8, color: '#ff9800' }
  ];

  // Mock data for recent activity (keeping as mock since not specified in requirements)
  const recentInstallations = [
    { id: 'INST-001', client: 'John Smith', date: 'Mar 24, 2024', status: 'Completed' },
    { id: 'INST-002', client: 'Acme Corp', date: 'Mar 23, 2024', status: 'In Progress' },
    { id: 'INST-003', client: 'Jane Doe', date: 'Mar 22, 2024', status: 'Scheduled' }
  ];

  const recentPayments = [
    { id: 'PAY-001', client: 'Tech Solutions', amount: '$1,250.00', date: 'Mar 24, 2024' },
    { id: 'PAY-002', client: 'City Hospital', amount: '$2,800.00', date: 'Mar 23, 2024' }
  ];

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#e9e4db',
      fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif'
    }}>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '24px', color: '#333' }}>Admin Dashboard</h2>
        
        {/* Overview Section */}
        <section style={{ marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '16px', color: '#555', fontSize: '1.25rem' }}>Overview</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <span style={{
                fontSize: '0.875rem',
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Total Clients
              </span>
              <span style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#333'
              }}>
                {loading ? 'Loading...' : clients.length}
              </span>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <span style={{
                fontSize: '0.875rem',
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Total Employees
              </span>
              <span style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#333'
              }}>
                {loading ? 'Loading...' : employees.length}
              </span>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <span style={{
                fontSize: '0.875rem',
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Upcoming Installations
              </span>
              <span style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#333'
              }}>
                {loading ? 'Loading...' : upcomingInstallations}
              </span>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <span style={{
                fontSize: '0.875rem',
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Pending Payments
              </span>
              <span style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#333'
              }}>
                {loading ? 'Loading...' : pendingPayments}
              </span>
            </div>
          </div>
        </section>

        {/* Financial Summary Section */}
        <section style={{ marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '16px', color: '#555', fontSize: '1.25rem' }}>Financial Summary</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px'
          }}>
            {financialSummary.map((item, index) => (
              <div key={index} style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  color: '#666',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {item.label}
                </span>
                <span style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: item.color
                }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Filter Bar Section */}
        <section style={{ marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '16px', color: '#555', fontSize: '1.25rem' }}>Filters</h3>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            gap: '16px',
            alignItems: 'center'
          }}>
            <div style={{ flex: 1 }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '0.875rem',
                color: '#555'
              }}>
                Month
              </label>
              <select style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '1rem',
                backgroundColor: 'white'
              }}>
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
            <div style={{ flex: 1 }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '0.875rem',
                color: '#555'
              }}>
                Payment Status
              </label>
              <select style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '1rem',
                backgroundColor: 'white'
              }}>
                <option value="all">All</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
        </section>

        {/* Recent Activity Section */}
        <section>
          <h3 style={{ marginBottom: '16px', color: '#555', fontSize: '1.25rem' }}>Recent Activity</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px'
          }}>
            {/* Recent Installations */}
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <h4 style={{
                margin: '0 0 16px 0',
                fontSize: '1rem',
                color: '#333',
                borderBottom: '2px solid #f0f0f0',
                paddingBottom: '8px'
              }}>
                Recent Installations
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentInstallations.map((install, index) => (
                  <div key={index} style={{
                    padding: '12px',
                    border: '1px solid #f0f0f0',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#333' }}>{install.client}</div>
                      <div style={{ fontSize: '0.875rem', color: '#666' }}>{install.id}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        padding: '4px 8px',
                        borderRadius: '16px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: install.status === 'Completed' ? '#e8f5e9' : 
                                       install.status === 'In Progress' ? '#fff3e0' : '#f3e5f5',
                        color: install.status === 'Completed' ? '#2e7d32' : 
                              install.status === 'In Progress' ? '#ef6c00' : '#7b1fa2'
                      }}>
                        {install.status}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '4px' }}>
                        {install.date}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Payments */}
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <h4 style={{
                margin: '0 0 16px 0',
                fontSize: '1rem',
                color: '#333',
                borderBottom: '2px solid #f0f0f0',
                paddingBottom: '8px'
              }}>
                Recent Payments
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentPayments.map((payment, index) => (
                  <div key={index} style={{
                    padding: '12px',
                    border: '1px solid #f0f0f0',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#333' }}>{payment.client}</div>
                      <div style={{ fontSize: '0.875rem', color: '#666' }}>{payment.id}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        color: '#2e7d32'
                      }}>
                        {payment.amount}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '4px' }}>
                        {payment.date}
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

