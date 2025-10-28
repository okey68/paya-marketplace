import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
  const [userType, setUserType] = useState('customer');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Customer fields
    dateOfBirth: '',
    kraPin: '',
    phoneNumber: '',
    // Merchant fields
    businessName: '',
    businessEmail: '',
    businessType: ''
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const userData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      role: userType,
      phoneNumber: formData.phoneNumber
    };

    if (userType === 'customer') {
      userData.dateOfBirth = formData.dateOfBirth;
      userData.kraPin = formData.kraPin;
    } else if (userType === 'merchant') {
      userData.businessName = formData.businessName;
      userData.businessEmail = formData.businessEmail;
      userData.businessType = formData.businessType;
    }

    const result = await register(userData);
    
    if (result.success) {
      toast.success('Account created successfully!');
      if (userType === 'merchant') {
        navigate('/merchant-onboarding');
      } else {
        navigate('/marketplace');
      }
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
        maxWidth: '500px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#2d3748', marginBottom: '0.5rem' }}>
            Create Your Account
          </h1>
          <p style={{ color: '#718096' }}>
            Join Paya Marketplace today
          </p>
        </div>

        {/* User Type Selection */}
        <div style={{ marginBottom: '2rem' }}>
          <label className="form-label">I want to:</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => setUserType('customer')}
              style={{
                padding: '1rem',
                border: `2px solid ${userType === 'customer' ? '#667eea' : '#e2e8f0'}`,
                borderRadius: '8px',
                background: userType === 'customer' ? '#f0f4ff' : 'white',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛒</div>
              <div style={{ fontWeight: '600', color: '#2d3748' }}>Shop Products</div>
              <div style={{ fontSize: '0.875rem', color: '#718096' }}>Buy with BNPL</div>
            </button>
            
            <button
              type="button"
              onClick={() => setUserType('merchant')}
              style={{
                padding: '1rem',
                border: `2px solid ${userType === 'merchant' ? '#667eea' : '#e2e8f0'}`,
                borderRadius: '8px',
                background: userType === 'merchant' ? '#f0f4ff' : 'white',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏪</div>
              <div style={{ fontWeight: '600', color: '#2d3748' }}>Sell Products</div>
              <div style={{ fontSize: '0.875rem', color: '#718096' }}>Start a business</div>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="firstName">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                className="form-input"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="lastName">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                className="form-input"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

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
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phoneNumber">
              Phone Number
            </label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              className="form-input"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="+254..."
            />
          </div>

          {/* Customer-specific fields */}
          {userType === 'customer' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="dateOfBirth">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    className="form-input"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="kraPin">
                    KRA PIN
                  </label>
                  <input
                    type="text"
                    id="kraPin"
                    name="kraPin"
                    className="form-input"
                    value={formData.kraPin}
                    onChange={handleChange}
                    required
                    placeholder="A123456789Z"
                  />
                </div>
              </div>
            </>
          )}

          {/* Merchant-specific fields */}
          {userType === 'merchant' && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="businessName">
                  Business Name
                </label>
                <input
                  type="text"
                  id="businessName"
                  name="businessName"
                  className="form-input"
                  value={formData.businessName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="businessEmail">
                  Business Email
                </label>
                <input
                  type="email"
                  id="businessEmail"
                  name="businessEmail"
                  className="form-input"
                  value={formData.businessEmail}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="businessType">
                  Business Type
                </label>
                <select
                  id="businessType"
                  name="businessType"
                  className="form-input form-select"
                  value={formData.businessType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select business type</option>
                  <option value="retail">Retail</option>
                  <option value="wholesale">Wholesale</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="services">Services</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </>
          )}

          {/* Password fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                minLength="6"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="form-input"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength="6"
              />
            </div>
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
              `Create ${userType === 'customer' ? 'Customer' : 'Merchant'} Account`
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
            Already have an account?
          </p>
          <Link to="/login" className="btn btn-outline" style={{ width: '100%' }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
