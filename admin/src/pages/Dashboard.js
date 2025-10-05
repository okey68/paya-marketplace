import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/admin/stats?period=${period}`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
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

  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Paya Marketplace Overview</p>
        
        <div style={{ marginTop: '1rem' }}>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="form-input"
            style={{ width: 'auto', display: 'inline-block' }}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="6m">Last 6 months</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.overview.totalUsers}</div>
          <div className="stat-label">Total Users</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{stats.overview.approvedMerchants}</div>
          <div className="stat-label">Active Merchants</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{stats.overview.totalProducts}</div>
          <div className="stat-label">Products Listed</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{stats.overview.recentOrders}</div>
          <div className="stat-label">Recent Orders</div>
        </div>
      </div>

      {/* Financial Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{formatCurrency(stats.financial.totalRevenue)}</div>
          <div className="stat-label">Total Revenue ({period})</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{formatCurrency(stats.financial.totalAdvanced)}</div>
          <div className="stat-label">Total Advanced</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{formatCurrency(stats.financial.averageOrderValue)}</div>
          <div className="stat-label">Avg Order Value</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{formatPercentage(stats.financial.advanceRate)}</div>
          <div className="stat-label">Advance Rate</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Recent Users */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Users</h3>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      {user.role === 'merchant' && user.businessInfo?.businessName 
                        ? user.businessInfo.businessName 
                        : `${user.firstName} ${user.lastName}`}
                    </td>
                    <td>
                      <span className={`badge ${
                        user.role === 'merchant' ? 'badge-info' : 
                        user.role === 'admin' ? 'badge-danger' : 'badge-success'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Orders</h3>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.orders.map((order) => (
                  <tr key={order._id}>
                    <td>{order.orderNumber}</td>
                    <td>{order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'N/A'}</td>
                    <td>{formatCurrency(order.totalAmount)}</td>
                    <td>
                      <span className={`badge ${
                        order.status === 'delivered' ? 'badge-success' :
                        order.status === 'shipped' ? 'badge-info' :
                        order.status === 'processing' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Merchant Status */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Merchant Status Overview</h3>
        </div>
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="stat-card">
            <div className="stat-value">{stats.overview.pendingMerchants}</div>
            <div className="stat-label">Pending Approval</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.overview.approvedMerchants}</div>
            <div className="stat-label">Approved</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.overview.totalMerchants - stats.overview.approvedMerchants - stats.overview.pendingMerchants}</div>
            <div className="stat-label">Rejected</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
