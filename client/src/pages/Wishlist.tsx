import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Stack,
  Skeleton,
  Chip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,
  ArrowBack as ArrowBackIcon,
  Store as StoreIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api, { getImageUrl } from '../utils/api';
import toast from 'react-hot-toast';

interface WishlistItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
    images: string[];
    merchantName: string;
    category: string;
    inventory?: {
      quantity: number;
    };
  };
  addedAt: string;
}

const Wishlist = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Local storage key for wishlist
  const getWishlistKey = () => `wishlist_${user?._id || 'guest'}`;

  useEffect(() => {
    fetchWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchWishlist = async () => {
    try {
      // Try to fetch from API first
      if (user) {
        try {
          const response = await api.get('/wishlist');
          if (response.data && response.data.items) {
            setWishlistItems(response.data.items);
            setLoading(false);
            return;
          }
        } catch (error) {
          // If API fails, fall back to localStorage
          console.log('Using localStorage wishlist');
        }
      }

      // Fallback to localStorage
      const savedWishlist = localStorage.getItem(getWishlistKey());
      if (savedWishlist) {
        const parsedWishlist = JSON.parse(savedWishlist);
        setWishlistItems(parsedWishlist);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveWishlistToStorage = (items: WishlistItem[]) => {
    localStorage.setItem(getWishlistKey(), JSON.stringify(items));
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      // Try API first
      if (user) {
        try {
          await api.delete(`/wishlist/${itemId}`);
        } catch (error) {
          console.log('API remove failed, updating local storage');
        }
      }

      // Update local state
      const updatedItems = wishlistItems.filter(
        (item) => item._id !== itemId && item.product?._id !== itemId
      );
      setWishlistItems(updatedItems);
      saveWishlistToStorage(updatedItems);
      toast.success('Item removed from wishlist');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleAddToCart = (item: WishlistItem) => {
    if (!item.product) return;

    addToCart({
      id: item.product._id,
      name: item.product.name,
      price: item.product.price,
      image: item.product.images?.[0],
      merchantName: item.product.merchantName,
    });
    toast.success(`${item.product.name} added to cart!`);
  };

  const handleMoveAllToCart = () => {
    wishlistItems.forEach((item) => {
      if (item.product) {
        addToCart({
          id: item.product._id,
          name: item.product.name,
          price: item.product.price,
          image: item.product.images?.[0],
          merchantName: item.product.merchantName,
        });
      }
    });
    toast.success('All items added to cart!');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Box sx={{ bgcolor: '#f9fafb', minHeight: '100vh' }}>
        <Container maxWidth="lg" sx={{ pt: 4, pb: 6 }}>
          <Skeleton variant="text" width={200} height={40} sx={{ mb: 3 }} />
          <Stack spacing={2}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            ))}
          </Stack>
        </Container>
      </Box>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <Box sx={{ bgcolor: '#f9fafb', minHeight: '100vh' }}>
        <Container maxWidth="md" sx={{ pt: 8, pb: 6, textAlign: 'center' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                bgcolor: '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <FavoriteIcon sx={{ fontSize: 60, color: '#f87171' }} />
            </Box>
            <Typography variant="h4" fontWeight={700}>
              Your Wishlist is Empty
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
              Save items you love to your wishlist and come back to them anytime.
            </Typography>
            <Button
              component={RouterLink}
              to="/marketplace"
              variant="contained"
              size="large"
              sx={{ mt: 2, bgcolor: '#667FEA', '&:hover': { bgcolor: '#4338ca' } }}
            >
              Explore Products
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f9fafb', minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ pt: 4, pb: 6 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Button
            component={RouterLink}
            to="/profile"
            startIcon={<ArrowBackIcon />}
            sx={{ color: 'text.secondary' }}
          >
            Back to Profile
          </Button>
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
              My Wishlist
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''} saved
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<CartIcon />}
            onClick={handleMoveAllToCart}
            sx={{ bgcolor: '#667FEA', '&:hover': { bgcolor: '#4338ca' } }}
          >
            Add All to Cart
          </Button>
        </Box>

        {/* Wishlist Items */}
        <Stack spacing={2}>
          {wishlistItems.map((item) => (
            <Paper
              key={item._id || item.product?._id}
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: 1,
                borderColor: 'divider',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  gap: 3,
                  flexDirection: { xs: 'column', sm: 'row' },
                }}
              >
                {/* Product Image */}
                <Box
                  sx={{
                    width: { xs: '100%', sm: 150 },
                    height: { xs: 200, sm: 150 },
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: 'grey.100',
                    flexShrink: 0,
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate(`/product/${item.product?._id}`)}
                >
                  {item.product?.images?.[0] ? (
                    <Box
                      component="img"
                      src={getImageUrl(item.product.images[0])}
                      alt={item.product?.name}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography sx={{ fontSize: '4rem' }}>🛍️</Typography>
                    </Box>
                  )}
                </Box>

                {/* Product Details */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography
                      variant="h6"
                      fontWeight={600}
                      sx={{ cursor: 'pointer', '&:hover': { color: '#667FEA' } }}
                      onClick={() => navigate(`/product/${item.product?._id}`)}
                    >
                      {item.product?.name || 'Product'}
                    </Typography>
                    <IconButton
                      onClick={() => handleRemoveItem(item._id || item.product?._id)}
                      size="small"
                      sx={{ color: 'error.main' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <StoreIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {item.product?.merchantName || 'Unknown Merchant'}
                    </Typography>
                    {item.product?.category && (
                      <Chip label={item.product.category} size="small" variant="outlined" />
                    )}
                  </Box>

                  <Typography variant="h5" fontWeight={700} color="#667FEA" sx={{ mb: 2 }}>
                    {formatCurrency(item.product?.price || 0)}
                  </Typography>

                  {/* Stock Status */}
                  {item.product?.inventory?.quantity === 0 ? (
                    <Chip label="Out of Stock" color="error" size="small" sx={{ mb: 2 }} />
                  ) : item.product?.inventory && item.product.inventory.quantity < 5 ? (
                    <Chip label="Low Stock" color="warning" size="small" sx={{ mb: 2 }} />
                  ) : (
                    <Chip label="In Stock" color="success" size="small" sx={{ mb: 2 }} />
                  )}

                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<CartIcon />}
                      onClick={() => handleAddToCart(item)}
                      disabled={item.product?.inventory?.quantity === 0}
                      sx={{
                        bgcolor: '#667FEA',
                        '&:hover': { bgcolor: '#4338ca' },
                      }}
                    >
                      Add to Cart
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => navigate(`/product/${item.product?._id}`)}
                      sx={{ borderColor: '#667FEA', color: '#667FEA' }}
                    >
                      View Details
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Paper>
          ))}
        </Stack>
      </Container>
    </Box>
  );
};

export default Wishlist;
