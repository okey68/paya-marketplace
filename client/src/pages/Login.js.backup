import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      toast.success('Login successful!');
      navigate(from, { replace: true });
    } else {
      toast.error(result.error);
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 160px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 0'
    }}>
      <div style={{
        background: 'white',
        padding: '3rem',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#2d3748', marginBottom: '0.5rem' }}>
            Welcome Back
          </h1>
          <p style={{ color: '#718096' }}>
            Sign in to your Paya account
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {loading ? (
              <div className="spinner" style={{ width: '1rem', height: '1rem' }}></div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div style={{ 
          textAlign: 'center', 
          marginTop: '2rem',
          paddingTop: '2rem',
          borderTop: '1px solid #e2e8f0'
        }}>
          <p style={{ color: '#718096', marginBottom: '1rem' }}>
            Don't have an account?
          </p>
          <Link to="/register" className="btn btn-outline" style={{ width: '100%' }}>
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
