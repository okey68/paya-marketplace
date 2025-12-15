import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

// Components
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Merchants from './pages/Merchants';
import MerchantDetail from './pages/MerchantDetail';
import Orders from './pages/Orders';
import AdminOrderDetail from './pages/AdminOrderDetail';
import Products from './pages/Products';
import Users from './pages/Users';
import Model from './pages/Model';
import Support from './pages/Support';
import HRVerifications from './pages/HRVerifications';
import HRVerificationDetail from './pages/HRVerificationDetail';
import CDLCompanies from './pages/CDLCompanies';

// Configure axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setLoading(false);
        return;
      }

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const response = await axios.get('/auth/verify');
      if (response.data.valid && response.data.user.role === 'admin') {
        setIsAuthenticated(true);
        setUser(response.data.user);
      } else {
        localStorage.removeItem('adminToken');
        delete axios.defaults.headers.common['Authorization'];
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('adminToken');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      
      if (response.data.user.role !== 'admin') {
        throw new Error('Admin access required');
      }

      const { token, user } = response.data;
      
      localStorage.setItem('adminToken', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setIsAuthenticated(true);
      setUser(user);
      
      toast.success('Login successful');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setUser(null);
    toast.success('Logged out successfully');
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="admin-container">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/merchants" element={<Merchants />} />
          <Route path="/merchants/:id" element={<MerchantDetail />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<AdminOrderDetail />} />
          <Route path="/products" element={<Products />} />
          <Route path="/users" element={<Users />} />
          <Route path="/model" element={<Model />} />
          <Route path="/support" element={<Support />} />
          <Route path="/hr-verifications" element={<HRVerifications />} />
          <Route path="/hr-verifications/:id" element={<HRVerificationDetail />} />
          <Route path="/cdl-companies" element={<CDLCompanies />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
