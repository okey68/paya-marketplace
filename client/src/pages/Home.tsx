import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Box, Typography, Button, Paper } from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  Store as StoreIcon,
  LocalShipping as ShippingIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Box sx={{ mt: '-64px' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          pt: '144px',
          pb: 10,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" fontWeight={700} gutterBottom sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>
            Shop Now, Pay Later with Paya
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9, fontSize: { xs: '1rem', md: '1.25rem' } }}>
            Discover amazing products from Kenyan businesses and pay with our flexible BNPL solution. Get what you need
            today, pay over time.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              component={Link}
              to="/marketplace"
              variant="contained"
              size="large"
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'grey.100',
                },
              }}
            >
              Start Shopping
            </Button>
            {!user && (
              <Button
                component={Link}
                to="/register"
                variant="outlined"
                size="large"
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Sign Up Free
              </Button>
            )}
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 8, bgcolor: 'white' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" fontWeight={700} gutterBottom>
              Why Choose Paya?
            </Typography>
            <Typography variant="h6" color="text.secondary">
              We make shopping easy and affordable for everyone in Kenya
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 4,
            }}
          >
            <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: 1, borderColor: 'divider' }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'primary.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <CreditCardIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Buy Now, Pay Later
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Get your products today and pay over 30 days with our flexible BNPL solution.
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: 1, borderColor: 'divider' }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'success.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <StoreIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Support Local Business
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Shop from verified Kenyan merchants and support the local economy.
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: 1, borderColor: 'divider' }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'warning.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <ShippingIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Fast Delivery
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Quick and reliable delivery across Kenya from our network of merchants.
              </Typography>
            </Paper>
          </Box>
        </Container>
      </Box>

      {/* For Customers Section */}
      <Box sx={{ py: 8, bgcolor: 'white' }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 6,
              alignItems: 'center',
            }}
          >
            <Paper
              elevation={0}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                p: 5,
                textAlign: 'center',
                borderRadius: 3,
              }}
            >
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <CreditCardIcon sx={{ fontSize: 60 }} />
              </Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Shop Through Your HR
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Apply for BNPL at checkout and get approved instantly. Payments are automatically deducted from your payroll.
              </Typography>
            </Paper>

            <Box>
              <Typography variant="h3" fontWeight={700} gutterBottom>
                How It Works
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                Shop now and pay later through your employer's HR system. Get the products you need today with flexible monthly payments.
              </Typography>
              <Box sx={{ mb: 3 }}>
                {[
                  'Apply for BNPL at checkout',
                  'Get products shipped fast',
                  'Payments deducted from payroll monthly',
                  'Lower interest rates',
                  'Secure checkout process',
                ].map((feature, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <CheckIcon sx={{ color: 'success.main', mr: 1.5 }} />
                    <Typography variant="body1">{feature}</Typography>
                  </Box>
                ))}
              </Box>
              <Button
                component={Link}
                to="/marketplace"
                variant="contained"
                color="primary"
                size="large"
                endIcon={<ArrowForwardIcon />}
              >
                Start Shopping
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* For Merchants Section */}
      <Box sx={{ py: 8, bgcolor: 'grey.50' }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 6,
              alignItems: 'center',
            }}
          >
            <Box>
              <Typography variant="h3" fontWeight={700} gutterBottom>
                Grow Your Business with Paya
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                Join thousands of Kenyan merchants who are growing their sales with our marketplace platform. Get paid
                instantly with our 99% advance rate on every sale.
              </Typography>
              <Box sx={{ mb: 3 }}>
                {[
                  '99% advance rate on all sales',
                  'Easy product management',
                  'Reach more customers',
                  'No upfront costs',
                ].map((feature, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <CheckIcon sx={{ color: 'success.main', mr: 1.5 }} />
                    <Typography variant="body1">{feature}</Typography>
                  </Box>
                ))}
              </Box>
              <Button
                component={Link}
                to="/merchant-onboarding"
                variant="contained"
                color="primary"
                size="large"
                endIcon={<ArrowForwardIcon />}
              >
                Become a Merchant
              </Button>
            </Box>

            <Paper
              elevation={0}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                p: 5,
                textAlign: 'center',
                borderRadius: 3,
              }}
            >
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <TrendingUpIcon sx={{ fontSize: 60 }} />
              </Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Start Selling Today
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Simple onboarding process. Upload your business documents and start selling within 24 hours.
              </Typography>
            </Paper>
          </Box>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)',
          color: 'white',
          py: 6,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Ready to Start Shopping?
          </Typography>
          <Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
            Join thousands of satisfied customers shopping with Paya
          </Typography>
          <Button
            component={Link}
            to="/marketplace"
            variant="contained"
            color="primary"
            size="large"
            endIcon={<ArrowForwardIcon />}
          >
            Browse Products
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
