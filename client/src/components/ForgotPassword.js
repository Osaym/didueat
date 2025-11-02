import React, { useState } from 'react';
import './ForgotPassword.css';

// Use relative URL since frontend and backend are served from same server
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5001/api'
  : '/api';

function ForgotPassword({ onBack }) {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/user/security-questions/${username}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch security questions');
      }

      setQuestions(data.questions);
      setStep(2);
    } catch (err) {
      setMessage('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSecurityAnswersSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    if (newPassword !== confirmPassword) {
      setMessage('❌ Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setMessage('❌ Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/user/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          answers,
          newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setMessage('✅ Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (err) {
      setMessage('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-box">
        <h1>🔑 Forgot Password</h1>

        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'} fade-in`}>
            {message}
          </div>
        )}

        {step === 1 && (
          <>
            <h2>Enter Your Username</h2>
            <form onSubmit={handleUsernameSubmit}>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? '⏳ Loading...' : 'Continue'}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h2>Answer Security Questions</h2>
            <p className="info-text">Answer the questions you set up to verify your identity</p>
            <form onSubmit={handleSecurityAnswersSubmit}>
              {questions.map((q) => (
                <div key={q.id} className="question-group">
                  <label>{q.question}</label>
                  <input
                    type="text"
                    placeholder="Your answer"
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
              ))}

              <div className="question-group">
                <label>New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength="6"
                  disabled={loading}
                />
              </div>

              <div className="question-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength="6"
                  disabled={loading}
                />
              </div>

              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? '⏳ Resetting...' : '🔓 Reset Password'}
              </button>
            </form>
          </>
        )}

        <button className="back-link" onClick={onBack} disabled={loading}>
          ← Back to Login
        </button>
      </div>
    </div>
  );
}

export default ForgotPassword;
