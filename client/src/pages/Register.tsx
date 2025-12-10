import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  Divider,
  CircularProgress,
  InputAdornment,
  IconButton,
  Alert,
} from '@mui/material';
import {
  PersonAddOutlined as PersonAddIcon,
  Store as StoreIcon,
  Visibility,
  VisibilityOff,
  ArrowForward,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    kraPin: '',
    phoneNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    const userData: any = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      role: 'customer',
      phoneNumber: formData.phoneNumber,
      dateOfBirth: formData.dateOfBirth,
      kraPin: formData.kraPin,
    };

    const result = await register(userData);

    if (result.success) {
      toast.success('Account created successfully!');
      navigate('/marketplace');
    } else {
      toast.error(result.error);
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: 'calc(100vh - 160px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: { xs: 3, sm: 4 },
            width: '100%',
            borderRadius: 3,
            background: 'linear-gradient(to bottom, rgba(102, 127, 234, 0.02), rgba(255, 255, 255, 1))',
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667FEA 0%, #667FEA 100%)',
                mb: 2,
                boxShadow: '0 8px 16px rgba(102, 127, 234, 0.3)',
              }}
            >
              <PersonAddIcon sx={{ color: 'white', fontSize: 32 }} />
            </Box>
            <Typography 
              variant="h4" 
              fontWeight={700} 
              color="text.primary" 
              gutterBottom
              sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}
            >
              Create Your Account
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Join Paya Marketplace and start shopping with BNPL
            </Typography>
          </Box>

          {/* Registration Form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            {/* Name Fields */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#667FEA',
                    },
                  },
                }}
              />
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#667FEA',
                    },
                  },
                }}
              />
            </Box>

            {/* Email */}
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#667FEA',
                  },
                },
              }}
            />

            {/* Phone Number */}
            <TextField
              fullWidth
              label="Phone Number"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="+254..."
              required
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#667FEA',
                  },
                },
              }}
            />

            {/* Customer-specific fields */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#667FEA',
                    },
                  },
                }}
              />
              <TextField
                fullWidth
                label="KRA PIN"
                name="kraPin"
                value={formData.kraPin}
                onChange={handleChange}
                required
                placeholder="A123456789Z"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#667FEA',
                    },
                  },
                }}
              />
            </Box>

            {/* Password fields */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#667FEA',
                    },
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Confirm Password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#667FEA',
                    },
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        size="small"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ 
                mb: 2,
                py: 1.5,
                background: 'linear-gradient(135deg, #667FEA 0%, #667FEA 100%)',
                boxShadow: '0 4px 12px rgba(102, 127, 234, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #667FEA 0%, #667FEA 100%)',
                  boxShadow: '0 6px 16px rgba(102, 127, 234, 0.5)',
                },
                '&:disabled': {
                  background: 'rgba(0, 0, 0, 0.12)',
                },
                fontWeight: 600,
                fontSize: '1rem',
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Create Account'
              )}
            </Button>

            {/* Terms */}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mb: 2 }}>
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </Typography>
          </Box>

          {/* Divider */}
          <Divider sx={{ my: 3 }} />

          {/* Sign In Link */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Already have an account?
            </Typography>
            <Button
              component={RouterLink}
              to="/login"
              variant="outlined"
              fullWidth
              sx={{ 
                borderColor: '#667FEA', 
                color: '#667FEA',
                '&:hover': {
                  borderColor: '#5568D3',
                  backgroundColor: 'rgba(102, 127, 234, 0.04)',
                },
                fontWeight: 600,
              }}
            >
              Sign In
            </Button>
          </Box>

          {/* Merchant CTA */}
          <Box
            sx={{
              mt: 3,
              p: 3,
              borderRadius: 2,
              background: 'linear-gradient(135deg, rgba(102, 127, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
              border: '1px solid rgba(102, 127, 234, 0.2)',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 20px rgba(102, 127, 234, 0.2)',
                background: 'linear-gradient(135deg, rgba(102, 127, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
              },
            }}
            onClick={() => window.open('https://paya-marketplace-merchant.netlify.app/', '_blank')}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
              <StoreIcon sx={{ fontSize: 28, color: '#667FEA', mr: 1 }} />
              <Typography variant="h6" fontWeight={700} color="#667FEA">
                Want to Sell Items?
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Become a merchant and start selling on Paya Marketplace
            </Typography>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                color: '#667FEA',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              Join as a Merchant
              <ArrowForward sx={{ ml: 1, fontSize: 18 }} />
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
