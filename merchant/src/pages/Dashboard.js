import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MerchantDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [timeFilter, setTimeFilter] = useState(() => {
    // Get saved filter from sessionStorage, default to '1W'
    return sessionStorage.getItem('chartTimeFilter') || '1W';
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    // Update chart data when time filter changes
    if (allOrders.length > 0) {
      processChartData(allOrders, timeFilter);
    }
  }, [timeFilter, allOrders]);

  const getDateRangeInDays = (filter) => {
    switch (filter) {
      case '1W': return 7;
      case '1M': return 30;
      case '3M': return 90;
      case '6M': return 180;
      case '1Y': return 365;
      default: return 7;
    }
  };

  const processChartData = (orders, filter) => {
    const daysToShow = getDateRangeInDays(filter);
    const now = new Date();
    const startDate = new Date(now.getTime() - (daysToShow * 24 * 60 * 60 * 1000));
    
    // Filter orders within date range
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate;
    });

    // Group by date
    const chartDataMap = {};
    filteredOrders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const date = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!chartDataMap[date]) {
        chartDataMap[date] = { date, orders: 0, revenue: 0, timestamp: orderDate.getTime() };
      }
      chartDataMap[date].orders += 1;
      // Only count revenue from paid orders
      if (order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered') {
        chartDataMap[date].revenue += order.totalAmount || 0;
      }
    });
    
    // Sort by timestamp (oldest to newest)
    const sortedChartData = Object.values(chartDataMap).sort((a, b) => a.timestamp - b.timestamp);
    setChartData(sortedChartData);
  };

  const handleTimeFilterChange = (filter) => {
    setTimeFilter(filter);
    sessionStorage.setItem('chartTimeFilter', filter);
  };

  const getStatusDisplay = (status) => {
    const statusMap = {
      'pending': 'Pending',
      'pending_payment': 'Pending Payment',
      'paid': 'Paid',
      'processing': 'Processing',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
      'refunded': 'Refunded',
      'rejected': 'Rejected'
    };
    return statusMap[status] || status;
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch products to calculate stats
      const productsRes = await api.get('/products/merchant/my-products');
      const products = productsRes.data.products || productsRes.data || [];
      
      // Try to fetch orders
      try {
        const ordersRes = await api.get('/orders/merchant/orders');
        const orders = ordersRes.data.orders || [];
        
        // Calculate stats from orders
        const totalOrders = orders.length;
        // Only count revenue from paid orders
        const totalRevenue = orders
          .filter(order => order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered')
          .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const pendingOrders = orders.filter(order => 
          order.status === 'pending' || order.status === 'processing'
        ).length;
        
        setStats({
          totalProducts: products.length,
          totalOrders,
          totalRevenue,
          pendingOrders
        });
        
        // Set recent orders (limit to 5)
        setRecentOrders(orders.slice(0, 5));
        
        // Store all orders for filtering
        setAllOrders(orders);
        
        // Process chart data with current time filter
        processChartData(orders, timeFilter);
      } catch (orderError) {
        // Orders endpoint not available yet, that's okay
        setStats({
          totalProducts: products.length,
          totalOrders: 0,
          totalRevenue: 0,
          pendingOrders: 0
        });
        setRecentOrders([]);
        setAllOrders([]);
        setChartData([]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Don't show error toast, just set defaults
      setStats({
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0
      });
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
        <div className="header-content">
          <div>
            <h1>Merchant Dashboard</h1>
            <p>Welcome back, {user?.businessInfo?.businessName || user?.fullName}!</p>
          </div>
          <button 
            className="btn btn-primary add-product-btn"
            onClick={() => window.location.href = '/products/add'}
          >
            + Add New Product
          </button>
        </div>
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
            <h3>KES {Math.floor((stats.totalRevenue || 0) * 0.99).toLocaleString()}</h3>
            <p>Revenue</p>
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

      {/* Orders & Revenue Chart */}
      {chartData.length > 0 && (
        <div className="chart-section">
          <div className="section-header">
            <h2>Orders & Revenue Overview</h2>
            <div className="time-filter-buttons">
              <button 
                className={`time-filter-btn ${timeFilter === '1W' ? 'active' : ''}`}
                onClick={() => handleTimeFilterChange('1W')}
              >
                Week
              </button>
              <button 
                className={`time-filter-btn ${timeFilter === '1M' ? 'active' : ''}`}
                onClick={() => handleTimeFilterChange('1M')}
              >
                Month
              </button>
              <button 
                className={`time-filter-btn ${timeFilter === '3M' ? 'active' : ''}`}
                onClick={() => handleTimeFilterChange('3M')}
              >
                3 Months
              </button>
              <button 
                className={`time-filter-btn ${timeFilter === '6M' ? 'active' : ''}`}
                onClick={() => handleTimeFilterChange('6M')}
              >
                6 Months
              </button>
              <button 
                className={`time-filter-btn ${timeFilter === '1Y' ? 'active' : ''}`}
                onClick={() => handleTimeFilterChange('1Y')}
              >
                Year
              </button>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af"
                  tick={{ fill: '#6b7280', fontSize: 13, fontWeight: 500 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="#9ca3af"
                  tick={{ fill: '#6b7280', fontSize: 13, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  label={{ 
                    value: 'Orders', 
                    angle: -90, 
                    position: 'insideLeft', 
                    style: { 
                      fontSize: '13px', 
                      fontWeight: 600,
                      fill: '#6b7280',
                      textAnchor: 'middle'
                    } 
                  }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#9ca3af"
                  tick={{ fill: '#6b7280', fontSize: 13, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  label={{ 
                    value: 'Revenue (KES)', 
                    angle: 90, 
                    position: 'insideRight', 
                    style: { 
                      fontSize: '13px', 
                      fontWeight: 600,
                      fill: '#6b7280',
                      textAnchor: 'middle'
                    } 
                  }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}
                  labelStyle={{
                    color: '#111827',
                    fontWeight: 600,
                    fontSize: '14px',
                    marginBottom: '8px'
                  }}
                  itemStyle={{
                    color: '#6b7280',
                    fontSize: '13px',
                    fontWeight: 500,
                    padding: '2px 0'
                  }}
                  formatter={(value, name) => {
                    if (name === 'Revenue') {
                      return [`KES ${value.toLocaleString()}`, name];
                    }
                    return [value, name];
                  }}
                  cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                />
                <Legend 
                  wrapperStyle={{ 
                    paddingTop: '10px',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                  iconType="circle"
                  iconSize={10}
                />
                <Bar 
                  yAxisId="left"
                  dataKey="orders" 
                  fill="#6366f1" 
                  name="Orders"
                  radius={[8, 8, 0, 0]}
                  barSize={40}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  name="Revenue"
                  dot={{ fill: '#10b981', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="recent-orders">
        <div className="section-header">
          <h2>Recent Orders</h2>
          <button 
            className="btn btn-primary view-all-btn"
            onClick={() => window.location.href = '/orders'}
          >
            View All Orders
          </button>
        </div>
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
                    <td>{order.orderNumber}</td>
                    <td>{order.customer?.fullName || 'N/A'}</td>
                    <td>{order.items?.length || 0} items</td>
                    <td>KES {order.totalAmount?.toLocaleString()}</td>
                    <td>
                      <span className={`status-badge status-${order.status}`}>
                        {getStatusDisplay(order.status)}
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
            <div className="empty-icon">📦</div>
            <h3>No Orders Found</h3>
            <p>You haven't received any orders yet.</p>
            <p>Orders will appear here when customers purchase your products.</p>
            {stats.totalProducts === 0 && (
              <button 
                className="btn btn-primary cta-button"
                onClick={() => window.location.href = '/products'}
              >
                📦 Add Products
              </button>
            )}
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
                    onClick={() => window.location.href = '/onboarding'}
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
                    onClick={() => window.location.href = '/onboarding'}
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
