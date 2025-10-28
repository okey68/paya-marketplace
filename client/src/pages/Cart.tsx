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
      <Container maxWidth="md" sx={{ pt: 12, pb: 8, textAlign: 'center' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Typography sx={{ fontSize: '6rem' }}>🛒</Typography>
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
            sx={{ mt: 2 }}
          >
            Browse Products
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ pt: 12, pb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          component={RouterLink}
          to="/marketplace"
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          size="large"
        >
          Continue Shopping
        </Button>
        <Button
          variant="outlined"
          color="error"
          size="small"
          onClick={handleClearCart}
          startIcon={<DeleteIcon />}
        >
          Clear Cart
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 6, mt: 6 }}>
        {/* Cart Items */}
        <Box>
          <Stack spacing={2}>
            {items.map((item: any) => (
              <Paper
                key={item.id}
                elevation={0}
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {/* Product Image */}
                  <Box
                    sx={{
                      width: 100,
                      height: 100,
                      flexShrink: 0,
                      borderRadius: 1,
                      overflow: 'hidden',
                      bgcolor: 'grey.100',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
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
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {item.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      by {item.merchantName}
                    </Typography>
                    <Button
                      component={RouterLink}
                      to={`/product/${item.id}`}
                      size="small"
                      sx={{ mt: 1 }}
                    >
                      View Product
                    </Button>
                  </Box>

                  {/* Price and Quantity */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                    <Typography variant="h6" color="primary.main" fontWeight={700}>
                      {formatCurrency(item.price * item.quantity)}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ButtonGroup size="small" variant="outlined">
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
              p: 3,
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              position: 'sticky',
              top: 80,
            }}
          >
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Order Summary
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Stack spacing={1.5}>
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

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" fontWeight={700}>
                Total
              </Typography>
              <Typography variant="h6" fontWeight={700} color="primary.main">
                {formatCurrency(total)}
              </Typography>
            </Box>

            {shipping > 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Add {formatCurrency(5000 - subtotal)} more for free shipping!
              </Alert>
            )}

            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              onClick={handleCheckout}
              sx={{ mb: 3, py: 1.5 }}
            >
              Proceed to Checkout
            </Button>

            {/* Security Badges */}
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon color="action" fontSize="small" />
                <Typography variant="caption" color="text.secondary">
                  Secure Checkout
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShippingIcon color="action" fontSize="small" />
                <Typography variant="caption" color="text.secondary">
                  Fast Delivery
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReturnIcon color="action" fontSize="small" />
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
