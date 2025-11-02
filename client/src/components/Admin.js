import React, { useState, useEffect } from 'react';
import './Admin.css';

// Use relative URL since frontend and backend are served from same server
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5001/api'
  : '/api';

function Admin({ token, user }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [logFilter, setLogFilter] = useState('all');

  useEffect(() => {
    if (user?.isAdmin) {
      fetchAdminData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

  const fetchAdminData = async () => {
    try {
      if (activeTab === 'logs') {
        const response = await fetch(`${API_URL}/admin/logs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setLogs(data.logs || []);
      } else if (activeTab === 'users') {
        const response = await fetch(`${API_URL}/admin/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setUsers(data.users || []);
      } else if (activeTab === 'analytics' || activeTab === 'overview') {
        const response = await fetch(`${API_URL}/admin/analytics`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) {
      setMessage('❌ Please select a user and enter a new password');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          newPassword
        })
      });

      if (response.ok) {
        setMessage('✅ Password reset successfully!');
        setNewPassword('');
        setSelectedUser(null);
      } else {
        setMessage('❌ Failed to reset password');
      }
    } catch (err) {
      setMessage('❌ Error resetting password');
    }

    setTimeout(() => setMessage(''), 3000);
  };

  const handleViewSecurityAnswers = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/admin/security-answers/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.securityQuestions) {
        alert(`Security Questions for user:\n\n${data.securityQuestions.map((q, i) => 
          `Q${i + 1}: ${q.question}\nA${i + 1}: ${q.answer}`
        ).join('\n\n')}`);
      } else {
        alert('No security questions found for this user');
      }
    } catch (err) {
      alert('Error fetching security answers');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/delete-user/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setMessage('✅ User deleted successfully!');
        fetchAdminData();
      } else {
        setMessage('❌ Failed to delete user');
      }
    } catch (err) {
      setMessage('❌ Error deleting user');
    }

    setTimeout(() => setMessage(''), 3000);
  };

  if (!user?.isAdmin) {
    return (
      <div className="admin-panel">
        <div className="access-denied">
          <h2>🚫 Access Denied</h2>
          <p>You do not have administrator privileges.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <h1>🛡️ Administrator Panel</h1>
      
      <div className="admin-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''} 
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={activeTab === 'users' ? 'active' : ''} 
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
        <button 
          className={activeTab === 'logs' ? 'active' : ''} 
          onClick={() => setActiveTab('logs')}
        >
          📝 Logs
        </button>
        <button 
          className={activeTab === 'analytics' ? 'active' : ''} 
          onClick={() => setActiveTab('analytics')}
        >
          📈 Analytics
        </button>
      </div>

      {message && <div className="admin-message">{message}</div>}

      {activeTab === 'overview' && (
        <div className="admin-section">
          <h2>System Overview</h2>
          <div className="overview-cards">
            <div className="overview-card">
              <div className="card-icon">👥</div>
              <div className="card-content">
                <h3>Total Users</h3>
                <p className="card-value">{analytics?.totalUsers || 0}</p>
              </div>
            </div>
            <div className="overview-card">
              <div className="card-icon">🍽️</div>
              <div className="card-content">
                <h3>Total Meals</h3>
                <p className="card-value">{analytics?.totalMeals || 0}</p>
              </div>
            </div>
            <div className="overview-card">
              <div className="card-icon">📅</div>
              <div className="card-content">
                <h3>Today's Meals</h3>
                <p className="card-value">{analytics?.todayMeals || 0}</p>
              </div>
            </div>
            <div className="overview-card">
              <div className="card-icon">🔗</div>
              <div className="card-content">
                <h3>Shared Access</h3>
                <p className="card-value">{analytics?.sharedAccess || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="admin-section">
          <h2>User Management</h2>
          
          <div className="search-bar">
            <input
              type="text"
              placeholder="🔍 Search users by username or display name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button 
                className="clear-search"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>

          {(() => {
            const filteredUsers = users.filter(u => 
              u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
              u.display_name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            
            return (
              <>
                {searchQuery && (
                  <p className="search-results-count">
                    Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
                  </p>
                )}
                
                <div className="users-list">
                  {filteredUsers.length === 0 ? (
                    <div className="no-results">
                      <p>No users found matching "{searchQuery}"</p>
                    </div>
                  ) : (
                    filteredUsers.map(u => (
              <div key={u.id} className="user-card">
                <div className="user-info">
                  <h3>{u.display_name || u.username}</h3>
                  <p>@{u.username}</p>
                  <p className="user-meta">
                    Created: {new Date(u.created_at).toLocaleDateString()}
                  </p>
                  {u.isAdmin && <span className="admin-badge">👑 Admin</span>}
                </div>
                <div className="user-actions">
                  <button 
                    onClick={() => setSelectedUser(u)}
                    className="btn-secondary"
                  >
                    🔑 Reset Password
                  </button>
                  <button 
                    onClick={() => handleViewSecurityAnswers(u.id)}
                    className="btn-secondary"
                  >
                    🔒 View Security
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(u.id, u.username)}
                    className="btn-danger"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
                    ))
                  )}
                </div>
              </>
            );
          })()}

          {selectedUser && (
            <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>Reset Password for {selectedUser.username}</h3>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <div className="modal-actions">
                  <button onClick={handleResetPassword} className="btn-primary">
                    Reset Password
                  </button>
                  <button onClick={() => setSelectedUser(null)} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="admin-section">
          <h2>System Logs</h2>
          
          <div className="log-filters">
            <button 
              className={`filter-btn ${logFilter === 'all' ? 'active' : ''}`}
              onClick={() => setLogFilter('all')}
            >
              All Logs
            </button>
            <button 
              className={`filter-btn ${logFilter === 'security' ? 'active' : ''}`}
              onClick={() => setLogFilter('security')}
            >
              🔒 Security
            </button>
            <button 
              className={`filter-btn ${logFilter === 'info' ? 'active' : ''}`}
              onClick={() => setLogFilter('info')}
            >
              ℹ️ Info
            </button>
            <button 
              className={`filter-btn ${logFilter === 'warning' ? 'active' : ''}`}
              onClick={() => setLogFilter('warning')}
            >
              ⚠️ Warning
            </button>
            <button 
              className={`filter-btn ${logFilter === 'error' ? 'active' : ''}`}
              onClick={() => setLogFilter('error')}
            >
              ❌ Error
            </button>
          </div>

          <div className="logs-container">
            {(() => {
              const filteredLogs = logFilter === 'all' 
                ? logs 
                : logs.filter(log => log.level === logFilter);

              if (filteredLogs.length === 0) {
                return <p className="no-logs">No {logFilter === 'all' ? '' : logFilter} logs found</p>;
              }

              return filteredLogs.map((log, idx) => (
                <div key={idx} className={`log-entry log-${log.level}`}>
                  <div className="log-header">
                    <span className="log-time">
                      {new Date(log.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </span>
                    <span className={`log-level level-${log.level}`}>
                      {log.level === 'security' && '🔒'}
                      {log.level === 'info' && 'ℹ️'}
                      {log.level === 'warning' && '⚠️'}
                      {log.level === 'error' && '❌'}
                      {' '}{log.level.toUpperCase()}
                    </span>
                  </div>
                  <div className="log-body">
                    <div className="log-action">
                      <strong>{log.action.replace(/_/g, ' ').toUpperCase()}</strong>
                    </div>
                    <div className="log-details">
                      <span className="log-user">User: @{log.username} (ID: {log.userId})</span>
                      {log.details && (
                        <div className="log-extra">
                          {log.details.reason && <span>Reason: {log.details.reason}</span>}
                          {log.details.displayName && <span>Display Name: {log.details.displayName}</span>}
                          {log.details.grantedTo && <span>Granted to: @{log.details.grantedTo}</span>}
                          {log.details.revokedFrom && <span>Revoked from: @{log.details.revokedFrom}</span>}
                          {log.details.adminUser && <span>Admin: @{log.details.adminUser}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && analytics && (
        <div className="admin-section">
          <h2>Analytics & Statistics</h2>
          <div className="analytics-grid">
            <div className="analytics-card">
              <h3>User Activity</h3>
              <ul>
                <li>Active today: {analytics.activeToday || 0}</li>
                <li>Active this week: {analytics.activeWeek || 0}</li>
                <li>Total registrations: {analytics.totalUsers || 0}</li>
              </ul>
            </div>
            <div className="analytics-card">
              <h3>Meal Statistics</h3>
              <ul>
                <li>Total meals logged: {analytics.totalMeals || 0}</li>
                <li>Meals today: {analytics.todayMeals || 0}</li>
                <li>Meals this week: {analytics.weekMeals || 0}</li>
                <li>Average per user: {analytics.avgMealsPerUser?.toFixed(1) || 0}</li>
              </ul>
            </div>
            <div className="analytics-card">
              <h3>Popular Meal Times</h3>
              <ul>
                <li>Breakfast: {analytics.breakfastCount || 0}</li>
                <li>Lunch: {analytics.lunchCount || 0}</li>
                <li>Dinner: {analytics.dinnerCount || 0}</li>
              </ul>
            </div>
            <div className="analytics-card">
              <h3>Drink Statistics</h3>
              <ul>
                <li>Water: {analytics.waterCount || 0}</li>
                <li>Coffee: {analytics.coffeeCount || 0}</li>
                <li>Juice: {analytics.juiceCount || 0}</li>
                <li>Other: {analytics.otherDrinksCount || 0}</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
