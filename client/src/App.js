import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import Merchants from './pages/Merchants';
import MerchantDetail from './pages/MerchantDetail';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderComplete from './pages/OrderComplete';
import Login from './pages/Login';
import Register from './pages/Register';
import Support from './pages/Support';
import MerchantOnboarding from './pages/MerchantOnboarding';
import MerchantDashboard from './pages/MerchantDashboard';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import Wishlist from './pages/Wishlist';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Styles
import './App.css';

// API configuration is handled in utils/api.js

// Protected Route component
const ProtectedRoute = ({ children, requiredRole = null, requireRole = null }) => {
  const { user, loading } = useAuth();
  const role = requiredRole || requireRole;
  
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
  
  if (role && user.role !== role) {
    toast.error('Access denied');
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function AppContent() {

  return (
    <CartProvider>
      <div className="App">
        <Navbar />
        <main className="main-content">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/merchants" element={<Merchants />} />
            <Route path="/merchants/:id" element={<MerchantDetail />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/support" element={<Support />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/merchant-onboarding" element={<MerchantOnboarding />} />
            
            {/* Checkout Route - Allow guest checkout for BNPL */}
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-complete" element={<OrderComplete />} />
            <Route 
              path="/order-complete/:orderId" 
              element={
                <ProtectedRoute requiredRole="customer">
                  <OrderComplete />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected Routes - Require Authentication */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute>
                  <Wishlist />
                </ProtectedRoute>
              }
            />
            <Route
              path="/merchant/dashboard"
              element={
                <ProtectedRoute requireRole="merchant">
                  <MerchantDashboard />
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