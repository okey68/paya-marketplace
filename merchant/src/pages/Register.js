import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Register = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneCountryCode: '+254',
    phoneNumber: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const dropdownRef = useRef(null);
  const TEST_OTP = '98765';

  const countryCodes = [
    { code: '+254', flag: '🇰🇪', name: 'Kenya' },
    { code: '+1', flag: '🇺🇸', name: 'USA' },
    { code: '+27', flag: '🇿🇦', name: 'South Africa' },
    { code: '+255', flag: '🇹🇿', name: 'Tanzania' },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCountryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    // Validate phone number length based on country code
    const phoneValidation = {
      '+254': { length: 9, name: 'Kenya' },
      '+1': { length: 10, name: 'USA' },
      '+27': { length: 9, name: 'South Africa' },
      '+255': { length: 9, name: 'Tanzania' },
    };

    const validation = phoneValidation[formData.phoneCountryCode];
    if (validation && formData.phoneNumber.replace(/\D/g, '').length !== validation.length) {
      toast.error(`Phone number for ${validation.name} must be exactly ${validation.length} digits`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate sending OTP to email
      toast.success(`Verification code sent to ${formData.email}`);
      setShowOtpStep(true);
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to send verification code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();

    if (otp.length !== 5) {
      toast.error('Please enter a 5-digit verification code');
      return;
    }

    if (otp !== TEST_OTP) {
      toast.error('Invalid verification code. Please try again.');
      return;
    }

    setVerifyingOtp(true);

    try {
      const response = await api.post('/auth/register', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phoneCountryCode: formData.phoneCountryCode,
        phoneNumber: formData.phoneNumber,
        role: 'merchant'
      });

      toast.success('Email verified! Account created successfully!');
      
      // Store the token with the correct key
      localStorage.setItem('merchantToken', response.data.token);
      
      // Update user context
      if (response.data.user) {
        updateUser(response.data.user);
      }
      
      // Redirect to onboarding
      setTimeout(() => {
        navigate('/onboarding');
      }, 1000);
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendOtp = () => {
    setOtp('');
    toast.success(`New verification code sent to ${formData.email}`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem 1rem'
    }}>
      <div style={{
        background: 'white',
        padding: '3rem 2.5rem',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '520px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginBottom: '1.5rem' 
          }}>
            <img 
              src="/paya-logo.svg" 
              alt="Paya" 
              style={{ 
                height: '50px', 
                width: 'auto' 
              }}
            />
          </div>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: '#1a202c',
            marginBottom: '0.5rem'
          }}>
            {showOtpStep ? 'Verify Your Email' : 'Create Merchant Account'}
          </h2>
          <p style={{ 
            color: '#a0aec0',
            fontSize: '1rem'
          }}>
            {showOtpStep ? `Enter the code sent to ${formData.email}` : 'Start selling on Paya Marketplace'}
          </p>
        </div>

        {!showOtpStep ? (
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ 
                display: 'block',
                marginBottom: '0.5rem',
                color: '#4a5568',
                fontSize: '0.9rem',
                fontWeight: '600'
              }} htmlFor="firstName">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder="John"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '0.95rem',
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

            <div>
              <label style={{ 
                display: 'block',
                marginBottom: '0.5rem',
                color: '#4a5568',
                fontSize: '0.9rem',
                fontWeight: '600'
              }} htmlFor="lastName">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder="Doe"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '0.95rem',
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
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ 
              display: 'block',
              marginBottom: '0.5rem',
              color: '#4a5568',
              fontSize: '0.9rem',
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
              placeholder="merchant@example.com"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '0.95rem',
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

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ 
              display: 'block',
              marginBottom: '0.5rem',
              color: '#4a5568',
              fontSize: '0.9rem',
              fontWeight: '600'
            }} htmlFor="phoneNumber">
              Phone Number
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                {/* Country Code Selector */}
                <div 
                  ref={dropdownRef}
                  style={{ 
                    position: 'relative',
                    borderRight: '1px solid #e2e8f0'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1rem',
                      background: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      fontWeight: '500',
                      color: '#4a5568',
                      minWidth: '120px',
                      borderTopLeftRadius: '6px',
                      borderBottomLeftRadius: '6px'
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>
                      {countryCodes.find(c => c.code === formData.phoneCountryCode)?.flag}
                    </span>
                    <span>{formData.phoneCountryCode}</span>
                    <span style={{ 
                      marginLeft: 'auto',
                      fontSize: '0.7rem',
                      transform: showCountryDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }}>▼</span>
                  </button>

                  {/* Custom Dropdown */}
                  {showCountryDropdown && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: '0.25rem',
                      background: 'white',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      zIndex: 1000,
                      minWidth: '200px'
                    }}>
                      {countryCodes.map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, phoneCountryCode: country.code, phoneNumber: '' });
                            setShowCountryDropdown(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: formData.phoneCountryCode === country.code ? '#f7fafc' : 'white',
                            border: 'none',
                            borderBottom: '1px solid #e2e8f0',
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                            textAlign: 'left',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f7fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.background = formData.phoneCountryCode === country.code ? '#f7fafc' : 'white'}
                        >
                          <span style={{ fontSize: '1.2rem' }}>{country.flag}</span>
                          <span style={{ flex: 1 }}>{country.name}</span>
                          <span style={{ color: '#718096', fontWeight: '500' }}>{country.code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Phone Number Input */}
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                    const maxLength = 
                      formData.phoneCountryCode === '+1' ? 10 :
                      formData.phoneCountryCode === '+27' ? 9 :
                      formData.phoneCountryCode === '+255' ? 9 :
                      9; // Kenya default
                    if (value.length <= maxLength) {
                      setFormData({ ...formData, phoneNumber: value });
                    }
                  }}
                  required
                  placeholder={
                    formData.phoneCountryCode === '+1' ? '2025551234' :
                    formData.phoneCountryCode === '+27' ? '821234567' :
                    formData.phoneCountryCode === '+255' ? '712345678' :
                    '712345678'
                  }
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    fontSize: '0.95rem',
                    border: 'none',
                    outline: 'none',
                    background: 'transparent'
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ 
              display: 'block',
              marginBottom: '0.5rem',
              color: '#4a5568',
              fontSize: '0.9rem',
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
              placeholder="Minimum 6 characters"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '0.95rem',
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
              fontSize: '0.9rem',
              fontWeight: '600'
            }} htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Re-enter your password"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '0.95rem',
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
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        ) : (
        <form onSubmit={handleOtpSubmit}>
          <div style={{
            background: '#f0f9ff',
            border: '2px solid #bfdbfe',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            <p style={{ 
              margin: 0,
              color: '#1e40af',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              <strong>Test Mode:</strong> Use code <strong>98765</strong> for testing
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block',
              marginBottom: '0.5rem',
              color: '#4a5568',
              fontSize: '0.9rem',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              Enter Verification Code
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 5) {
                  setOtp(value);
                }
              }}
              placeholder="12345"
              maxLength={5}
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1.5rem',
                textAlign: 'center',
                letterSpacing: '0.5rem',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
                fontWeight: '600'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <button
              type="button"
              onClick={handleResendOtp}
              style={{
                background: 'none',
                border: 'none',
                color: '#667eea',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Didn't receive the code? Resend
            </button>
          </div>

          <button
            type="submit"
            disabled={verifyingOtp || otp.length !== 5}
            style={{ 
              width: '100%',
              padding: '0.875rem',
              fontSize: '1.05rem',
              fontWeight: '600',
              color: 'white',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '8px',
              cursor: (verifyingOtp || otp.length !== 5) ? 'not-allowed' : 'pointer',
              opacity: (verifyingOtp || otp.length !== 5) ? 0.7 : 1,
              transition: 'opacity 0.2s'
            }}
          >
            {verifyingOtp ? 'Verifying...' : 'Verify & Create Account'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setShowOtpStep(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#718096',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              ← Back to registration
            </button>
          </div>
        </form>
        )}

        {!showOtpStep && (
        <div style={{ 
          marginTop: '1.75rem', 
          textAlign: 'center',
          fontSize: '0.95rem',
          color: '#718096'
        }}>
          Already have an account?{' '}
          <Link 
            to="/login" 
            style={{ 
              color: '#667eea', 
              fontWeight: '600',
              textDecoration: 'none'
            }}
          >
            Sign In
          </Link>
        </div>
        )}
      </div>
    </div>
  );
};

export default Register;
