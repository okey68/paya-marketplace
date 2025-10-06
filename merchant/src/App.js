import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Components
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import AddProduct from './pages/AddProduct';
import MerchantOnboarding from './pages/MerchantOnboarding';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

// Styles
import './App.css';

// Protected Route component
const ProtectedRoute = ({ children }) => {
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
  
  return children;
};

function AppContent() {
  const { user } = useAuth();
  const location = window.location.pathname;
  const isLoginPage = location === '/login';

  return (
    <div className="App">
      {!isLoginPage && <Navbar />}
      <main className="main-content" style={isLoginPage ? { padding: 0 } : {}}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/products" 
            element={
              <ProtectedRoute>
                <Products />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/products/add" 
            element={
              <ProtectedRoute>
                <AddProduct />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/products/edit/:id" 
            element={
              <ProtectedRoute>
                <AddProduct />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/onboarding" 
            element={
              <ProtectedRoute>
                <MerchantOnboarding />
              </ProtectedRoute>
            } 
          />
          
          {/* Default redirects */}
          <Route 
            path="/" 
            element={
              user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      
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
