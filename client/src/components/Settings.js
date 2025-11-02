import React, { useState, useEffect } from 'react';
import './Settings.css';

// Use relative URL since frontend and backend are served from same server
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5001/api'
  : '/api';

function Settings({ token, user, onUserUpdate }) {
  const [profile, setProfile] = useState(null); // eslint-disable-line no-unused-vars
  const [darkMode, setDarkMode] = useState(user?.darkMode || false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [profileColor, setProfileColor] = useState(user?.profileColor || '#667eea');
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || '');
  const [securityQuestions, setSecurityQuestions] = useState([
    { question: '', answer: '' },
    { question: '', answer: '' },
    { question: '', answer: '' }
  ]);
  const [hasSecurityQuestions, setHasSecurityQuestions] = useState(false);
  const [showSecurityReset, setShowSecurityReset] = useState(false);
  const [securityAnswers, setSecurityAnswers] = useState({});
  const [existingQuestions, setExistingQuestions] = useState([]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const questionOptions = [
    "What is your favorite color?",
    "What is your mother's maiden name?",
    "What is your father's name?",
    "What was your first pet's name?",
    "What city were you born in?",
    "What is your favorite food?",
    "What was the name of your first school?",
    "What is your phone number?",
    "What is your birthday? (MM/DD/YYYY)"
  ];

  useEffect(() => {
    // Initialize from user prop if available
    if (user) {
      const isDark = user.darkMode === true;
      setDarkMode(isDark);
      setDisplayName(user.displayName || '');
      setProfileColor(user.profileColor || '#667eea');
      setProfilePicture(user.profilePicture || '');
    }
    // Only fetch if user data is missing
    if (!user || !user.profileColor) {
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Watch for changes in user prop (e.g., on login)
  useEffect(() => {
    if (user) {
      const isDark = user.darkMode === true;
      setDarkMode(isDark);
      setDisplayName(user.displayName || '');
      setProfileColor(user.profileColor || '#667eea');
      setProfilePicture(user.profilePicture || '');
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setProfile(data);
      const isDark = data.dark_mode === true;
      setDarkMode(isDark);
      setDisplayName(data.display_name || '');
      setProfileColor(data.profile_color || '#667eea');
      setProfilePicture(data.profile_picture || '');
      setHasSecurityQuestions(data.hasSecurityQuestions || false);
      
      // If has security questions, fetch them for reset
      if (data.hasSecurityQuestions) {
        fetchSecurityQuestions();
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const fetchSecurityQuestions = async () => {
    try {
      const response = await fetch(`${API_URL}/user/security-questions/${user.username}`);
      const data = await response.json();
      if (data.questions) {
        setExistingQuestions(data.questions);
      }
    } catch (err) {
      console.error('Error fetching security questions:', err);
    }
  };

  const handleDarkModeToggle = async () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    
    try {
      const response = await fetch(`${API_URL}/user/dark-mode`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ darkMode: newMode })
      });

      if (!response.ok) throw new Error('Failed to update dark mode');

      // Update local storage and trigger re-render
      const updatedUser = { ...user, darkMode: newMode };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      onUserUpdate(updatedUser);
      
      setMessage('✅ Dark mode updated!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error updating dark mode:', err);
      setDarkMode(!newMode);
      setMessage('❌ Failed to update dark mode');
    }
  };

  const handleDisplayNameSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!displayName || displayName.trim().length === 0) {
      setMessage('❌ Display name cannot be empty');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/user/display-name`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ displayName: displayName.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update display name');
      }

      const updatedUser = { ...user, displayName: displayName.trim() };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      onUserUpdate(updatedUser);

      setMessage('✅ Display name updated!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error updating display name:', err);
      setMessage('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileColorSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/user/profile-color`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ profileColor })
      });

      if (!response.ok) throw new Error('Failed to update profile color');

      const updatedUser = { ...user, profileColor };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      onUserUpdate(updatedUser);

      setMessage('✅ Profile color updated!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error updating profile color:', err);
      setMessage('❌ Failed to update profile color');
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/user/profile-picture`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ profilePicture })
      });

      if (!response.ok) throw new Error('Failed to update profile picture');

      const updatedUser = { ...user, profilePicture };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      onUserUpdate(updatedUser);

      setMessage('✅ Profile picture updated!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error updating profile picture:', err);
      setMessage('❌ Failed to update profile picture');
    } finally {
      setLoading(false);
    }
  };

  const handleClearProfilePicture = async () => {
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/user/profile-picture`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ profilePicture: '' })
      });

      if (!response.ok) throw new Error('Failed to clear profile picture');

      setProfilePicture('');
      const updatedUser = { ...user, profilePicture: '' };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      onUserUpdate(updatedUser);

      setMessage('✅ Profile picture cleared!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error clearing profile picture:', err);
      setMessage('❌ Failed to clear profile picture');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage('❌ All password fields are required');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('❌ New passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setMessage('❌ Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/user/change-password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setMessage('✅ Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error changing password:', err);
      setMessage('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndResetSecurity = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First verify the answers
      const response = await fetch(`${API_URL}/user/verify-security-answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answers: securityAnswers })
      });

      const data = await response.json();

      if (!response.ok || !data.verified) {
        throw new Error('Incorrect answers to security questions');
      }

      // If verified, show the form to set new questions
      setShowSecurityReset(true);
      setMessage('✅ Verified! Now set your new security questions.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error verifying security answers:', err);
      setMessage('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSecurityQuestionsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate all fields filled
    const validQuestions = securityQuestions.filter(q => q.question && q.answer);
    
    if (validQuestions.length < 2) {
      setMessage('❌ Please fill out at least 2 security questions');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/user/security-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ questions: validQuestions })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set security questions');
      }

      setMessage('✅ Security questions saved!');
      setHasSecurityQuestions(true);
      setShowSecurityReset(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error setting security questions:', err);
      setMessage('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...securityQuestions];
    updated[index][field] = value;
    setSecurityQuestions(updated);
  };

  const handleAnswerChange = (questionId, answer) => {
    setSecurityAnswers({
      ...securityAnswers,
      [questionId]: answer
    });
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      '⚠️ WARNING: This will permanently delete your account, all your meals, shared access, and cannot be undone.\n\nType your username to confirm deletion.'
    );
    
    if (!confirmDelete) return;

    const usernameConfirm = window.prompt('Please type your username to confirm deletion:');
    
    if (usernameConfirm !== user.username) {
      setMessage('❌ Username does not match. Account deletion cancelled.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/user/delete-account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      // Clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
    } catch (err) {
      console.error('Error deleting account:', err);
      setMessage('❌ ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="settings">
      <h2>⚙️ Settings</h2>

      {message && <div className={`message ${message.includes('✅') ? 'success' : 'error'} fade-in`}>{message}</div>}

      <div className="settings-section">
        <h3>👤 Display Name</h3>
        <p className="info-text-small">Change your display name (shown to others you share with)</p>
        <form onSubmit={handleDisplayNameSubmit} className="name-form">
          <input
            type="text"
            placeholder="Enter your display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="save-btn" disabled={loading}>
            {loading ? '⏳ Saving...' : '💾 Update Name'}
          </button>
        </form>
      </div>

      <div className="settings-section">
        <h3>🌙 Dark Mode</h3>
        <div className="dark-mode-toggle">
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={darkMode} 
              onChange={handleDarkModeToggle}
            />
            <span className="slider"></span>
          </label>
          <span className="toggle-label">{darkMode ? 'Dark Mode Enabled' : 'Dark Mode Disabled'}</span>
        </div>
        <p className="info-text-small">Your preference will be saved and applied across all devices</p>
      </div>

      <div className="settings-section">
        <h3>🎨 Profile Picture & Color</h3>
        <p className="info-text-small">Choose a color background or set an emoji/image</p>
        <div className="profile-color-section">
          <div className="current-picture">
            {profilePicture ? (
              profilePicture.startsWith('data:') || profilePicture.startsWith('http') ? (
                <img src={profilePicture} alt="Profile" className="profile-img-large" />
              ) : (
                <div className="profile-emoji-large" style={{ background: profileColor }}>
                  {profilePicture}
                </div>
              )
            ) : (
              <div className="profile-placeholder-large" style={{ background: profileColor }}>
                {user?.displayName?.charAt(0).toUpperCase() || '👤'}
              </div>
            )}
          </div>
          <div className="profile-forms">
            <form onSubmit={handleProfileColorSubmit} className="profile-form">
              <label className="form-label">Background Color:</label>
              <div className="color-picker-group">
                <input
                  type="color"
                  value={profileColor}
                  onChange={(e) => setProfileColor(e.target.value)}
                  className="color-picker"
                />
              <input
                type="text"
                placeholder="#667eea"
                value={profileColor}
                onChange={(e) => setProfileColor(e.target.value)}
                className="color-input"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
              </div>
              <button type="submit" className="save-btn" disabled={loading}>
                {loading ? '⏳ Saving...' : '🎨 Save Color'}
              </button>
            </form>

            <form onSubmit={handleProfilePictureSubmit} className="profile-form">
              <label className="form-label">Or use Emoji/Image URL:</label>
              <input
                type="text"
                placeholder="Enter emoji (😊) or image URL"
                value={profilePicture}
                onChange={(e) => setProfilePicture(e.target.value)}
                disabled={loading}
              />
              <button type="submit" className="save-btn" disabled={loading}>
                {loading ? '⏳ Saving...' : '🖼️ Save Picture'}
              </button>
              {profilePicture && (
                <button 
                  type="button" 
                  onClick={handleClearProfilePicture}
                  className="clear-btn"
                  disabled={loading}
                >
                  ❌ Clear Picture
                </button>
              )}
            </form>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>🔑 Change Password</h3>
        <p className="info-text-small">Update your account password</p>
        <form onSubmit={handleChangePassword} className="password-form">
          <input
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={loading}
          />
          <input
            type="password"
            placeholder="New Password (min 6 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="save-btn" disabled={loading}>
            {loading ? '⏳ Changing...' : '🔑 Change Password'}
          </button>
        </form>
      </div>

      <div className="settings-section">
        <h3>🔐 Security Questions</h3>
        
        {!hasSecurityQuestions ? (
          <>
            <p className="info-text-small">
              Set up security questions to reset your password if you forget it.
            </p>
            <form onSubmit={handleSecurityQuestionsSubmit} className="security-form">
              {securityQuestions.map((sq, index) => (
                <div key={index} className="security-question-group">
                  <label>Question {index + 1}:</label>
                  <select
                    value={sq.question}
                    onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                  >
                    <option value="">Select a question...</option>
                    {questionOptions.map(q => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Your answer (case-insensitive)"
                    value={sq.answer}
                    onChange={(e) => handleQuestionChange(index, 'answer', e.target.value)}
                  />
                </div>
              ))}
              <button type="submit" className="save-btn" disabled={loading}>
                {loading ? '⏳ Saving...' : '🔒 Save Security Questions'}
              </button>
            </form>
          </>
        ) : !showSecurityReset ? (
          <>
            <p className="info-text-success">✅ Already configured!</p>
            <p className="info-text-small">
              To reset your security questions, answer your existing questions below:
            </p>
            <form onSubmit={handleVerifyAndResetSecurity} className="security-form">
              {existingQuestions.map((q) => (
                <div key={q.id} className="security-question-group">
                  <label>{q.question}</label>
                  <input
                    type="text"
                    placeholder="Your answer"
                    value={securityAnswers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    disabled={loading}
                  />
                </div>
              ))}
              <button type="submit" className="save-btn" disabled={loading}>
                {loading ? '⏳ Verifying...' : '🔓 Verify & Reset'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="info-text-success">✅ Verified! Set your new security questions:</p>
            <form onSubmit={handleSecurityQuestionsSubmit} className="security-form">
              {securityQuestions.map((sq, index) => (
                <div key={index} className="security-question-group">
                  <label>Question {index + 1}:</label>
                  <select
                    value={sq.question}
                    onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                  >
                    <option value="">Select a question...</option>
                    {questionOptions.map(q => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Your answer (case-insensitive)"
                    value={sq.answer}
                    onChange={(e) => handleQuestionChange(index, 'answer', e.target.value)}
                  />
                </div>
              ))}
              <button type="submit" className="save-btn" disabled={loading}>
                {loading ? '⏳ Saving...' : '🔒 Save New Questions'}
              </button>
            </form>
          </>
        )}
      </div>

      <div className="settings-section danger-zone">
        <h3>🚨 Danger Zone</h3>
        <p className="danger-warning">
          Deleting your account is permanent and cannot be undone. All your meals, shared access, and data will be lost forever.
        </p>
        <button 
          type="button" 
          className="delete-account-btn" 
          onClick={handleDeleteAccount}
          disabled={loading}
        >
          🗑️ Delete My Account
        </button>
      </div>
    </div>
  );
}

export default Settings;
