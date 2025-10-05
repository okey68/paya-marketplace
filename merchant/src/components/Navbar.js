import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-brand">
          <Link to="/dashboard">
            <h2>Paya Merchant</h2>
          </Link>
        </div>

        {user && (
          <div className="navbar-nav">
            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
              Dashboard
            </Link>
            <Link to="/products" className={`nav-link ${isActive('/products')}`}>
              Products
            </Link>
            <Link to="/orders" className={`nav-link ${isActive('/orders')}`}>
              Orders
            </Link>
            <Link to="/onboarding" className={`nav-link ${isActive('/onboarding')}`}>
              Settings
            </Link>
          </div>
        )}

        <div className="navbar-actions">
          {user ? (
            <div className="user-menu">
              <span className="user-name">
                {user.businessInfo?.businessName || `${user.firstName} ${user.lastName}`}
              </span>
              <button onClick={handleLogout} className="btn btn-outline">
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
