import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import AttendanceAnalytics from '../analytics/AttendanceAnalytics';
import adminService from '../../services/adminService';
import blockchainService from '../../services/blockchainService';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    totalClasses: 0,
    activeAttendanceSessions: 0
  });
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [systemHealth, setSystemHealth] = useState({
    blockchainStatus: 'checking',
    databaseStatus: 'checking',
    faceApiStatus: 'checking',
    cctvStatus: 'checking'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    initializeSystemHealthCheck();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsData, alertsData] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getFraudAlerts()
      ]);
      
      setStats(statsData);
      setFraudAlerts(alertsData);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    }
  };

  const initializeSystemHealthCheck = () => {
    checkSystemHealth();
    // Run health check every 5 minutes
    setInterval(checkSystemHealth, 300000);
  };

  const checkSystemHealth = async () => {
    try {
      // Check blockchain connection
      const blockchainHealth = await blockchainService.checkConnection();
      
      // Check other system components
      const health = await adminService.checkSystemHealth();
      
      setSystemHealth({
        blockchainStatus: blockchainHealth ? 'operational' : 'down',
        databaseStatus: health.database ? 'operational' : 'down',
        faceApiStatus: health.faceApi ? 'operational' : 'down',
        cctvStatus: health.cctv ? 'operational' : 'down'
      });
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  const handleFraudAlert = async (alertId, action) => {
    try {
      await adminService.handleFraudAlert(alertId, action);
      toast.success('Alert handled successfully');
      // Refresh fraud alerts
      const alertsData = await adminService.getFraudAlerts();
      setFraudAlerts(alertsData);
    } catch (error) {
      toast.error('Failed to handle alert');
    }
  };

  return (
    <div className="admin-dashboard fade-in">
      <div className="dashboard-header">
        <h2>Admin Dashboard</h2>
        <div className="system-health">
          {Object.entries(systemHealth).map(([system, status]) => (
            <div key={system} className={`health-indicator ${status}`}>
              <span className="system-name">
                {system.replace('Status', '')}
              </span>
              <span className="status-dot"></span>
              <span className="status-text">{status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Students</h3>
          <p>{stats.totalStudents}</p>
        </div>
        <div className="stat-card">
          <h3>Total Faculty</h3>
          <p>{stats.totalFaculty}</p>
        </div>
        <div className="stat-card">
          <h3>Total Classes</h3>
          <p>{stats.totalClasses}</p>
        </div>
        <div className="stat-card">
          <h3>Active Sessions</h3>
          <p>{stats.activeAttendanceSessions}</p>
        </div>
      </div>

      <div className="fraud-alerts-container">
        <h3>Fraud Alerts</h3>
        {fraudAlerts.length > 0 ? (
          <div className="alerts-list">
            {fraudAlerts.map((alert) => (
              <div key={alert._id} className="alert-card">
                <div className="alert-header">
                  <span className={`alert-type ${alert.severity}`}>
                    {alert.type}
                  </span>
                  <span className="alert-time">
                    {new Date(alert.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="alert-description">{alert.description}</p>
                <div className="alert-actions">
                  <button
                    onClick={() => handleFraudAlert(alert._id, 'investigate')}
                    className="investigate-btn"
                  >
                    Investigate
                  </button>
                  <button
                    onClick={() => handleFraudAlert(alert._id, 'dismiss')}
                    className="dismiss-btn"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-alerts">No fraud alerts detected</p>
        )}
      </div>

      <div className="analytics-section">
        <h3>System Analytics</h3>
        <AttendanceAnalytics isAdmin={true} />
      </div>
    </div>
  );
};

export default AdminDashboard;
