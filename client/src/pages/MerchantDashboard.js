import React from 'react';
import { Routes, Route } from 'react-router-dom';

const MerchantDashboard = () => {
  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <h1>Merchant Dashboard</h1>
      <p>Products, Orders, and Settings management - Coming Soon!</p>
      
      <Routes>
        <Route path="/" element={
          <div>
            <h2>Dashboard Overview</h2>
            <p>Sales analytics and quick actions</p>
          </div>
        } />
        <Route path="/products" element={
          <div>
            <h2>Products</h2>
            <p>Manage your product catalog</p>
          </div>
        } />
        <Route path="/orders" element={
          <div>
            <h2>Orders</h2>
            <p>View and fulfill customer orders</p>
          </div>
        } />
        <Route path="/settings" element={
          <div>
            <h2>Settings</h2>
            <p>Business information and preferences</p>
          </div>
        } />
      </Routes>
    </div>
  );
};

export default MerchantDashboard;
