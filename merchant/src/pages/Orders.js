import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const MerchantOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');

  const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/merchant/orders');
      setOrders(response.data.orders || response.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Don't show error toast, just set empty array
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/fulfillment`, { status: newStatus });
      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, fulfillmentStatus: newStatus } : order
      ));
      toast.success('Order status updated successfully');
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const downloadOrders = () => {
    // Prepare CSV data
    const headers = ['Order Number', 'Customer Name', 'Customer Email', 'Date', 'Total Amount', 'Advanced (99%)', 'Status', 'Items'];
    
    const csvData = filteredOrders.map(order => {
      const customerName = order.customer 
        ? `${order.customer.firstName} ${order.customer.lastName}` 
        : `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim() || 'N/A';
      const customerEmail = order.customer?.email || order.customerInfo?.email || 'N/A';
      const items = order.items?.map(item => `${item.productName} (x${item.quantity})`).join('; ') || '';
      const advancedAmount = Math.floor((order.totalAmount || 0) * 0.99);
      
      return [
        order.orderNumber,
        customerName,
        customerEmail,
        new Date(order.createdAt).toLocaleDateString(),
        order.totalAmount,
        advancedAmount,
        order.status,
        items
      ];
    });

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast.success(`Downloaded ${filteredOrders.length} orders`);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="merchant-orders">
        <div className="loading-spinner">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="merchant-orders">
      <div className="orders-header">
        <h1>My Orders</h1>
        <button 
          className="btn btn-secondary"
          onClick={downloadOrders}
          disabled={filteredOrders.length === 0}
        >
          📥 Download Orders
        </button>
      </div>

      {/* Order Summary */}
      {orders.length > 0 && (
        <div className="orders-summary">
          <div className="summary-stats">
            <div className="stat">
              <strong>{orders.length}</strong>
              <span>Total Orders</span>
            </div>
            <div className="stat">
              <strong>{orders.filter(o => o.status === 'pending').length}</strong>
              <span>Pending</span>
            </div>
            <div className="stat">
              <strong>{orders.filter(o => o.status === 'processing').length}</strong>
              <span>Processing</span>
            </div>
            <div className="stat">
              <strong>{orders.filter(o => o.status === 'shipped').length}</strong>
              <span>Shipped</span>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="orders-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            {statuses.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="createdAt">Newest First</option>
            <option value="orderNumber">Order Number</option>
            <option value="total">Amount</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <div className="orders-list">
          <div className="orders-list-header">
            <div className="col-order">Order</div>
            <div className="col-customer">Customer</div>
            <div className="col-date">Date</div>
            <div className="col-total">Total</div>
            <div className="col-status">Status</div>
            <div className="col-actions">Actions</div>
          </div>
          {filteredOrders.map(order => (
            <div key={order._id} className="order-list-item">
              <div className="col-order">
                <div className="order-info">
                  <h4>{order.orderNumber}</h4>
                  <span className="order-items">{order.items?.length || 0} items</span>
                </div>
              </div>

              <div className="col-customer">
                <div className="customer-info">
                  <span className="customer-name">
                    {order.customer 
                      ? `${order.customer.firstName} ${order.customer.lastName}` 
                      : `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim() || 'N/A'
                    }
                  </span>
                  <span className="customer-email">
                    {order.customer?.email || order.customerInfo?.email || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="col-date">
                {new Date(order.createdAt).toLocaleDateString()}
              </div>

              <div className="col-total">
                <div className="total-info">
                  <strong>KES {Math.floor((order.totalAmount || 0) * 0.99).toLocaleString()}</strong>
                  <span className="total-subtitle">Advanced (99%)</span>
                  <span className="total-original">KES {order.totalAmount?.toLocaleString() || '0'} total</span>
                </div>
              </div>

              <div className="col-status">
                <span className={`status-badge status-${order.status}`}>
                  {order.status}
                </span>
              </div>

              <div className="col-actions">
                <select
                  value={order.fulfillmentStatus || order.status}
                  onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                  className="status-select"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
                
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => window.location.href = `/orders/${order._id}`}
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No Orders Found</h3>
          <p>
            {searchTerm || filterStatus 
              ? 'No orders match your current filters.' 
              : 'You haven\'t received any orders yet.'
            }
          </p>
          <p>Orders will appear here when customers purchase your products.</p>
        </div>
      )}
    </div>
  );
};

export default MerchantOrders;
