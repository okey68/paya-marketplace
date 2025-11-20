import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Divider,
  Stack,
  Alert,
  ButtonGroup,
  Card,
  CardContent,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  LocalShipping as ShippingIcon,
  Security as SecurityIcon,
  Autorenew as ReturnIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const Cart = () => {
  const { items, getItemCount, getTotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setIsUpdating(true);
    try {
      updateQuantity(itemId, newQuantity);
      toast.success('Cart updated');
    } catch (error) {
      toast.error('Failed to update cart');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveItem = (itemId: string, itemName: string) => {
    removeFromCart(itemId);
    toast.success(`${itemName} removed from cart`);
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCart();
      toast.success('Cart cleared');
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const subtotal = getTotal();
  const shipping = subtotal > 5000 ? 0 : 500;
  const tax = Math.round(subtotal * 0.16);
  const total = subtotal + shipping + tax;

  if (getItemCount() === 0) {
    return (
      <Container maxWidth="md" sx={{ pt: 10, pb: 6, textAlign: 'center' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography sx={{ fontSize: '5rem' }}>🛒</Typography>
          <Typography variant="h4" fontWeight={700}>
            Your cart is empty
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Start shopping to add items to your cart
          </Typography>
          <Button
            component={RouterLink}
            to="/marketplace"
            variant="contained"
            color="primary"
            size="large"
            sx={{ mt: 1.5 }}
          >
            Browse Products
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ marginTop: "-50px", pb: 3 }}>
      {/* Shopping Cart Header */}
      <Typography variant="h4" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
        Shopping Cart
      </Typography>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button
          component={RouterLink}
          to="/marketplace"
          variant="text"
          startIcon={<ArrowBackIcon />}
          size="medium"
          sx={{ color: 'text.secondary' }}
        >
          Continue Shopping
        </Button>
        <Button
          variant="text"
          color="error"
          size="small"
          onClick={handleClearCart}
          startIcon={<DeleteIcon />}
        >
          Clear Cart
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3, mt: 3 }}>
        {/* Cart Items */}
        <Box>
          <Stack spacing={1.5}>
            {items.map((item: any) => (
              <Paper
                key={item.id}
                elevation={0}
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {/* Product Image */}
                  <Box
                    sx={{
                      width: 90,
                      height: 90,
                      flexShrink: 0,
                      borderRadius: 1.5,
                      overflow: 'hidden',
                      bgcolor: 'grey.50',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 1,
                      borderColor: 'divider',
                    }}
                  >
                    {item.image ? (
                      <Box
                        component="img"
                        src={`/api/uploads/${item.image}`}
                        alt={item.name}
                        onError={(e: any) => {
                          e.target.style.display = 'none';
                        }}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <Typography sx={{ fontSize: '3rem' }}>🛍️</Typography>
                    )}
                  </Box>

                  {/* Product Details */}
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mb: 0.5 }}>
                      {item.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                      by {item.merchantName}
                    </Typography>
                    <Button
                      component={RouterLink}
                      to={`/product/${item.id}`}
                      size="small"
                      variant="text"
                      sx={{ mt: 0.5, p: 0, minWidth: 'auto', textTransform: 'none', fontSize: '0.75rem' }}
                    >
                      View Details →
                    </Button>
                  </Box>

                  {/* Price and Quantity */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                    <Typography variant="h6" color="primary.main" fontWeight={700}>
                      {formatCurrency(item.price * item.quantity)}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ButtonGroup size="small" variant="outlined" sx={{ bgcolor: 'background.paper' }}>
                        <IconButton
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || isUpdating}
                          size="small"
                        >
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                        <Button disabled sx={{ minWidth: 50 }}>
                          {item.quantity}
                        </Button>
                        <IconButton
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          disabled={isUpdating}
                          size="small"
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </ButtonGroup>

                      <IconButton
                        onClick={() => handleRemoveItem(item.id, item.name)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>

                    <Typography variant="caption" color="text.secondary">
                      {formatCurrency(item.price)} each
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Stack>
        </Box>

        {/* Order Summary */}
        <Box>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              position: 'sticky',
              top: 80,
              bgcolor: 'grey.50',
            }}
          >
            <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 1.5 }}>
              Order Summary
            </Typography>

            <Divider sx={{ my: 1.5 }} />

            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Subtotal ({getItemCount()} items)
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {formatCurrency(subtotal)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Shipping
                </Typography>
                <Typography variant="body2" fontWeight={600} color={shipping === 0 ? 'success.main' : 'text.primary'}>
                  {shipping === 0 ? 'Free' : formatCurrency(shipping)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  VAT (16%)
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {formatCurrency(tax)}
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 1.5 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight={700}>
                Total
              </Typography>
              <Typography variant="h6" fontWeight={700} color="primary.main">
                {formatCurrency(total)}
              </Typography>
            </Box>

            {shipping > 0 && (
              <Alert severity="info" sx={{ mb: 1.5, py: 0.5 }}>
                Add {formatCurrency(5000 - subtotal)} more for free shipping!
              </Alert>
            )}

            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              onClick={handleCheckout}
              sx={{ 
                mb: 2, 
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              Proceed to Checkout
            </Button>

            {/* Security Badges */}
            <Stack spacing={0.75} sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  Secure Checkout
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShippingIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  Fast Delivery
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReturnIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  Easy Returns
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default Cart;
