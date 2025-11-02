import React, { useState } from 'react';
import './Login.css';
import ForgotPassword from './ForgotPassword';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5001/api'
  : `http://${window.location.hostname}:5001/api`;

function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    displayName: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const endpoint = isRegister ? '/register' : '/login';
      const body = isRegister 
        ? formData 
        : { username: formData.username, password: formData.password };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (isRegister) {
        setIsRegister(false);
        setError('');
        alert('Registration successful! Please login.');
        setFormData({ username: '', password: '', displayName: '' });
      } else {
        onLogin(data.token, data.user);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (showForgotPassword) {
    return <ForgotPassword onBack={() => setShowForgotPassword(false)} />;
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>🍽️ didueat?</h1>
        <h2>{isRegister ? 'Create Account' : 'Login'}</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <input
              type="text"
              placeholder="Display Name"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              required
            />
          )}
          <input
            type="text"
            placeholder="Username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            autoCapitalize="none"
            autoComplete="username"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <button type="submit" className="primary-btn">
            {isRegister ? 'Register' : 'Login'}
          </button>
        </form>

        {!isRegister && (
          <button 
            className="forgot-password-link" 
            onClick={() => setShowForgotPassword(true)}
          >
            Forgot Password?
          </button>
        )}

        <p className="toggle-text">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}
          <button 
            className="link-btn" 
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
          >
            {isRegister ? 'Login' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
