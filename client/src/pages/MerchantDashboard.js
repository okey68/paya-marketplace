import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Dashboard from './merchant/Dashboard';
import Products from './merchant/Products';
import AddProduct from './merchant/AddProduct';

const MerchantDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Redirect if not a merchant
  if (!user || user.role !== 'merchant') {
    return (
      <div className="container" style={{ padding: '2rem 0', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>You need to be a verified merchant to access this dashboard.</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'products':
        return <Products />;
      case 'add-product':
        return <AddProduct onSuccess={() => setActiveTab('products')} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="merchant-dashboard-container">
      {/* Navigation Tabs */}
      <div className="merchant-nav" style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '1rem 0',
        marginBottom: '2rem'
      }}>
        <div className="container">
          <div style={{ display: 'flex', gap: '2rem' }}>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                borderBottom: activeTab === 'dashboard' ? '2px solid #667eea' : '2px solid transparent',
                color: activeTab === 'dashboard' ? '#667eea' : '#4a5568'
              }}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`nav-tab ${activeTab === 'products' ? 'active' : ''}`}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                borderBottom: activeTab === 'products' ? '2px solid #667eea' : '2px solid transparent',
                color: activeTab === 'products' ? '#667eea' : '#4a5568'
              }}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab('add-product')}
              className={`nav-tab ${activeTab === 'add-product' ? 'active' : ''}`}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                borderBottom: activeTab === 'add-product' ? '2px solid #667eea' : '2px solid transparent',
                color: activeTab === 'add-product' ? '#667eea' : '#4a5568'
              }}
            >
              Add Product
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container">
        {renderContent()}
      </div>
    </div>
  );
};

export default MerchantDashboard;
