import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { getItemCount } = useCart();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const cartItemCount = getItemCount();

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: 'white',
      borderBottom: '1px solid #e2e8f0',
      zIndex: 1000,
      padding: '1rem 0'
    }}>
      <div className="container">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Logo */}
          <Link 
            to="/" 
            style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#667eea',
              textDecoration: 'none'
            }}
          >
            Paya Marketplace
          </Link>

          {/* Desktop Navigation */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2rem'
          }} className="hidden-mobile">
            <Link to="/marketplace" style={{ textDecoration: 'none', color: '#4a5568' }}>
              Shop
            </Link>

            <Link 
              to="/cart" 
              style={{ 
                textDecoration: 'none', 
                color: '#4a5568',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              🛒 Cart
              {cartItemCount > 0 && (
                <span style={{
                  background: '#f56565',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  {cartItemCount}
                </span>
              )}
            </Link>

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ color: '#718096', fontSize: '0.875rem' }}>
                  Hello, {user.firstName}
                </span>
                <button 
                  onClick={handleLogout}
                  className="btn btn-outline btn-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Link to="/login" className="btn btn-outline btn-sm">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer'
            }}
            className="mobile-only"
          >
            ☰
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            borderBottom: '1px solid #e2e8f0',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }} className="mobile-only">
            <Link 
              to="/marketplace" 
              onClick={() => setIsMenuOpen(false)}
              style={{ textDecoration: 'none', color: '#4a5568', padding: '0.5rem 0' }}
            >
              Shop
            </Link>
            
            {user?.role === 'merchant' && (
              <Link 
                to="/merchant" 
                onClick={() => setIsMenuOpen(false)}
                style={{ textDecoration: 'none', color: '#4a5568', padding: '0.5rem 0' }}
              >
                Dashboard
              </Link>
            )}

            <Link 
              to="/cart" 
              onClick={() => setIsMenuOpen(false)}
              style={{ 
                textDecoration: 'none', 
                color: '#4a5568',
                padding: '0.5rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              🛒 Cart {cartItemCount > 0 && `(${cartItemCount})`}
            </Link>

            {user ? (
              <div style={{ padding: '0.5rem 0' }}>
                <div style={{ marginBottom: '1rem', color: '#718096' }}>
                  Hello, {user.firstName}
                </div>
                <button 
                  onClick={handleLogout}
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%' }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Link 
                  to="/login" 
                  onClick={() => setIsMenuOpen(false)}
                  className="btn btn-outline btn-sm"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  onClick={() => setIsMenuOpen(false)}
                  className="btn btn-primary btn-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .hidden-mobile {
            display: none !important;
          }
          .mobile-only {
            display: block !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-only {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
