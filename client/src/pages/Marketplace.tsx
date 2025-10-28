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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            Filters
          </Typography>
          <IconButton onClick={() => setFilterDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
      )}

      {/* Categories */}
      <Accordion defaultExpanded elevation={0}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight={600}>Categories</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <RadioGroup
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((category) => (
              <FormControlLabel
                key={category}
                value={category === 'All Categories' ? '' : category}
                control={<Radio size="small" />}
                label={category}
              />
            ))}
          </RadioGroup>
        </AccordionDetails>
      </Accordion>

      <Divider />

      {/* Price Range */}
      <Accordion defaultExpanded elevation={0}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight={600}>Price Range</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <RadioGroup
            value={selectedPriceRange}
            onChange={(e) => setSelectedPriceRange(e.target.value)}
          >
            {priceRanges.map((range) => (
              <FormControlLabel
                key={range.value}
                value={range.value}
                control={<Radio size="small" />}
                label={range.label}
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
          sx={{ mt: 2 }}
        >
          Clear All Filters
        </Button>
      )}
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Search and Controls */}
      <Box sx={{ mb: 3 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <TextField
            fullWidth
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            sx={{ minWidth: { xs: '100%', sm: 200 } }}
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
            >
              Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Button>
          )}

          {selectedCategory && selectedCategory !== 'All Categories' && (
            <Chip
              label={selectedCategory}
              onDelete={() => setSelectedCategory('')}
              color="primary"
              variant="outlined"
            />
          )}
          {selectedPriceRange && (
            <Chip
              label={priceRanges.find((r) => r.value === selectedPriceRange)?.label}
              onDelete={() => setSelectedPriceRange('')}
              color="primary"
              variant="outlined"
            />
          )}

          <Box sx={{ flexGrow: 1 }} />

          {/* View Mode Toggle */}
          <Stack direction="row" spacing={0.5}>
            <IconButton
              onClick={() => setViewMode('grid')}
              color={viewMode === 'grid' ? 'primary' : 'default'}
            >
              <GridViewIcon />
            </IconButton>
            <IconButton
              onClick={() => setViewMode('list')}
              color={viewMode === 'list' ? 'primary' : 'default'}
            >
              <ListViewIcon />
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
                bgcolor: 'background.paper',
                borderRadius: 2,
                p: 2,
                border: 1,
                borderColor: 'divider',
              }}
            >
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
                  md: 'repeat(2, 1fr)',
                  lg: 'repeat(3, 1fr)',
                  xl: 'repeat(4, 1fr)',
                },
                gap: 3,
              }}
            >
              {[...Array(8)].map((_, index) => (
                <ProductCard key={index} product={{} as any} loading />
              ))}
            </Box>
          ) : filteredProducts.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                px: 2,
              }}
            >
              <Typography variant="h5" gutterBottom>
                No products found
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Try adjusting your filters or search terms
              </Typography>
              <Button variant="contained" onClick={clearFilters}>
                Clear Filters
              </Button>
            </Box>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: viewMode === 'grid' ? 'repeat(2, 1fr)' : '1fr',
                    lg: viewMode === 'grid' ? 'repeat(3, 1fr)' : '1fr',
                    xl: viewMode === 'grid' ? 'repeat(4, 1fr)' : '1fr',
                  },
                  gap: 3,
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
  );
};

export default Marketplace;
