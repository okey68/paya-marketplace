import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({});
  const [totals, setTotals] = useState({ totalAmount: 0, totalAdvanced: 0 });

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });

      const response = await axios.get(`/admin/orders?${params}`);
      setOrders(response.data.orders);
      setPagination(response.data.pagination);
      setTotals(response.data.totals);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending_payment: { class: 'badge-warning', label: 'Pending Payment' },
      paid: { class: 'badge-info', label: 'Paid' },
      processing: { class: 'badge-info', label: 'Processing' },
      shipped: { class: 'badge-warning', label: 'Shipped' },
      delivered: { class: 'badge-success', label: 'Delivered' },
      cancelled: { class: 'badge-danger', label: 'Cancelled' }
    };
    
    const config = statusConfig[status] || { class: 'badge-info', label: status };
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Orders</h1>
        <p className="page-subtitle">Monitor all marketplace orders and BNPL advances</p>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-value">{pagination.totalItems || 0}</div>
          <div className="stat-label">Total Orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatCurrency(totals.totalAmount)}</div>
          <div className="stat-label">Total Order Value</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatCurrency(totals.totalAdvanced)}</div>
          <div className="stat-label">Total Advanced (99%)</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-input"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            >
              <option value="">All Status</option>
              <option value="pending_payment">Pending Payment</option>
              <option value="paid">Paid</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Search</label>
            <input
              type="text"
              className="form-input"
              placeholder="Order number, customer..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Orders</h3>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total Amount</th>
                  <th>Advanced (99%)</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <strong>{order.orderNumber}</strong>
                    </td>
                    <td>
                      {order.customer ? 
                        `${order.customer.firstName} ${order.customer.lastName}` : 
                        `${order.customerInfo.firstName} ${order.customerInfo.lastName}`
                      }
                      <br />
                      <small style={{ color: '#718096' }}>
                        {order.customerInfo.email}
                      </small>
                    </td>
                    <td>
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      <br />
                      <small style={{ color: '#718096' }}>
                        {order.items.slice(0, 2).map(item => item.productName).join(', ')}
                        {order.items.length > 2 && ` +${order.items.length - 2} more`}
                      </small>
                    </td>
                    <td>{formatCurrency(order.totalAmount)}</td>
                    <td>{formatCurrency(order.payment?.bnpl?.advanceAmount || 0)}</td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {orders.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>
                No orders found
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '1rem', 
            padding: '1rem',
            borderTop: '1px solid #e2e8f0'
          }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.currentPage === 1}
              onClick={() => setFilters({ ...filters, page: pagination.currentPage - 1 })}
            >
              Previous
            </button>
            
            <span>
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => setFilters({ ...filters, page: pagination.currentPage + 1 })}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
