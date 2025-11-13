import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Box, Typography, Button, Card } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Store as StoreIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

const MerchantSection: React.FC = () => {
  return (
    <Box sx={{ py: 10, bgcolor: '#f8f9fa' }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 8,
            alignItems: 'center',
          }}
        >
          <Card
            elevation={0}
            sx={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              p: 5,
              textAlign: 'center',
              borderRadius: 4,
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(240, 147, 251, 0.3)',
            }}
          >
            {/* Decorative elements */}
            <Box
              sx={{
                position: 'absolute',
                top: -40,
                left: -40,
                width: 180,
                height: 180,
                borderRadius: '50%',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: -50,
                right: -50,
                width: 200,
                height: 200,
                borderRadius: '50%',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              }}
            />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: '24px',
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                  backdropFilter: 'blur(10px)',
                }}
              >
                <TrendingUpIcon sx={{ fontSize: 70 }} />
              </Box>
              <Typography variant="h4" fontWeight={800} gutterBottom>
                Start Selling Today
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.95, lineHeight: 1.7, fontSize: '1.1rem' }}>
                Simple onboarding process. Upload your business documents and start selling within 24 hours with our streamlined verification.
              </Typography>
            </Box>
          </Card>

          <Box>
            <Typography 
              variant="overline" 
              sx={{ 
                color: 'primary.main', 
                fontWeight: 700, 
                fontSize: '0.9rem',
                letterSpacing: '0.1em',
              }}
            >
              FOR MERCHANTS
            </Typography>
            <Typography variant="h3" fontWeight={800} gutterBottom sx={{ mt: 1 }}>
              Grow Your Business
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4, fontWeight: 400, lineHeight: 1.6 }}>
              Join thousands of Kenyan merchants who are growing their sales with our marketplace platform. Get paid instantly with our 99% advance rate on every sale.
            </Typography>
            <Box sx={{ mb: 4 }}>
              {[
                { text: '99% advance rate on all sales', icon: <TrendingUpIcon /> },
                { text: 'Easy product management dashboard', icon: <StoreIcon /> },
                { text: 'Reach more customers nationwide', icon: <ShippingIcon /> },
                { text: 'No upfront costs or hidden fees', icon: <CheckIcon /> },
              ].map((feature, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 2,
                    p: 2,
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'white',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: 'primary.light',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                      flexShrink: 0,
                    }}
                  >
                    <CheckIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                  </Box>
                  <Typography variant="body1" fontWeight={500}>{feature.text}</Typography>
                </Box>
              ))}
            </Box>
            <Button
              component={Link}
              to="/merchant-onboarding"
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                boxShadow: '0 4px 14px rgba(240, 147, 251, 0.4)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(240, 147, 251, 0.5)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Become a Merchant
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default MerchantSection;
