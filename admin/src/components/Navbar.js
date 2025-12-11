import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/merchants', label: 'Merchants' },
    { path: '/orders', label: 'Orders' },
    { path: '/hr-verifications', label: 'HR Verify' },
    { path: '/products', label: 'Products' },
    { path: '/users', label: 'Users' },
    { path: '/model', label: 'Model' },
    { path: '/support', label: 'Support' }
  ];

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-brand">
          <Link to="/" className="brand-link">
            <img 
              src="/paya-logo.svg" 
              alt="Paya" 
              className="brand-logo"
            />
          </Link>
        </div>
        
        <div className="navbar-nav">
          {navItems.map((item) => {
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        
        <div className="navbar-actions">
          <button onClick={onLogout} className="btn btn-outline logout-btn">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
