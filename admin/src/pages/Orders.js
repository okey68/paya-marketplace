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

  const getFullName = (customer, customerInfo) => {
    if (customer) {
      return `${customer.firstName}${customer.middleName ? ' ' + customer.middleName : ''} ${customer.lastName}`;
    }
    return `${customerInfo?.firstName || ''}${customerInfo?.middleName ? ' ' + customerInfo.middleName : ''} ${customerInfo?.lastName || ''}`.trim();
  };

  const downloadCSV = () => {
    const headers = ['Customer', 'Email', 'National ID', 'Merchant', 'Order Number', 'Total Amount', 'Advanced (99%)', 'Status', 'Date'];
    const rows = orders.map(order => [
      getFullName(order.customer, order.customerInfo),
      order.customerInfo.email,
      order.customerInfo?.nationalId || order.customer?.nationalId || '',
      order.items && order.items.length > 0 && order.items[0].merchant ? order.items[0].merchant.businessInfo?.businessName || 'Unknown' : 'Unknown',
      order.orderNumber,
      order.totalAmount,
      Math.floor(order.totalAmount * 0.99),
      order.status,
      new Date(order.createdAt).toLocaleDateString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending_payment: { class: 'badge-warning', label: 'Pending Payment' },
      underwriting: { class: 'badge-info', label: 'Underwriting' },
      approved: { class: 'badge-success', label: 'Approved' },
      rejected: { class: 'badge-danger', label: 'Rejected' },
      paid: { class: 'badge-success', label: 'Paid' },
      processing: { class: 'badge-info', label: 'Processing' },
      shipped: { class: 'badge-warning', label: 'Shipped' },
      delivered: { class: 'badge-success', label: 'Delivered' },
      cancelled: { class: 'badge-danger', label: 'Cancelled' },
      refunded: { class: 'badge-warning', label: 'Refunded' }
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
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-value">{pagination.totalItems || 0}</div>
            <div className="stat-label">Total Orders</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(totals.totalAmount || 0)}</div>
            <div className="stat-label">Total Order Value</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(totals.totalAdvanced || 0)}</div>
            <div className="stat-label">Total Advanced (99%)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(totals.totalRemitted || 0)}</div>
            <div className="stat-label">Remitted</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(totals.totalOutstanding || 0)}</div>
            <div className="stat-label">Outstanding</div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
          <h3 className="card-title" style={{ margin: 0, marginBottom: '0.5rem' }}>Orders</h3>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ margin: 0, width: '150px' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Status</label>
              <select
                className="form-input"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                style={{ padding: '0.5rem', height: '36px' }}
              >
                <option value="">All Status</option>
                <option value="pending_payment">Pending Payment</option>
                <option value="underwriting">Underwriting</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="paid">Paid</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div className="form-group" style={{ margin: 0, width: '300px' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Search</label>
              <input
                type="text"
                className="form-input"
                placeholder="Order number, customer..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                style={{ padding: '0.5rem', height: '36px' }}
              />
            </div>
          </div>
          
          <button 
            onClick={downloadCSV}
            style={{ 
              marginLeft: 'auto',
              marginBottom: '0.5rem',
              padding: '0.5rem',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px'
            }}
            title="Download CSV"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#718096" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
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
                  <th>Customer</th>
                  <th>Order #</th>
                  <th>Total Amount</th>
                  <th>Advanced (99%)</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: '500' }}>
                          {getFullName(order.customer, order.customerInfo)}
                        </div>
                        <small style={{ color: '#718096', fontSize: '0.75rem' }}>
                          {order.customerInfo.email}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: '500' }}>
                          {order.items && order.items.length > 0 && order.items[0].merchant ? 
                            order.items[0].merchant.businessInfo?.businessName || 'Unknown Merchant' : 
                            'Unknown Merchant'
                          }
                        </div>
                        <small style={{ color: '#718096', fontSize: '0.75rem' }}>
                          {order.orderNumber}
                        </small>
                      </div>
                    </td>
                    <td>{formatCurrency(order.totalAmount)}</td>
                    <td>{formatCurrency(Math.floor(order.totalAmount * 0.99))}</td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => window.location.href = `/orders/${order._id}`}
                      >
                        View
                      </button>
                    </td>
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
