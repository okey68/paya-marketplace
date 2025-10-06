import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const { user, login, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: 'white',
        padding: '3rem 2.5rem',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '480px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '800', 
            color: '#1a202c', 
            marginBottom: '0.75rem',
            letterSpacing: '-0.025em'
          }}>
            Paya Merchant
          </h1>
          <p style={{ 
            color: '#a0aec0',
            fontSize: '1.05rem'
          }}>
            Sign in to manage your store
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block',
              marginBottom: '0.5rem',
              color: '#4a5568',
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
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block',
              marginBottom: '0.5rem',
              color: '#4a5568',
              fontSize: '0.95rem',
              fontWeight: '600'
            }} htmlFor="password">
              Password
            </label>
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
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{ 
              width: '100%',
              padding: '0.875rem',
              marginTop: '0.5rem',
              fontSize: '1.05rem',
              fontWeight: '600',
              color: 'white',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '8px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
              transition: 'opacity 0.2s'
            }}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ 
          marginTop: '2rem', 
          padding: '1.25rem', 
          background: '#f7fafc', 
          borderRadius: '8px',
          fontSize: '0.9rem',
          color: '#718096',
          lineHeight: '1.6'
        }}>
          <strong style={{ color: '#4a5568' }}>Demo Credentials:</strong><br />
          Email: merchant@paya.com<br />
          Password: merchant123
        </div>
      </div>
    </div>
  );
};

export default Login;
