import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Box, Typography, Button, Card } from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  CheckCircle as CheckIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

const CustomerSection: React.FC = () => {
  return (
    <Box sx={{ py: 10, bgcolor: '#f8eeeeee' }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 8,
            alignItems: 'center',
          }}
        >
          <Box sx={{ order: { xs: 2, md: 1 } }}>
            <Typography 
              variant="overline" 
              sx={{ 
                color: 'primary.main', 
                fontWeight: 700, 
                fontSize: '0.9rem',
                letterSpacing: '0.1em',
              }}
            >
              FOR CUSTOMERS
            </Typography>
            <Typography variant="h3" fontWeight={800} gutterBottom sx={{ mt: 1 }}>
              How It Works
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4, fontWeight: 400, lineHeight: 1.6 }}>
              Shop now and pay later through your employer's HR system. Get the products you need today with flexible monthly payments directly from your payroll.
            </Typography>
            <Box sx={{ mb: 4 }}>
              {[
                { text: 'Apply for BNPL at checkout with instant approval', icon: <CheckIcon /> },
                { text: 'Get products shipped fast to your doorstep', icon: <CheckIcon /> },
                { text: 'Payments automatically deducted from payroll', icon: <CheckIcon /> },
                { text: 'Lower interest rates for salaried employees', icon: <CheckIcon /> },
                { text: 'Secure and transparent checkout process', icon: <CheckIcon /> },
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
                      bgcolor: 'grey.50',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                    //   bgcolor: 'success.light',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                      flexShrink: 0,
                    }}
                  >
                    <CheckIcon sx={{ color: 'success.light', fontSize: 24 }} />
                  </Box>
                  <Typography variant="body1" fontWeight={500}>{feature.text}</Typography>
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
              sx={{
                px: 4,
                bgcolor: '#4f46e5',
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: 2,
                boxShadow: '0 4px 14px rgba(102, 126, 234, 0.4)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Start Shopping Now
            </Button>
          </Box>

          <Card
            elevation={0}
            sx={{
              order: { xs: 1, md: 2 },
              background: 'linear-gradient(135deg, #667eea 0%, #4f46e5 100%)',
              color: 'white',
              p: 5,
              textAlign: 'center',
              borderRadius: 4,
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(102, 126, 234, 0.3)',
            }}
          >
            {/* Decorative circles */}
            <Box
              sx={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                borderRadius: '50%',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: -30,
                left: -30,
                width: 150,
                height: 150,
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
                <CreditCardIcon sx={{ fontSize: 70 }} />
              </Box>
              <Typography variant="h4" fontWeight={800} gutterBottom>
                Shop Through Your HR
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.95, lineHeight: 1.7, fontSize: '1.1rem' }}>
                Seamlessly integrated with your employer's payroll system for hassle-free monthly deductions and competitive rates.
              </Typography>
            </Box>
          </Card>
        </Box>
      </Container>
    </Box>
  );
};

export default CustomerSection;
