import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [timeFilter, setTimeFilter] = useState(() => {
    return sessionStorage.getItem('adminChartTimeFilter') || '1M';
  });

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (allOrders.length > 0) {
      processChartData(allOrders);
    }
  }, [timeFilter, allOrders]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/stats');
      setStats(response.data);
      
      // Fetch all orders for chart
      const ordersResponse = await axios.get('/admin/orders');
      const orders = ordersResponse.data.orders || [];
      setAllOrders(orders);
      processChartData(orders);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (orders) => {
    // Calculate date range based on filter
    const now = new Date();
    let startDate = new Date();
    
    switch(timeFilter) {
      case '1W':
        startDate.setDate(now.getDate() - 7);
        break;
      case '1M':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6M':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1Y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }
    
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
      chartDataMap[date].revenue += order.totalAmount || 0;
    });
    
    // Sort by timestamp (oldest to newest)
    const sortedChartData = Object.values(chartDataMap).sort((a, b) => a.timestamp - b.timestamp);
    setChartData(sortedChartData);
  };

  const handleTimeFilterChange = (filter) => {
    setTimeFilter(filter);
    sessionStorage.setItem('adminChartTimeFilter', filter);
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
      {/* KPI Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏪</div>
          <div className="stat-content">
            <div className="stat-value">{stats.overview.approvedMerchants}</div>
            <div className="stat-label">Active Merchants</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <div className="stat-value">{stats.overview.totalProducts}</div>
            <div className="stat-label">Products Listed</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🛒</div>
          <div className="stat-content">
            <div className="stat-value">{stats.overview.recentOrders}</div>
            <div className="stat-label">Recent Orders</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(stats.financial.totalRevenue)}</div>
            <div className="stat-label">Total Revenue (7D)</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💵</div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(stats.financial.totalAdvanced)}</div>
            <div className="stat-label">Total Advanced</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(stats.financial.averageOrderValue)}</div>
            <div className="stat-label">Avg Order Value</div>
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
                        order.status === 'paid' || order.status === 'approved' || order.status === 'delivered' ? 'badge-success' :
                        order.status === 'underwriting' || order.status === 'processing' || order.status === 'shipped' ? 'badge-info' :
                        order.status === 'rejected' || order.status === 'cancelled' ? 'badge-danger' :
                        'badge-warning'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
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
