import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={{
      background: '#2d3748',
      color: 'white',
      padding: '3rem 0 2rem',
      marginTop: 'auto'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          {/* Company Info */}
          <div>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              marginBottom: '1rem',
              color: '#e2e8f0'
            }}>
              Paya Marketplace
            </h3>
            <p style={{ 
              color: '#a0aec0', 
              lineHeight: '1.6',
              marginBottom: '1rem'
            }}>
              Kenya's premier marketplace connecting businesses with customers through innovative BNPL solutions.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <a href="#" style={{ color: '#a0aec0', fontSize: '1.25rem' }}>📧</a>
              <a href="#" style={{ color: '#a0aec0', fontSize: '1.25rem' }}>📱</a>
              <a href="#" style={{ color: '#a0aec0', fontSize: '1.25rem' }}>🐦</a>
            </div>
          </div>

          {/* For Customers */}
          <div>
            <h4 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              marginBottom: '1rem',
              color: '#e2e8f0'
            }}>
              For Customers
            </h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link to="/marketplace" style={{ color: '#a0aec0', textDecoration: 'none' }}>
                  Browse Products
                </Link>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{ color: '#a0aec0', textDecoration: 'none' }}>
                  How BNPL Works
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{ color: '#a0aec0', textDecoration: 'none' }}>
                  Customer Support
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{ color: '#a0aec0', textDecoration: 'none' }}>
                  Track Your Order
                </a>
              </li>
            </ul>
          </div>

          {/* For Merchants */}
          <div>
            <h4 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              marginBottom: '1rem',
              color: '#e2e8f0'
            }}>
              For Merchants
            </h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link to="/merchant-onboarding" style={{ color: '#a0aec0', textDecoration: 'none' }}>
                  Become a Seller
                </Link>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{ color: '#a0aec0', textDecoration: 'none' }}>
                  Seller Resources
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{ color: '#a0aec0', textDecoration: 'none' }}>
                  Fee Structure
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{ color: '#a0aec0', textDecoration: 'none' }}>
                  Merchant Support
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              marginBottom: '1rem',
              color: '#e2e8f0'
            }}>
              Company
            </h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{ color: '#a0aec0', textDecoration: 'none' }}>
                  About Us
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{ color: '#a0aec0', textDecoration: 'none' }}>
                  Careers
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{ color: '#a0aec0', textDecoration: 'none' }}>
                  Privacy Policy
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{ color: '#a0aec0', textDecoration: 'none' }}>
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid #4a5568',
          paddingTop: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ color: '#a0aec0', fontSize: '0.875rem' }}>
            © 2024 Paya Marketplace. All rights reserved.
          </div>
          <div style={{ color: '#a0aec0', fontSize: '0.875rem' }}>
            Made with ❤️ in Kenya
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
