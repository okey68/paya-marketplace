import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Chip,
  CircularProgress,
  InputAdornment,
  Avatar,
  Rating,
} from '@mui/material';
import {
  Search as SearchIcon,
  Store as StoreIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import api from '../utils/api';
import toast from 'react-hot-toast';

interface Merchant {
  _id: string;
  businessInfo?: {
    businessName?: string;
    businessType?: string;
    description?: string;
    logo?: string;
    location?: string;
    approvalStatus?: string;
  };
}

const Merchants = () => {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = [
    'All Categories',
    'Electronics',
    'Appliances',
    'Clothing',
    'Cosmetics',
    'Medical Care',
    'Services',
    'Other',
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    try {
      const response = await api.get('/merchants/public');
      const merchantsData = response.data.merchants || response.data || [];
      setMerchants(Array.isArray(merchantsData) ? merchantsData : []);
    } catch (error) {
      console.error('Error fetching merchants:', error);
      toast.error('Failed to load merchants');
    } finally {
      setLoading(false);
    }
  };

  const filteredMerchants = merchants.filter((merchant) => {
    const matchesSearch =
      merchant.businessInfo?.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      merchant.businessInfo?.businessType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      merchant.businessInfo?.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === '' ||
      selectedCategory === 'All Categories' ||
      merchant.businessInfo?.businessType === selectedCategory;

    return matchesSearch && matchesCategory && merchant.businessInfo?.approvalStatus === 'approved';
  });

  const getMerchantInitials = (businessName?: string) => {
    if (!businessName) return 'M';
    return businessName
      .split(' ')
      .map((word) => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getMerchantStats = () => {
    return {
      products: Math.floor(Math.random() * 50) + 5,
      rating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
      reviews: Math.floor(Math.random() * 200) + 10,
    };
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ pt: 12, pb: 8, textAlign: 'center' }}>
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Loading trusted merchants...
        </Typography>
      </Container>
    );
  }

  return (
    <Box>
      {/* Featured Merchants Logos */}
      <Container maxWidth="lg" sx={{ pt: 3, mb: 6 }}>
        <Typography variant="h5" fontWeight={700} textAlign="center" gutterBottom>
          Featured Merchants
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(6, 1fr)' },
            gap: 2,
            mt: 3,
          }}
        >
          {filteredMerchants.slice(0, 12).map((merchant) => (
            <Paper
              key={merchant._id}
              component={Link}
              to={`/merchant/${merchant._id}`}
              elevation={0}
              sx={{
                p: 2,
                border: 1,
                borderColor: 'divider',
                textAlign: 'center',
                textDecoration: 'none',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  transform: 'translateY(-2px)',
                  boxShadow: 2,
                },
              }}
            >
              {merchant.businessInfo?.logo ? (
                <Avatar
                  src={merchant.businessInfo.logo}
                  alt={merchant.businessInfo?.businessName}
                  sx={{ width: 60, height: 60, mx: 'auto', mb: 1 }}
                />
              ) : (
                <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 1, bgcolor: 'primary.main' }}>
                  {getMerchantInitials(merchant.businessInfo?.businessName)}
                </Avatar>
              )}
              <Typography variant="caption" fontWeight={600} sx={{ display: 'block' }}>
                {merchant.businessInfo?.businessName}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Container>

      {/* Merchant Directory */}
      <Container maxWidth="lg" sx={{ mb: 6 }}>
        <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>
          Merchant Directory
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
          Browse all our trusted merchant partners
        </Typography>

        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search merchants by name or business type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
        />

        {/* Category Filters */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 4, justifyContent: 'center' }}>
          {categories.map((category) => (
            <Chip
              key={category}
              label={category}
              onClick={() => setSelectedCategory(category === 'All Categories' ? '' : category)}
              color={
                selectedCategory === category || (category === 'All Categories' && selectedCategory === '')
                  ? 'primary'
                  : 'default'
              }
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Box>

        {/* Merchants Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            gap: 3,
          }}
        >
          {filteredMerchants.map((merchant) => {
            const stats = getMerchantStats();
            return (
              <Paper
                key={merchant._id}
                component={Link}
                to={`/merchant/${merchant._id}`}
                elevation={0}
                sx={{
                  p: 3,
                  border: 1,
                  borderColor: 'divider',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  {merchant.businessInfo?.logo ? (
                    <Avatar
                      src={merchant.businessInfo.logo}
                      alt={merchant.businessInfo?.businessName}
                      sx={{ width: 64, height: 64 }}
                    />
                  ) : (
                    <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '1.5rem' }}>
                      {getMerchantInitials(merchant.businessInfo?.businessName)}
                    </Avatar>
                  )}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      {merchant.businessInfo?.businessName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {merchant.businessInfo?.businessType || 'General'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Rating value={stats.rating} precision={0.1} size="small" readOnly />
                      <Typography variant="caption" color="text.secondary">
                        ({stats.rating}) • {stats.reviews} reviews
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                  {merchant.businessInfo?.description || 'Quality products and excellent service'}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight={700}>
                      {stats.products}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Products
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight={700}>
                      {stats.rating}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Rating
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight={700} sx={{ fontSize: '0.9rem' }}>
                      {merchant.businessInfo?.location || 'Nairobi'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Location
                    </Typography>
                  </Box>
                </Box>

                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  endIcon={<ArrowForwardIcon />}
                  sx={{ textTransform: 'none' }}
                >
                  Visit Store
                </Button>
              </Paper>
            );
          })}
        </Box>

        {/* Empty State */}
        {filteredMerchants.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <StoreIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>
              No Merchants Found
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Try adjusting your search or filter criteria
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
              }}
            >
              Clear Filters
            </Button>
          </Box>
        )}
      </Container>

      {/* CTA Section */}
      <Box sx={{ bgcolor: 'grey.100', py: 8 }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Want to Join Our Merchant Network?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Start selling your products to thousands of customers across Kenya
          </Typography>
          <Button
            component={Link}
            to="/merchant/register"
            variant="contained"
            color="primary"
            size="large"
            endIcon={<ArrowForwardIcon />}
          >
            Become a Merchant
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default Merchants;
