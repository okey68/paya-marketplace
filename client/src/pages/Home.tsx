import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import {
  HeroSection,
  FeaturesSection,
  CustomerSection,
  MerchantSection,
  CTASection,
} from '../components/sections';

const Home = () => {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Check if there's a hash in the URL or state for scrolling
    const scrollTo = (location.state as { scrollTo?: string })?.scrollTo || location.hash.replace('#', '');
    
    if (scrollTo) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const element = document.getElementById(scrollTo);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  return (
    <Box sx={{ mt: '-64px' }}>
      <HeroSection user={user} />
      <FeaturesSection />
      <CustomerSection />
      <MerchantSection />
      <CTASection />
    </Box>
  );
};

export default Home;
