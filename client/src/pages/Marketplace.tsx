import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  InputAdornment,
  MenuItem,
  Chip,
  Drawer,
  IconButton,
  Button,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Radio,
  RadioGroup,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  GridView as GridViewIcon,
  ViewList as ListViewIcon,
} from '@mui/icons-material';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Marketplace = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedPriceRange, setSelectedPriceRange] = useState('');
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { addToCart } = useCart();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

  const priceRanges = [
    { label: 'All Prices', value: '' },
    { label: 'Under KES 5,000', min: 0, max: 5000, value: '0-5000' },
    { label: 'KES 5,000 - KES 15,000', min: 5000, max: 15000, value: '5000-15000' },
    { label: 'KES 15,000 - KES 50,000', min: 15000, max: 50000, value: '15000-50000' },
    { label: 'KES 50,000 - KES 100,000', min: 50000, max: 100000, value: '50000-100000' },
    { label: 'KES 100,000 - KES 200,000', min: 100000, max: 200000, value: '100000-200000' },
    { label: 'Over KES 200,000', min: 200000, max: Infinity, value: '200000-inf' },
  ];

  const sortOptions = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Price: Low to High', value: 'price-low' },
    { label: 'Price: High to Low', value: 'price-high' },
    { label: 'Name: A to Z', value: 'name' },
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products/public');
      const productsData = response.data.products || response.data;
      const allProducts = Array.isArray(productsData) ? productsData : [];
      setProducts(allProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: any) => {
    addToCart({
      id: product._id,
      name: product.name,
      price: product.price,
      image: product.images?.[0],
      merchant: product.merchantName,
      product: product,
    });
    toast.success(`${product.name} added to cart!`);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const isInWishlist = prev.includes(productId);
      if (isInWishlist) {
        toast.success('Removed from wishlist');
        return prev.filter((id) => id !== productId);
      } else {
        toast.success('Added to wishlist');
        return [...prev, productId];
      }
    });
  };

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch =
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.tags?.some((tag: string) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesCategory =
        selectedCategory === '' ||
        selectedCategory === 'All Categories' ||
        product.category === selectedCategory;

      let matchesPrice = true;
      if (selectedPriceRange) {
        const range = priceRanges.find((r) => r.value === selectedPriceRange);
        if (range && range.min !== undefined) {
          matchesPrice =
            product.price >= range.min &&
            (range.max === Infinity || product.price <= range.max);
        }
      }

      return matchesSearch && matchesCategory && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedPriceRange('');
    setSearchTerm('');
    setSortBy('newest');
  };

  const activeFiltersCount =
    (selectedCategory && selectedCategory !== 'All Categories' ? 1 : 0) +
    (selectedPriceRange ? 1 : 0);

  // Filter Sidebar Component
  const FilterSidebar = () => (
    <Box sx={{ width: isMobile ? 280 : '100%', p: isMobile ? 2 : 0 }}>
      {isMobile && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight={700} sx={{ color: '#1e293b' }}>
            Filters
          </Typography>
          <IconButton 
            onClick={() => setFilterDrawerOpen(false)}
            sx={{
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.04)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      )}

      {/* Categories */}
      <Accordion 
        defaultExpanded 
        elevation={0}
        sx={{
          '&:before': { display: 'none' },
          bgcolor: 'transparent',
        }}
      >
        <AccordionSummary 
          expandIcon={<ExpandMoreIcon />}
          sx={{
            px: 0,
            minHeight: 48,
            '&.Mui-expanded': {
              minHeight: 48,
            },
          }}
        >
          <Typography fontWeight={700} sx={{ color: '#1e293b' }}>
            Categories
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0, pt: 0 }}>
          <RadioGroup
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((category) => (
              <FormControlLabel
                key={category}
                value={category === 'All Categories' ? '' : category}
                control={
                  <Radio 
                    size="small" 
                    sx={{
                      color: '#cbd5e1',
                      '&.Mui-checked': {
                        color: '#667FEA',
                      },
                    }}
                  />
                }
                label={
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#475569',
                      fontWeight: selectedCategory === (category === 'All Categories' ? '' : category) ? 600 : 400,
                    }}
                  >
                    {category}
                  </Typography>
                }
                sx={{ 
                  mb: 0.5,
                  ml: 0,
                  '&:hover': {
                    bgcolor: 'rgba(79, 70, 229, 0.04)',
                    borderRadius: 1,
                  },
                }}
              />
            ))}
          </RadioGroup>
        </AccordionDetails>
      </Accordion>

      <Divider sx={{ my: 2 }} />

      {/* Price Range */}
      <Accordion 
        defaultExpanded 
        elevation={0}
        sx={{
          '&:before': { display: 'none' },
          bgcolor: 'transparent',
        }}
      >
        <AccordionSummary 
          expandIcon={<ExpandMoreIcon />}
          sx={{
            px: 0,
            minHeight: 48,
            '&.Mui-expanded': {
              minHeight: 48,
            },
          }}
        >
          <Typography fontWeight={700} sx={{ color: '#1e293b' }}>
            Price Range
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0, pt: 0 }}>
          <RadioGroup
            value={selectedPriceRange}
            onChange={(e) => setSelectedPriceRange(e.target.value)}
          >
            {priceRanges.map((range) => (
              <FormControlLabel
                key={range.value}
                value={range.value}
                control={
                  <Radio 
                    size="small"
                    sx={{
                      color: '#cbd5e1',
                      '&.Mui-checked': {
                        color: '#667FEA',
                      },
                    }}
                  />
                }
                label={
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#475569',
                      fontWeight: selectedPriceRange === range.value ? 600 : 400,
                    }}
                  >
                    {range.label}
                  </Typography>
                }
                sx={{ 
                  mb: 0.5,
                  ml: 0,
                  '&:hover': {
                    bgcolor: 'rgba(79, 70, 229, 0.04)',
                    borderRadius: 1,
                  },
                }}
              />
            ))}
          </RadioGroup>
        </AccordionDetails>
      </Accordion>

      {activeFiltersCount > 0 && (
        <Button
          fullWidth
          variant="outlined"
          onClick={clearFilters}
          sx={{ 
            mt: 3,
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            borderColor: 'divider',
            color: 'text.primary',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'rgba(79, 70, 229, 0.04)',
            },
          }}
        >
          Clear All Filters
        </Button>
      )}
    </Box>
  );

  return (
    <Box sx={{ bgcolor: '#f9fafb', minHeight: '100vh', marginTop:"-50px" }}>
      <Container maxWidth="xl" sx={{ py: 1 }}>
        {/* Page Header */}
        {/* <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h4" 
            fontWeight={700} 
            sx={{ mb: 1, color: '#1e293b' }}
          >
            Marketplace
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b' }}>
            Discover amazing products from merchants
          </Typography>
        </Box> */}

        {/* Search and Controls */}
        <Box 
          sx={{ 
            mb: 3,
            p: 3,
            bgcolor: 'white',
            borderRadius: 2,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ mb: 2 }}
          >
            <TextField
              fullWidth
              placeholder="Search for products, brands, categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
            <TextField
              select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              sx={{ 
                minWidth: { xs: '100%', sm: 220 },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            >
              {sortOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {/* Active Filters and View Toggle */}
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
            sx={{ gap: 1 }}
          >
            {isMobile && (
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setFilterDrawerOpen(true)}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: 'divider',
                  color: 'text.primary',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'rgba(79, 70, 229, 0.04)',
                  },
                }}
              >
                Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </Button>
            )}

            {selectedCategory && selectedCategory !== 'All Categories' && (
              <Chip
                label={selectedCategory}
                onDelete={() => setSelectedCategory('')}
                sx={{
                  bgcolor: '#eff6ff',
                  color: '#3b82f6',
                  fontWeight: 600,
                  '& .MuiChip-deleteIcon': {
                    color: '#3b82f6',
                  },
                }}
              />
            )}
            {selectedPriceRange && (
              <Chip
                label={priceRanges.find((r) => r.value === selectedPriceRange)?.label}
                onDelete={() => setSelectedPriceRange('')}
                sx={{
                  bgcolor: '#eff6ff',
                  color: '#3b82f6',
                  fontWeight: 600,
                  '& .MuiChip-deleteIcon': {
                    color: '#3b82f6',
                  },
                }}
              />
            )}

            <Box sx={{ flexGrow: 1 }} />

            {/* View Mode Toggle */}
            <Stack 
              direction="row" 
              spacing={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1.5,
                p: 0.5,
                bgcolor: '#f9fafb',
              }}
            >
              <IconButton
                size="small"
                onClick={() => setViewMode('grid')}
                sx={{
                  borderRadius: 1,
                  bgcolor: viewMode === 'grid' ? 'white' : 'transparent',
                  color: viewMode === 'grid' ? 'primary.main' : 'text.secondary',
                  boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  '&:hover': {
                    bgcolor: viewMode === 'grid' ? 'white' : 'rgba(0,0,0,0.04)',
                  },
                }}
              >
                <GridViewIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setViewMode('list')}
                sx={{
                  borderRadius: 1,
                  bgcolor: viewMode === 'list' ? 'white' : 'transparent',
                  color: viewMode === 'list' ? 'primary.main' : 'text.secondary',
                  boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  '&:hover': {
                    bgcolor: viewMode === 'list' ? 'white' : 'rgba(0,0,0,0.04)',
                  },
                }}
              >
                <ListViewIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
        </Box>

        {/* Main Content */}
        <Box sx={{ display: 'flex', gap: 3 }}>
          {/* Desktop Filter Sidebar */}
          {!isMobile && (
            <Box sx={{ width: 280, flexShrink: 0 }}>
              <Box
                sx={{
                  position: 'sticky',
                  top: 100,
                  bgcolor: 'white',
                  borderRadius: 2,
                  p: 2.5,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2, color: '#1e293b' }}>
                  Filters
                </Typography>
                <FilterSidebar />
              </Box>
            </Box>
          )}

          {/* Mobile Filter Drawer */}
          <Drawer
            anchor="left"
            open={filterDrawerOpen}
            onClose={() => setFilterDrawerOpen(false)}
          >
            <FilterSidebar />
          </Drawer>

          {/* Products Grid */}
          <Box sx={{ flexGrow: 1 }}>
            {loading ? (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                    lg: 'repeat(4, 1fr)',
                    xl: 'repeat(5, 1fr)',
                  },
                  gap: 2,
                }}
              >
                {[...Array(10)].map((_, index) => (
                  <ProductCard key={index} product={{} as any} loading />
                ))}
              </Box>
            ) : filteredProducts.length === 0 ? (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 10,
                  px: 2,
                  bgcolor: 'white',
                  borderRadius: 3,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: '#1e293b' }}>
                  No products found
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Try adjusting your filters or search terms
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={clearFilters}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                  }}
                >
                  Clear Filters
                </Button>
              </Box>
            ) : (
              <>
                <Box 
                  sx={{ 
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography 
                    variant="body2" 
                    fontWeight={600}
                    sx={{ color: '#475569' }}
                  >
                    {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                  </Typography>
                  {activeFiltersCount > 0 && (
                    <Button
                      size="small"
                      onClick={clearFilters}
                      sx={{
                        textTransform: 'none',
                        color: '#3b82f6',
                        fontWeight: 600,
                        '&:hover': {
                          bgcolor: '#eff6ff',
                        },
                      }}
                    >
                      Clear all filters
                    </Button>
                  )}
                </Box>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(2, 1fr)',
                      md: viewMode === 'grid' ? 'repeat(3, 1fr)' : '1fr',
                      lg: viewMode === 'grid' ? 'repeat(3, 1fr)' : '1fr',
                      xl: viewMode === 'grid' ? 'repeat(5, 1fr)' : '1fr',
                    },
                    gap: 2,
                  }}
                >
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      onToggleWishlist={toggleWishlist}
                      isInWishlist={wishlist.includes(product._id)}
                    />
                  ))}
                </Box>
              </>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Marketplace;
