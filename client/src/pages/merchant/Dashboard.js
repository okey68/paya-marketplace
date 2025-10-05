import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const MerchantDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        axios.get('/merchants/stats'),
        axios.get('/orders/merchant/recent')
      ]);

      setStats(statsRes.data);
      setRecentOrders(ordersRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="merchant-dashboard">
        <div className="loading-spinner">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="merchant-dashboard">
      <div className="dashboard-header">
        <h1>Merchant Dashboard</h1>
        <p>Welcome back, {user?.businessInfo?.businessName || user?.fullName}!</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>{stats.totalProducts}</h3>
            <p>Total Products</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🛍️</div>
          <div className="stat-content">
            <h3>{stats.totalOrders}</h3>
            <p>Total Orders</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>KSh {stats.totalRevenue?.toLocaleString() || 0}</h3>
            <p>Total Revenue</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.pendingOrders}</h3>
            <p>Pending Orders</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button 
            className="btn btn-primary"
            onClick={() => window.location.href = '/merchant/products/add'}
          >
            + Add Product
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => window.location.href = '/merchant/products'}
          >
            Manage Products
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => window.location.href = '/merchant/orders'}
          >
            View Orders
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => window.location.href = '/merchant/settings'}
          >
            Settings
          </button>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="recent-orders">
        <h2>Recent Orders</h2>
        {recentOrders.length > 0 ? (
          <div className="orders-table">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Products</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order._id}>
                    <td>#{order._id.slice(-6)}</td>
                    <td>{order.customer?.fullName || 'N/A'}</td>
                    <td>{order.items?.length || 0} items</td>
                    <td>KSh {order.totalAmount?.toLocaleString()}</td>
                    <td>
                      <span className={`status-badge status-${order.status}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No recent orders found.</p>
            <p>Start by adding products to your store!</p>
          </div>
        )}
      </div>

      {/* Business Status */}
      {user?.businessInfo?.approvalStatus !== 'approved' && (
        <div className="business-status">
          <h2>Business Verification Status</h2>
          <div className={`status-card status-${user?.businessInfo?.approvalStatus}`}>
            {user?.businessInfo?.approvalStatus === 'pending' && (
              <>
                <div className="status-icon">⏳</div>
                <div className="status-content">
                  <h3>Verification Pending</h3>
                  <p>Your business documents are under review. This typically takes 1-3 business days.</p>
                </div>
              </>
            )}
            {user?.businessInfo?.approvalStatus === 'rejected' && (
              <>
                <div className="status-icon">❌</div>
                <div className="status-content">
                  <h3>Verification Rejected</h3>
                  <p>Please update your business information and resubmit for approval.</p>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => window.location.href = '/merchant/onboarding'}
                  >
                    Update Information
                  </button>
                </div>
              </>
            )}
            {!user?.businessInfo?.approvalStatus && (
              <>
                <div className="status-icon">📋</div>
                <div className="status-content">
                  <h3>Complete Your Profile</h3>
                  <p>Complete your merchant onboarding to start selling on Paya Marketplace.</p>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => window.location.href = '/merchant/onboarding'}
                  >
                    Complete Onboarding
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantDashboard;
