// frontend/src/components/Auth/Navbar.js
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    navigate('/login');
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const closeUserMenu = () => {
    setShowUserMenu(false);
  };

  // Don't show navbar on login page
  if (location.pathname === '/login') {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/dashboard" className="brand-link">
            <i className="fas fa-eye"></i>
            <span>Jarvis Vision</span>
          </Link>
        </div>

        <div className="navbar-nav">
          <Link 
            to="/dashboard" 
            className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
          >
            <i className="fas fa-tachometer-alt"></i>
            <span>Dashboard</span>
          </Link>
          
          <Link 
            to="/analytics" 
            className={`nav-link ${location.pathname === '/analytics' ? 'active' : ''}`}
          >
            <i className="fas fa-chart-line"></i>
            <span>Analytics</span>
          </Link>
          
          <Link 
            to="/cameras" 
            className={`nav-link ${location.pathname === '/cameras' ? 'active' : ''}`}
          >
            <i className="fas fa-video"></i>
            <span>Cameras</span>
          </Link>
          
          <Link 
            to="/pipelines" 
            className={`nav-link ${location.pathname === '/pipelines' ? 'active' : ''}`}
          >
            <i className="fas fa-project-diagram"></i>
            <span>Pipelines</span>
          </Link>
          
          <Link 
            to="/events" 
            className={`nav-link ${location.pathname === '/events' ? 'active' : ''}`}
          >
            <i className="fas fa-bell"></i>
            <span>Events</span>
          </Link>
          
          <Link 
            to="/identities" 
            className={`nav-link ${location.pathname === '/identities' ? 'active' : ''}`}
          >
            <i className="fas fa-users"></i>
            <span>Identities</span>
          </Link>
          
          {user?.role === 'admin' && (
            <Link 
              to="/admin" 
              className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
            >
              <i className="fas fa-cog"></i>
              <span>Admin</span>
            </Link>
          )}
        </div>

        <div className="navbar-user">
          <div className="user-menu" onClick={toggleUserMenu}>
            <div className="user-avatar">
              <i className="fas fa-user"></i>
            </div>
            <div className="user-info">
              <span className="username">{user?.username}</span>
              <span className="user-role">{user?.role}</span>
            </div>
            <i className={`fas fa-chevron-down dropdown-icon ${showUserMenu ? 'rotated' : ''}`}></i>
          </div>

          {showUserMenu && (
            <>
              <div className="menu-overlay" onClick={closeUserMenu}></div>
              <div className="user-dropdown">
                <Link 
                  to="/profile" 
                  className="dropdown-item"
                  onClick={closeUserMenu}
                >
                  <i className="fas fa-user-circle"></i>
                  <span>Profile</span>
                </Link>
                <div className="dropdown-divider"></div>
                <button 
                  onClick={handleLogout} 
                  className="dropdown-item logout-item"
                >
                  <i className="fas fa-sign-out-alt"></i>
                  <span>Logout</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
