import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import MealEntry from './components/MealEntry';
import History from './components/History';
import SharedView from './components/SharedView';
import Settings from './components/Settings';
import Admin from './components/Admin';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      // Apply dark mode if user has it enabled, otherwise light mode
      if (parsedUser.darkMode) {
        document.documentElement.classList.add('dark-mode');
        document.body.classList.add('dark-mode');
        document.documentElement.classList.remove('light-mode');
        document.body.classList.remove('light-mode');
      } else {
        document.documentElement.classList.add('light-mode');
        document.body.classList.add('light-mode');
        document.documentElement.classList.remove('dark-mode');
        document.body.classList.remove('dark-mode');
      }
    }
    // Scroll to top on initial load
    window.scrollTo(0, 0);
  }, []);

  // Scroll to top when view changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      const dropdown = document.querySelector('.logout-dropdown');
      const trigger = document.querySelector('.user-dropdown-trigger');
      
      if (dropdown && trigger && 
          !dropdown.contains(event.target) && 
          !trigger.contains(event.target)) {
        dropdown.classList.remove('show');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogin = (token, user) => {
    setToken(token);
    setUser(user);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    // Apply dark mode if user has it enabled, otherwise light mode
    if (user.darkMode) {
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
      document.documentElement.classList.remove('light-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.documentElement.classList.add('light-mode');
      document.body.classList.add('light-mode');
      document.documentElement.classList.remove('dark-mode');
      document.body.classList.remove('dark-mode');
    }
    // Scroll to top on login
    window.scrollTo(0, 0);
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    // Toggle dark mode class
    if (updatedUser.darkMode) {
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
      document.documentElement.classList.remove('light-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.documentElement.classList.add('light-mode');
      document.body.classList.add('light-mode');
      document.documentElement.classList.remove('dark-mode');
      document.body.classList.remove('dark-mode');
    }
  };

  const handleNavTouchStart = (e) => {
    const touch = e.touches[0];
    setTouchStartX(touch.clientX);
    setTouchStartY(touch.clientY);
  };

  const handleNavTouchMove = (e) => {
    if (touchStartX === null || touchStartY === null) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartX);
    const deltaY = Math.abs(touch.clientY - touchStartY);
    
    // Only prevent default and activate sliding if horizontal movement is greater than vertical
    if (deltaX > deltaY && deltaX > 10) {
      e.preventDefault();
      
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      
      if (element && element.tagName === 'BUTTON' && element.dataset.view) {
        const view = element.dataset.view;
        if (view !== currentView) {
          setCurrentView(view);
        }
      }
    }
  };

  const handleNavTouchEnd = () => {
    setTouchStartX(null);
    setTouchStartY(null);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentView('dashboard');
    // Remove light mode, restore dark for login page
    document.documentElement.classList.remove('dark-mode');
    document.body.classList.remove('dark-mode');
    document.documentElement.classList.remove('light-mode');
    document.body.classList.remove('light-mode');
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>🍽️ didueat?</h1>
        <div className="user-info">
          <button 
            className="user-dropdown-trigger" 
            onClick={() => {
              const dropdown = document.querySelector('.logout-dropdown');
              dropdown.classList.toggle('show');
            }}
          >
            Welcome, {user?.displayName}!
            <svg className="dropdown-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="logout-dropdown">
            <button onClick={() => {
              setCurrentView('settings');
              document.querySelector('.logout-dropdown').classList.remove('show');
            }} className="settings-btn">
              <svg className="settings-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Settings
            </button>
            <button onClick={handleLogout} className="logout-btn">
              <svg className="logout-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Logout
            </button>
          </div>
        </div>
        
        <nav className="nav-tabs" onTouchStart={handleNavTouchStart} onTouchMove={handleNavTouchMove} onTouchEnd={handleNavTouchEnd}>
          <button 
            className={currentView === 'dashboard' ? 'active' : ''} 
            onClick={() => setCurrentView('dashboard')}
            data-view="dashboard"
          >
            Dashboard
          </button>
          <button 
            className={currentView === 'history' ? 'active' : ''} 
            onClick={() => setCurrentView('history')}
            data-view="history"
          >
            History
          </button>
          <button 
            className={currentView === 'shared' ? 'active' : ''} 
            onClick={() => setCurrentView('shared')}
            data-view="shared"
          >
            Sharing
          </button>
          {user?.isAdmin && (
            <button 
              className={`admin-btn ${currentView === 'admin' ? 'active' : ''}`}
              onClick={() => setCurrentView('admin')}
              title="Admin"
              data-view="admin"
            >
              🛡️
            </button>
          )}
        </nav>
      </header>

      <main className="main-content">
        {currentView === 'dashboard' && (
          <>
            <Dashboard token={token} />
            <MealEntry token={token} />
          </>
        )}
        {currentView === 'history' && <History token={token} userId={user?.id} />}
        {currentView === 'shared' && <SharedView token={token} />}
        {currentView === 'settings' && <Settings token={token} user={user} onUserUpdate={handleUserUpdate} />}
        {currentView === 'admin' && <Admin token={token} user={user} />}
      </main>
      
      <footer className="app-footer">
        <p>© 2025 Osaym Omar</p>
      </footer>
    </div>
  );
}

export default App;
