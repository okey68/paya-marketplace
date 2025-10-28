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
          <Link to="/dashboard" className="brand-link">
            <img 
              src="/paya-logo.svg" 
              alt="Paya" 
              className="brand-logo"
            />
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
            <Link to="/support" className={`nav-link ${isActive('/support')}`}>
              Support
            </Link>
            {/* Show Account link only if onboarding is complete, otherwise show Onboarding */}
            {user.businessInfo?.businessName && user.businessInfo?.companyNumber && user.businessInfo?.directors?.length > 0 ? (
              <Link to="/account" className={`nav-link ${isActive('/account')}`}>
                Account
              </Link>
            ) : (
              <Link to="/onboarding" className={`nav-link ${isActive('/onboarding')}`}>
                Complete Setup
              </Link>
            )}
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
