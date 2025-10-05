import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderComplete from './pages/OrderComplete';
import Login from './pages/Login';
import Register from './pages/Register';
// Merchant components moved to separate merchant portal

// Context
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Styles
import './App.css';

// Configure axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Protected Route component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user.role !== requiredRole) {
    toast.error('Access denied');
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function AppContent() {
  const { user } = useAuth();

  return (
    <CartProvider>
      <div className="App">
        <Navbar />
        <main className="main-content">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Checkout Route - Allow guest checkout for BNPL */}
            <Route path="/checkout" element={<Checkout />} />
            <Route 
              path="/order-complete/:orderId" 
              element={
                <ProtectedRoute requiredRole="customer">
                  <OrderComplete />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
        
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#333',
              color: '#fff',
            },
          }}
        />
      </div>
    </CartProvider>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
