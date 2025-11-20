import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-brand">
          <Link to="/dashboard" className="brand-link" onClick={closeMobileMenu}>
            <img 
              src="/paya-logo.svg" 
              alt="Paya" 
              className="brand-logo"
            />
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        {user && (
          <button 
            className={`mobile-menu-toggle ${mobileMenuOpen ? 'open' : ''}`}
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        )}

        {user && (
          <div className={`navbar-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <Link 
              to="/dashboard" 
              className={`nav-link ${isActive('/dashboard')}`}
              onClick={closeMobileMenu}
            >
              Dashboard
            </Link>
            <Link 
              to="/products" 
              className={`nav-link ${isActive('/products')}`}
              onClick={closeMobileMenu}
            >
              Products
            </Link>
            <Link 
              to="/orders" 
              className={`nav-link ${isActive('/orders')}`}
              onClick={closeMobileMenu}
            >
              Orders
            </Link>
            <Link 
              to="/support" 
              className={`nav-link ${isActive('/support')}`}
              onClick={closeMobileMenu}
            >
              Support
            </Link>
            {/* Show Account link only if onboarding is complete, otherwise show Onboarding */}
            {user.businessInfo?.businessName && user.businessInfo?.companyNumber && user.businessInfo?.directors?.length > 0 ? (
              <Link 
                to="/account" 
                className={`nav-link ${isActive('/account')}`}
                onClick={closeMobileMenu}
              >
                Account
              </Link>
            ) : (
              <Link 
                to="/onboarding" 
                className={`nav-link ${isActive('/onboarding')}`}
                onClick={closeMobileMenu}
              >
                Complete Setup
              </Link>
            )}

            {/* Mobile User Info */}
            <div className="mobile-user-info">
              <span className="user-name">
                {user.businessInfo?.businessName || `${user.firstName} ${user.lastName}`}
              </span>
              <button onClick={handleLogout} className="btn btn-outline mobile-logout-btn">
                Logout
              </button>
            </div>
          </div>
        )}

        <div className="navbar-actions">
          {user ? (
            <div className="user-menu desktop-only">
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

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-menu-overlay" 
          onClick={closeMobileMenu}
        ></div>
      )}
    </nav>
  );
};

export default Navbar;
