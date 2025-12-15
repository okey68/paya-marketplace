import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Skeleton,
  Stack,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Receipt as ReceiptIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  Cancel as CancelledIcon,
  ShoppingBag as ShoppingBagIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import api, { getImageUrl } from '../utils/api';
import toast from 'react-hot-toast';

interface Order {
  _id: string;
  orderNumber: string;
  items: Array<{
    product: {
      _id: string;
      name: string;
      images: string[];
    };
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/my-orders');
      setOrders(response.data.orders || response.data || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      // Don't show error toast for 404 (no orders yet)
      if (error.response?.status !== 404) {
        toast.error('Failed to load orders');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <PendingIcon color="warning" />;
      case 'processing':
        return <ReceiptIcon color="info" />;
      case 'shipped':
        return <ShippingIcon color="primary" />;
      case 'delivered':
        return <CompletedIcon color="success" />;
      case 'cancelled':
        return <CancelledIcon color="error" />;
      default:
        return <PendingIcon />;
    }
  };

  const getStatusColor = (status: string): 'default' | 'warning' | 'info' | 'primary' | 'success' | 'error' => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'shipped':
        return 'primary';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const filterOrders = (status?: string) => {
    if (!status || status === 'all') return orders;
    return orders.filter((order) => order.status === status);
  };

  const tabLabels = ['All Orders', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  const tabFilters = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <Box sx={{ bgcolor: '#f9fafb', minHeight: '100vh' }}>
        <Container maxWidth="lg" sx={{ pt: 4, pb: 6 }}>
          <Skeleton variant="text" width={200} height={40} sx={{ mb: 3 }} />
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
        </Container>
      </Box>
    );
  }

  if (orders.length === 0) {
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
                bgcolor: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <ShoppingBagIcon sx={{ fontSize: 60, color: '#9ca3af' }} />
            </Box>
            <Typography variant="h4" fontWeight={700}>
              No Orders Yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
              You haven't placed any orders yet. Start shopping to see your orders here.
            </Typography>
            <Button
              component={RouterLink}
              to="/marketplace"
              variant="contained"
              size="large"
              sx={{ mt: 2, bgcolor: '#667FEA', '&:hover': { bgcolor: '#4338ca' } }}
            >
              Start Shopping
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Button
            component={RouterLink}
            to="/profile"
            startIcon={<ArrowBackIcon />}
            sx={{ color: 'text.secondary' }}
          >
            Back to Profile
          </Button>
        </Box>

        <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
          My Orders
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Track and manage your orders
        </Typography>

        {/* Tabs */}
        <Paper elevation={0} sx={{ borderRadius: 3, border: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
          >
            {tabLabels.map((label, index) => (
              <Tab
                key={label}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {label}
                    <Chip
                      size="small"
                      label={filterOrders(tabFilters[index]).length}
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  </Box>
                }
              />
            ))}
          </Tabs>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order Number</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filterOrders(tabFilters[activeTab]).map((order) => (
                  <TableRow key={order._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        #{order.orderNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>{order.items?.length || 0} item(s)</TableCell>
                    <TableCell>
                      <Typography fontWeight={600}>
                        {formatCurrency(order.totalAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(order.status)}
                        label={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        size="small"
                        color={getStatusColor(order.status)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.paymentStatus}
                        size="small"
                        color={order.paymentStatus === 'paid' ? 'success' : 'warning'}
                        variant="filled"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={() => handleViewOrder(order)}
                        color="primary"
                        size="small"
                      >
                        <ViewIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filterOrders(tabFilters[activeTab]).length === 0 && (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No orders found in this category
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Order Details Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
          {selectedOrder && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" fontWeight={700}>
                    Order #{selectedOrder.orderNumber}
                  </Typography>
                  <Chip
                    label={selectedOrder.status}
                    color={getStatusColor(selectedOrder.status)}
                    size="small"
                  />
                </Box>
              </DialogTitle>
              <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Placed on {formatDate(selectedOrder.createdAt)}
                </Typography>

                {/* Order Items */}
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  Items
                </Typography>
                <Stack spacing={2} sx={{ mb: 3 }}>
                  {selectedOrder.items?.map((item, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        gap: 2,
                        p: 2,
                        bgcolor: '#f9fafb',
                        borderRadius: 2,
                      }}
                    >
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: 1,
                          overflow: 'hidden',
                          bgcolor: 'grey.200',
                        }}
                      >
                        {item.product?.images?.[0] && (
                          <Box
                            component="img"
                            src={getImageUrl(item.product.images[0])}
                            alt={item.product?.name}
                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        )}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={600}>
                          {item.product?.name || 'Product'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Qty: {item.quantity} × {formatCurrency(item.price)}
                        </Typography>
                      </Box>
                      <Typography fontWeight={600}>
                        {formatCurrency(item.quantity * item.price)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>

                <Divider sx={{ my: 2 }} />

                {/* Shipping Address */}
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  Shipping Address
                </Typography>
                {selectedOrder.shippingAddress ? (
                  <Typography variant="body2" color="text.secondary">
                    {selectedOrder.shippingAddress.street}<br />
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}<br />
                    {selectedOrder.shippingAddress.country}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No shipping address provided
                  </Typography>
                )}

                <Divider sx={{ my: 2 }} />

                {/* Order Summary */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Total
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="primary">
                    {formatCurrency(selectedOrder.totalAmount)}
                  </Typography>
                </Box>
              </DialogContent>
              <DialogActions sx={{ p: 3 }}>
                <Button onClick={() => setDialogOpen(false)} variant="outlined">
                  Close
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Container>
    </Box>
  );
};

export default Orders;
