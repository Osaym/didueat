import React, { useState, useEffect } from 'react';
import History from './History';
import './SharedView.css';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5001/api'
  : `http://${window.location.hostname}:5001/api`;

function SharedView({ token }) {
  const [sharedUsers, setSharedUsers] = useState([]);
  const [grantedUsers, setGrantedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [shareUsername, setShareUsername] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSharedUsers();
    fetchGrantedUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSharedUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/shared-with-me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setSharedUsers(data);
    } catch (err) {
      console.error('Error fetching shared users:', err);
    }
  };

  const fetchGrantedUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/shared-by-me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setGrantedUsers(data);
    } catch (err) {
      console.error('Error fetching granted users:', err);
    }
  };

  const handleGrantAccess = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/share-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ viewerUsername: shareUsername })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to grant access');
      }

      setMessage('✅ Access granted successfully!');
      setShareUsername('');
      fetchGrantedUsers(); // Refresh the list
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = async (username) => {
    if (!window.confirm(`Are you sure you want to revoke access for @${username}?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/share-access/${username}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to revoke access');
      }

      setMessage('✅ Access revoked successfully!');
      fetchGrantedUsers(); // Refresh the list
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Error: ' + err.message);
    }
  };

  if (selectedUser) {
    return (
      <div>
        <button 
          className="back-btn" 
          onClick={() => setSelectedUser(null)}
        >
          ← Back to Shared Users
        </button>
        <History 
          token={token} 
          viewingUserId={selectedUser.id} 
          displayName={selectedUser.display_name}
        />
      </div>
    );
  }

  return (
    <div className="shared-view">
      <div className="share-section">
        <h2>Grant Access to Your Dashboard</h2>
        <p className="info-text">Allow someone to view your meal history</p>
        
        {message && <div className={`message ${message.includes('✅') ? 'success' : 'error'} fade-in`}>{message}</div>}
        
        <form onSubmit={handleGrantAccess} className="share-form">
          <input
            type="text"
            placeholder="Enter their username"
            value={shareUsername}
            onChange={(e) => setShareUsername(e.target.value)}
            required
            disabled={loading}
          />
          <button type="submit" className="grant-btn" disabled={loading}>
            {loading ? '⏳ Granting...' : '✨ Grant Access'}
          </button>
        </form>
      </div>

      <div className="shared-users-section">
        <h2>📋 Access Log - People You've Shared With</h2>
        {grantedUsers.length === 0 ? (
          <p className="no-data">You haven't granted access to anyone yet.</p>
        ) : (
          <div className="granted-users-list">
            {grantedUsers.map(user => (
              <div key={user.id} className="granted-user-card slide-in">
                <div className="user-avatar">
                  {user.profile_picture ? (
                    user.profile_picture.startsWith('data:') || user.profile_picture.startsWith('http') ? (
                      <img src={user.profile_picture} alt={user.display_name} className="profile-img" />
                    ) : (
                      <div className="profile-emoji">{user.profile_picture}</div>
                    )
                  ) : (
                    '👤'
                  )}
                </div>
                <span className="granted-date">
                  Granted: {new Date(user.granted_at).toLocaleDateString()}
                </span>
                <div className="user-info">
                  <h3>{user.display_name}</h3>
                  <p>@{user.username}</p>
                </div>
                <button 
                  className="revoke-btn"
                  onClick={() => handleRevokeAccess(user.username)}
                >
                  🚫 Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="shared-users-section">
        <h2>👥 People Who Shared with You</h2>
        {sharedUsers.length === 0 ? (
          <p className="no-data">No one has shared their dashboard with you yet.</p>
        ) : (
          <div className="shared-users-list">
            {sharedUsers.map(user => (
              <div 
                key={user.id} 
                className="shared-user-card slide-in"
              >
                <div className="user-avatar">
                  {user.profile_picture ? (
                    user.profile_picture.startsWith('data:') || user.profile_picture.startsWith('http') ? (
                      <img src={user.profile_picture} alt={user.display_name} className="profile-img" />
                    ) : (
                      <div className="profile-emoji">{user.profile_picture}</div>
                    )
                  ) : (
                    '👤'
                  )}
                </div>
                {user.granted_at && (
                  <span className="granted-date">
                    Shared: {new Date(user.granted_at).toLocaleDateString()}
                  </span>
                )}
                <div className="user-info">
                  <h3>{user.display_name}</h3>
                  <p>@{user.username}</p>
                </div>
                <button 
                  className="view-btn"
                  onClick={() => setSelectedUser(user)}
                >
                  👁️ View Dashboard
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SharedView;
