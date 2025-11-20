import React, { useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
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
  ToggleButton,
  ToggleButtonGroup,
  MenuItem,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  PersonAddOutlined as PersonAddIcon,
  ShoppingCart as ShoppingCartIcon,
  Store as StoreIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');
  const initialUserType = (roleParam === 'merchant' || roleParam === 'customer') ? roleParam : 'customer';
  const [userType, setUserType] = useState<'customer' | 'merchant'>(initialUserType);
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
    businessType: '',
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

  const handleUserTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newType: 'customer' | 'merchant' | null
  ) => {
    if (newType !== null) {
      setUserType(newType);
    }
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
      role: userType,
      phoneNumber: formData.phoneNumber,
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
            p: 4,
            width: '100%',
            borderRadius: 2,
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: 'primary.light',
                mb: 2,
              }}
            >
              <PersonAddIcon sx={{ color: 'primary.main', fontSize: 28 }} />
            </Box>
            <Typography variant="h4" fontWeight={700} color="text.primary" gutterBottom>
              Create Your Account
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Join Paya Marketplace today
            </Typography>
          </Box>

          {/* User Type Selection */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
              I want to:
            </Typography>
            <ToggleButtonGroup
              value={userType}
              exclusive
              onChange={handleUserTypeChange}
              fullWidth
              sx={{ mb: 3 }}
            >
              <ToggleButton value="customer" sx={{ py: 2 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <ShoppingCartIcon sx={{ fontSize: 32, mb: 1 }} />
                  <Typography variant="body2" fontWeight={600}>
                    Shop Products
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Buy with BNPL
                  </Typography>
                </Box>
              </ToggleButton>
              <ToggleButton value="merchant" sx={{ py: 2 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <StoreIcon sx={{ fontSize: 32, mb: 1 }} />
                  <Typography variant="body2" fontWeight={600}>
                    Sell Products
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Start a business
                  </Typography>
                </Box>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Registration Form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            {/* Basic Information */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </Box>

            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              sx={{ mt: 2 }}
            />

            <TextField
              fullWidth
              label="Phone Number"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="+254..."
              sx={{ mt: 2 }}
            />

            {/* Customer-specific fields */}
            {userType === 'customer' && (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mt: 2 }}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  label="KRA PIN"
                  name="kraPin"
                  value={formData.kraPin}
                  onChange={handleChange}
                  required
                  placeholder="A123456789Z"
                />
              </Box>
            )}

            {/* Merchant-specific fields */}
            {userType === 'merchant' && (
              <>
                <TextField
                  fullWidth
                  label="Business Name"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  required
                  sx={{ mt: 2 }}
                />

                <TextField
                  fullWidth
                  label="Business Email"
                  name="businessEmail"
                  type="email"
                  value={formData.businessEmail}
                  onChange={handleChange}
                  required
                  sx={{ mt: 2 }}
                />

                <TextField
                  fullWidth
                  select
                  label="Business Type"
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  required
                  sx={{ mt: 2 }}
                >
                  <MenuItem value="">Select business type</MenuItem>
                  <MenuItem value="retail">Retail</MenuItem>
                  <MenuItem value="wholesale">Wholesale</MenuItem>
                  <MenuItem value="manufacturing">Manufacturing</MenuItem>
                  <MenuItem value="services">Services</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
              </>
            )}

            {/* Password fields */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mt: 2 }}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
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
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                `Create ${userType === 'customer' ? 'Customer' : 'Merchant'} Account`
              )}
            </Button>
          </Box>

          {/* Divider */}
          <Divider sx={{ my: 3 }} />

          {/* Sign In Link */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Already have an account?
            </Typography>
            <Button
              component={RouterLink}
              to="/login"
              variant="outlined"
              fullWidth
            >
              Sign In
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
