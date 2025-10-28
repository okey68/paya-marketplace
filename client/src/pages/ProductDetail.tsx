import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  IconButton,
  Breadcrumbs,
  Link,
  Chip,
  Rating,
  Divider,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Stack,
  Alert,
  Skeleton,
  ButtonGroup,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Share as ShareIcon,
  LocalShipping as ShippingIcon,
  Autorenew as ReturnIcon,
  VerifiedUser as WarrantyIcon,
  Store as StoreIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import { useCart } from '../context/CartContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`product-tabpanel-${index}`}
      aria-labelledby={`product-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const fetchProduct = React.useCallback(async () => {
    try {
      const response = await api.get(`/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Product not found');
      navigate('/marketplace');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleAddToCart = () => {
    if (product) {
      for (let i = 0; i < quantity; i++) {
        addToCart({
          id: product._id,
          name: product.name,
          price: product.price,
          image: product.images?.[0] || null,
          merchantName: product.merchantName,
        });
      }
      toast.success(`${quantity} x ${product.name} added to cart!`);
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    const maxQuantity = product?.inventory?.quantity || 1;
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Removed from wishlist' : 'Added to wishlist');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ pt: 0, pb: 4 }}>
        <Skeleton variant="text" width={300} height={40} sx={{ mb: 1.5, mt: 1.5 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
          <Skeleton variant="rectangular" height={500} />
          <Box>
            <Skeleton variant="text" height={60} />
            <Skeleton variant="text" height={40} width="60%" />
            <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
          </Box>
        </Box>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Product Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          The product you're looking for doesn't exist or has been removed.
        </Typography>
        <Button variant="contained" component={RouterLink} to="/marketplace">
          Back to Marketplace
        </Button>
      </Container>
    );
  }

  const isOutOfStock = product.inventory?.quantity === 0;
  const isLowStock = product.inventory?.quantity <= product.inventory?.lowStockThreshold;
  const imageUrl = product.images?.[selectedImage];
  const hasImage = !!imageUrl;

  return (
    <Container maxWidth="lg" sx={{ pt: 0, pb: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        sx={{ mb: 1.5, mt: 1.5 }}
      >
        <Link component={RouterLink} to="/" underline="hover" color="inherit">
          Home
        </Link>
        <Link component={RouterLink} to="/marketplace" underline="hover" color="inherit">
          Marketplace
        </Link>
        <Link component={RouterLink} to="/marketplace" underline="hover" color="inherit">
          {product.category}
        </Link>
        <Typography color="text.primary">{product.name}</Typography>
      </Breadcrumbs>

      {/* Main Product Section */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4, mb: 4 }}>
        {/* Product Images */}
        <Box>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              mb: 2,
            }}
          >
            <Box
              sx={{
                position: 'relative',
                paddingTop: '100%',
                bgcolor: 'grey.50',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              {hasImage ? (
                <Box
                  component="img"
                  src={imageUrl}
                  alt={product.name}
                  onError={(e: any) => {
                    e.target.style.display = 'none';
                  }}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  <Typography sx={{ fontSize: '6rem' }}>🛍️</Typography>
                  <Typography variant="h6" color="text.secondary">
                    No image available
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>

          {/* Thumbnail Images */}
          {product.images && product.images.length > 1 && (
            <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto' }}>
              {product.images.map((image: string, index: number) => (
                <Paper
                  key={index}
                  elevation={0}
                  onClick={() => setSelectedImage(index)}
                  sx={{
                    width: 80,
                    height: 80,
                    flexShrink: 0,
                    cursor: 'pointer',
                    border: 2,
                    borderColor: selectedImage === index ? 'primary.main' : 'divider',
                    borderRadius: 1,
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    onError={(e: any) => {
                      e.target.src = '/placeholder-product.png';
                    }}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </Paper>
              ))}
            </Box>
          )}
        </Box>

        {/* Product Info */}
        <Box>
          {/* Product Header */}
          <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
            {product.name}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <StoreIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              by {product.merchantName}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Rating value={4} precision={0.5} readOnly size="small" />
            <Typography variant="body2" color="text.secondary">
              (4.0) • 23 reviews
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Price */}
          <Typography variant="h3" color="primary.main" fontWeight={700} gutterBottom>
            KES {product.price.toLocaleString()}
          </Typography>

          {/* Stock Status */}
          {isOutOfStock ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              Out of Stock
            </Alert>
          ) : isLowStock ? (
            <Alert severity="warning" sx={{ mb: 3 }}>
              Only {product.inventory.quantity} left in stock - order soon!
            </Alert>
          ) : (
            <Alert severity="success" sx={{ mb: 3 }}>
              In Stock ({product.inventory.quantity} available)
            </Alert>
          )}

          {/* Quantity Selector */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              Quantity:
            </Typography>
            <ButtonGroup variant="outlined" sx={{ mb: 2 }}>
              <IconButton
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                size="large"
              >
                <RemoveIcon />
              </IconButton>
              <Button disabled sx={{ minWidth: 60, fontSize: '1.1rem', fontWeight: 600 }}>
                {quantity}
              </Button>
              <IconButton
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= (product.inventory?.quantity || 1)}
                size="large"
              >
                <AddIcon />
              </IconButton>
            </ButtonGroup>
          </Box>

          {/* Action Buttons */}
          <Stack spacing={2} sx={{ mb: 3 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<CartIcon />}
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              sx={{
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
              }}
            >
              Add to Cart
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              sx={{
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
              }}
            >
              Buy Now
            </Button>
          </Stack>

          {/* Secondary Actions */}
          <Stack direction="row" spacing={1} sx={{ mb: 4 }}>
            <Button
              variant="outlined"
              startIcon={isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              onClick={toggleFavorite}
              sx={{ textTransform: 'none' }}
            >
              {isFavorite ? 'Saved' : 'Save'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
              sx={{ textTransform: 'none' }}
            >
              Share
            </Button>
          </Stack>

          {/* Product Features */}
          <Paper elevation={0} sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 2 }}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <ShippingIcon color="primary" />
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Free Delivery
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    On orders over KES 5,000
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <ReturnIcon color="primary" />
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    30-Day Returns
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Easy returns within 30 days
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <WarrantyIcon color="primary" />
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Warranty
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    1-year manufacturer warranty
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Paper>
        </Box>
      </Box>

      {/* Product Details Tabs */}
      <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label="Description" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab label="Specifications" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab label="Reviews (23)" sx={{ textTransform: 'none', fontWeight: 600 }} />
        </Tabs>

        <Box sx={{ p: 3 }}>
          <TabPanel value={activeTab} index={0}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Product Description
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {product.description}
            </Typography>

            {product.tags && product.tags.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Tags:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {product.tags.map((tag: string) => (
                    <Chip key={tag} label={tag} size="small" />
                  ))}
                </Stack>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Product Specifications
            </Typography>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, width: '30%' }}>SKU</TableCell>
                  <TableCell>{product.inventory?.sku || 'N/A'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                  <TableCell>{product.category}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Merchant</TableCell>
                  <TableCell>{product.merchantName}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Stock Status</TableCell>
                  <TableCell>{product.stockStatus || 'In Stock'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Customer Reviews
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" fontWeight={700}>
                  4.0
                </Typography>
                <Rating value={4} precision={0.5} readOnly />
                <Typography variant="caption" color="text.secondary">
                  Based on 23 reviews
                </Typography>
              </Box>
            </Box>
            <Alert severity="info">
              Reviews feature coming soon! Customers will be able to leave feedback and ratings here.
            </Alert>
          </TabPanel>
        </Box>
      </Paper>
    </Container>
  );
};

export default ProductDetail;
