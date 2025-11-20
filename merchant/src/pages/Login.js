import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const { user, login, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Redirect if already logged in
  if (user && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        toast.success('Welcome back!');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row'
    }}>
      {/* Left Side - Background Image with Overlay */}
      <div style={{
        flex: '1',
        position: 'relative',
        backgroundImage: 'url(https://plus.unsplash.com/premium_photo-1683141052679-942eb9e77760?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8c2hvcHBpbmd8ZW58MHx8MHx8fDA%3D)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: isMobile ? 'none' : 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '4rem',
        minHeight: isMobile ? '0' : '100vh'
      }}>
        {/* Gradient Overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          // background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.85) 100%)',
          zIndex: 1
        }}></div>
        
        {/* Content on top of overlay */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          color: 'white',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <img 
            src="/paya-logo.svg" 
            alt="Paya" 
            style={{ 
              height: '60px', 
              width: 'auto',
              marginBottom: '2rem',
              filter: 'brightness(0) invert(1)'
            }}
          />
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            marginBottom: '1.5rem',
            lineHeight: '1.2'
          }}>
            Welcome to Paya Marketplace
          </h1>
          <p style={{
            fontSize: '1.2rem',
            lineHeight: '1.8',
            opacity: '0.95'
          }}>
            Manage your online store, track orders, and grow your business with our comprehensive merchant platform.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div style={{
        flex: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isMobile ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#ffffff',
        padding: isMobile ? '2rem 1rem' : '2rem',
        minHeight: '100vh'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '480px',
          padding: isMobile ? '1.5rem' : '2rem',
          background: isMobile ? 'white' : 'transparent',
          borderRadius: isMobile ? '12px' : '0',
          boxShadow: isMobile ? '0 10px 25px rgba(0, 0, 0, 0.2)' : 'none'
        }}>
          {isMobile && (
            <div style={{ 
              textAlign: 'center', 
              marginBottom: '2rem' 
            }}>
              <img 
                src="/paya-logo.svg" 
                alt="Paya" 
                style={{ 
                  height: '50px', 
                  width: 'auto',
                  marginBottom: '1rem'
                }}
              />
            </div>
          )}
          
          <div style={{ marginBottom: isMobile ? '2rem' : '3rem' }}>
            <h2 style={{
              fontSize: isMobile ? '1.75rem' : '2rem',
              fontWeight: '700',
              color: '#1a202c',
              marginBottom: '0.5rem'
            }}>
              Sign In
            </h2>
            <p style={{ 
              color: '#718096',
              fontSize: isMobile ? '0.95rem' : '1rem'
            }}>
              Enter your credentials to access your dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '0.5rem',
                color: '#2d3748',
                fontSize: '0.95rem',
                fontWeight: '600'
              }} htmlFor="email">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="merchant@paya.com"
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  fontSize: '1rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box',
                  backgroundColor: '#f7fafc'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.backgroundColor = '#ffffff';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.backgroundColor = '#f7fafc';
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <label style={{ 
                  color: '#2d3748',
                  fontSize: '0.95rem',
                  fontWeight: '600'
                }} htmlFor="password">
                  Password
                </label>
                <button type="button" style={{
                  fontSize: '0.875rem',
                  color: '#667eea',
                  textDecoration: 'none',
                  fontWeight: '500',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0
                }}>
                  Forgot?
                </button>
              </div>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  fontSize: '1rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box',
                  backgroundColor: '#f7fafc'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.backgroundColor = '#ffffff';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.backgroundColor = '#f7fafc';
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{ 
                width: '100%',
                padding: '1rem',
                marginTop: '0.5rem',
                fontSize: '1.05rem',
                fontWeight: '600',
                color: 'white',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '8px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                transition: 'all 0.3s',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
              }}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ 
            marginTop: '2rem', 
            textAlign: 'center',
            fontSize: '0.95rem',
            color: '#718096'
          }}>
            Don't have a merchant shop yet?{' '}
            <Link 
              to="/register" 
              style={{ 
                color: '#667eea', 
                fontWeight: '600',
                textDecoration: 'none'
              }}
            >
              Create Account
            </Link>
          </div>

          {/* <div style={{ 
            marginTop: isMobile ? '2rem' : '2.5rem', 
            padding: isMobile ? '1rem' : '1.25rem', 
            background: '#f7fafc', 
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            color: '#718096',
            lineHeight: '1.6'
          }}>
            <strong style={{ color: '#4a5568' }}>Demo Credentials:</strong><br />
            Email: merchant@paya.com<br />
            Password: merchant123
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Login;
