import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import theme from './theme/theme';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderComplete from './pages/OrderComplete';
import Login from './pages/Login';
import Register from './pages/Register';
import Merchants from './pages/Merchants';
import MerchantDetail from './pages/MerchantDetail';
import MerchantOnboarding from './pages/MerchantOnboarding';
import MerchantDashboard from './pages/MerchantDashboard';
import './App.css';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <CartProvider>
            <div className="App">
              <Navbar />
              <main style={{ paddingTop: '64px' }}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/marketplace" element={<Marketplace />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/order-complete" element={<OrderComplete />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/merchants" element={<Merchants />} />
                  <Route path="/merchant-onboarding" element={<MerchantOnboarding />} />
                  <Route path="/merchant/dashboard" element={<MerchantDashboard />} />
                  <Route path="/merchants/:id" element={<MerchantDetail />} />
                </Routes>
              </main>
              <Footer />
              <Toaster position="top-right" />
            </div>
          </CartProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
