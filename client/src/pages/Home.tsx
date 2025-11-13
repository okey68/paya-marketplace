import React, { useEffect } from 'react';
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
