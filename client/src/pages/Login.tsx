import React, { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
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
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  LockOutlined as LockIcon,
  Store as StoreIcon,
  ArrowForward,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
              <LockIcon sx={{ color: 'white', fontSize: 32 }} />
            </Box>
            <Typography 
              variant="h4" 
              fontWeight={700} 
              color="text.primary" 
              gutterBottom
              sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}
            >
              Welcome Back
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sign in to your Paya account
            </Typography>
          </Box>

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              autoFocus
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#667FEA',
                  },
                },
              }}
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              sx={{ 
                mb: 2,
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
                      aria-label="toggle password visibility"
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ textAlign: 'right', mb: 2 }}>
              <Link
                component={RouterLink}
                to="/forgot-password"
                variant="body2"
                underline="hover"
                sx={{ 
                  color: '#667FEA',
                  fontWeight: 500,
                  '&:hover': {
                    color: '#5568D3',
                  },
                }}
              >
                Forgot password?
              </Link>
            </Box>

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
                  background: 'linear-gradient(135deg, #5568D3 0%, #667FEA 100%)',
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
                'Sign In'
              )}
            </Button>
          </Box>

          {/* Divider */}
          <Divider sx={{ my: 3 }} />

          {/* Sign Up Link */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Don't have an account?
            </Typography>
            <Button
              component={RouterLink}
              to="/register"
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
              Create Account
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

export default Login;
