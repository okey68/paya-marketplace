import React from 'react';
import { Container, Box, Typography } from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  Store as StoreIcon,
  LocalShipping as ShippingIcon,
} from '@mui/icons-material';

const FeaturesSection: React.FC = () => {
  return (
    <Box sx={{ py: 10, bgcolor: '#fff' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography 
            variant="overline" 
            sx={{ 
              color: 'primary.main', 
              fontWeight: 700, 
              fontSize: '0.9rem',
              letterSpacing: '0.1em',
            }}
          >
            OUR PLATFORM
          </Typography>
          <Typography variant="h3" fontWeight={800} gutterBottom sx={{ mt: 1, fontSize: { xs: '2rem', md: '2.75rem' } }}>
            Why Choose Paya?
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto', fontWeight: 400 }}>
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
          {/* Buy Now, Pay Later Card */}
          <Box 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              transition: 'all 0.3s ease',
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <CreditCardIcon sx={{ fontSize: 36, color: '#3b82f6' }} />
            </Box>
            <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 2, color: '#1e293b' }}>
              Buy Now, Pay Later
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.75, fontSize: '0.95rem' }}>
              Get your products today and pay over 30 days with our flexible BNPL solution.
            </Typography>
          </Box>

          {/* Support Local Business Card */}
          <Box 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              transition: 'all 0.3s ease',
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <StoreIcon sx={{ fontSize: 36, color: '#ef4444' }} />
            </Box>
            <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 2, color: '#1e293b' }}>
              Support Local Business
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.75, fontSize: '0.95rem' }}>
              Shop from verified Kenyan merchants and support the local economy.
            </Typography>
          </Box>

          {/* Fast Delivery Card */}
          <Box 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              transition: 'all 0.3s ease',
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: '#f0fdf4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <ShippingIcon sx={{ fontSize: 36, color: '#22c55e' }} />
            </Box>
            <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 2, color: '#1e293b' }}>
              Fast Delivery
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.75, fontSize: '0.95rem' }}>
              Quick and reliable delivery across Kenya from our network of merchants.
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default FeaturesSection;
