import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRefundModal, setShowRefundModal] = useState(false);

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/merchant/orders/${id}`);
      setOrder(response.data.order);
    } catch (error) {
      console.error('Error fetching order detail:', error);
      toast.error('Failed to load order details');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await api.patch(`/orders/${id}/status`, {
        status: newStatus,
        note: `Status updated to ${newStatus} by merchant`
      });
      
      setOrder(prev => ({
        ...prev,
        status: newStatus,
        timeline: [
          ...prev.timeline,
          {
            status: newStatus,
            timestamp: new Date(),
            note: `Status updated to ${newStatus} by merchant`
          }
        ]
      }));
      
      toast.success('Order status updated successfully');
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const handleMarkShipped = async () => {
    await handleStatusUpdate('shipped');
  };

  const handleRefund = () => {
    setShowRefundModal(true);
  };

  const confirmRefund = async () => {
    setShowRefundModal(false);
    await handleStatusUpdate('refunded');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="error-container">
        <h2>Order Not Found</h2>
        <p>The order you're looking for doesn't exist or you don't have permission to view it.</p>
        <button onClick={() => navigate('/orders')} className="btn btn-primary">
          Back to Orders
        </button>
      </div>
    );
  }

  const customerName = order.customer 
    ? `${order.customer.firstName} ${order.customer.lastName}` 
    : `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim() || 'N/A';

  const customerEmail = order.customer?.email || order.customerInfo?.email || 'N/A';

  return (
    <div className="order-detail-container">
      <div className="order-detail-header">
        <div className="header-left">
          <button onClick={() => navigate('/orders')} className="btn btn-outline">
            ← Back to Orders
          </button>
          <div className="order-title">
            <h1>Order #{order.orderNumber}</h1>
            <span className={`status-badge status-${order.status}`}>
              {order.status}
            </span>
          </div>
        </div>
        <div className="header-right">
          <button 
            onClick={handleMarkShipped}
            className="btn"
            style={{ 
              marginRight: '0.5rem',
              backgroundColor: 'white',
              color: '#64748b',
              border: '1px solid #cbd5e1'
            }}
            disabled={order.status === 'shipped' || order.status === 'delivered'}
          >
            Mark Shipped
          </button>
          <button 
            onClick={handleRefund}
            className="btn"
            style={{ 
              marginRight: '0.5rem',
              backgroundColor: 'white',
              color: '#64748b',
              border: '1px solid #cbd5e1'
            }}
            disabled={order.status === 'refunded'}
          >
            Refund
          </button>
          <select
            value={order.status}
            onChange={(e) => handleStatusUpdate(e.target.value)}
            className="status-select"
          >
            <option value="pending_payment">Pending Payment</option>
            <option value="paid">Paid</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="order-detail-content">
        <div className="order-info-grid">
          {/* Customer Information */}
          <div className="info-card">
            <h3>Customer Information</h3>
            <div className="info-item">
              <label>Name:</label>
              <span>{customerName}</span>
            </div>
            <div className="info-item">
              <label>Email:</label>
              <span>{customerEmail}</span>
            </div>
            {(order.customerInfo?.phoneNumber || order.customer?.phoneNumber) && (
              <div className="info-item">
                <label>Phone:</label>
                <span>
                  {order.customerInfo?.phoneCountryCode || order.customer?.phoneCountryCode || '+254'}{' '}
                  {order.customerInfo?.phoneNumber || order.customer?.phoneNumber}
                </span>
              </div>
            )}
            <div className="info-item">
              <label>Customer Type:</label>
              <span>{order.customer ? 'Registered' : 'Guest'}</span>
            </div>
          </div>

          {/* Shipping Information */}
          <div className="info-card">
            <h3>Shipping Address</h3>
            <div className="address">
              <p>{order.shippingAddress.street}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.county}</p>
              <p>{order.shippingAddress.postalCode}</p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="info-card">
            <h3>Order Summary</h3>
            <div className="info-item">
              <label>Order Date:</label>
              <span>{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="info-item">
              <label>Payment Method:</label>
              <span>{order.payment?.method === 'paya_bnpl' ? 'Paya BNPL' : order.payment?.method}</span>
            </div>
            <div className="info-item">
              <label>Payment Status:</label>
              <span className={`payment-status ${order.payment?.status}`}>
                {order.payment?.status}
              </span>
            </div>
          </div>

        </div>

        {/* Order Items */}
        <div className="order-items-section">
          <h3>Order Items</h3>
          <div className="items-table">
            <div className="items-header">
              <div className="col-product">Product</div>
              <div className="col-price">Price</div>
              <div className="col-quantity">Quantity</div>
              <div className="col-total">Total</div>
            </div>
            {order.items.map((item, index) => (
              <div key={index} className="item-row">
                <div className="col-product">
                  <div className="product-info">
                    <h4>{item.productName}</h4>
                    <p>SKU: {item.product?.sku || 'N/A'}</p>
                  </div>
                </div>
                <div className="col-price">
                  KES {item.productPrice?.toLocaleString()}
                </div>
                <div className="col-quantity">
                  {item.quantity}
                </div>
                <div className="col-total">
                  KES {(item.productPrice * item.quantity)?.toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* Order Totals */}
          <div className="order-totals">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>KES {order.subtotal?.toLocaleString()}</span>
            </div>
            {order.totalTax > 0 && (
              <div className="total-row">
                <span>Tax:</span>
                <span>KES {order.totalTax?.toLocaleString()}</span>
              </div>
            )}
            {order.totalShipping > 0 && (
              <div className="total-row">
                <span>Shipping:</span>
                <span>KES {order.totalShipping?.toLocaleString()}</span>
              </div>
            )}
            <div className="total-row">
              <span>Merchant Fee (1%):</span>
              <span className="fee-amount">- KES {Math.floor((order.totalAmount || 0) * 0.01).toLocaleString()}</span>
            </div>
            <div className="total-row total-final">
              <span>Amount Advanced (99%):</span>
              <span className="advanced-amount">KES {Math.floor((order.totalAmount || 0) * 0.99).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Order Timeline */}
        <div className="order-timeline-section">
          <h3>Order Timeline</h3>
          <div className="timeline">
            {order.timeline?.map((entry, index) => (
              <div key={index} className="timeline-item">
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <div className="timeline-status">{entry.status}</div>
                  <div className="timeline-note">{entry.note}</div>
                  <div className="timeline-date">
                    {new Date(entry.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Refund Confirmation Modal */}
      {showRefundModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowRefundModal(false)} />
          <div className="modal">
            <div className="modal-header">
              <h3>Confirm Refund</h3>
              <button className="modal-close" onClick={() => setShowRefundModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to refund this order?</p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>
                This action will update the order status to "Refunded". In the future, this will also trigger a refund through your banking API.
              </p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-outline" 
                onClick={() => setShowRefundModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={confirmRefund}
              >
                Confirm Refund
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OrderDetail;
