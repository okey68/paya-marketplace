import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ user, onLogout }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/merchants', label: 'Merchants', icon: '🏪' },
    { path: '/orders', label: 'Orders', icon: '📦' },
    { path: '/products', label: 'Products', icon: '🛍️' },
    { path: '/users', label: 'Users', icon: '👥' }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Paya Admin</h2>
        <p style={{ fontSize: '0.875rem', color: '#a0aec0', marginTop: '0.5rem' }}>
          Welcome, {user?.firstName || 'Admin'}
        </p>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span style={{ marginRight: '0.75rem' }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
        
        <button
          onClick={onLogout}
          className="nav-item"
          style={{ marginTop: '2rem', borderTop: '1px solid #4a5568', paddingTop: '1rem' }}
        >
          <span style={{ marginRight: '0.75rem' }}>🚪</span>
          Logout
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
