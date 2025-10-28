import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // API configuration is handled in utils/api.js

  // Define logout function first so it can be used in interceptor
  const logout = React.useCallback(() => {
    localStorage.removeItem('merchantToken');
    setUser(null);
  }, []);

  // API interceptors are handled in utils/api.js

  const checkAuthStatus = React.useCallback(async () => {
    const token = localStorage.getItem('merchantToken');
    if (!token) {
      setLoading(false);
      return;
    }

    // Token is automatically included by api interceptor
    try {
      const response = await api.get('/auth/me');
      if (response.data.user && response.data.user.role === 'merchant') {
        setUser(response.data.user);
      } else {
        // Invalid role, clear token
        localStorage.removeItem('merchantToken');
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // If token is invalid, clear it
      if (error.response?.status === 401) {
        localStorage.removeItem('merchantToken');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []); // Remove checkAuthStatus dependency to prevent re-runs

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });

      const { token, user: userData } = response.data;

      if (userData.role !== 'merchant') {
        throw new Error('Access denied. Merchant account required.');
      }

      localStorage.setItem('merchantToken', token);
      // Token is automatically included by api interceptor
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Login failed'
      };
    }
  };

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
