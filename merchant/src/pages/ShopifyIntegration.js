import React, { useState, useEffect } from 'react';
import {
  AppProvider,
  Button,
  TextField,
  Spinner,
  Frame,
} from '@shopify/polaris';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './ShopifyIntegration.css';

const ShopifyIntegration = () => {
  const [step, setStep] = useState('connect'); // connect, importing, success
  const [shopifyStore, setShopifyStore] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importStats, setImportStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkShopifyConnection();
  }, []);

  const checkShopifyConnection = async () => {
    try {
      const response = await api.get('/integrations/shopify/status');
      if (response.data.connected) {
        setIsConnected(true);
        setShopifyStore(response.data.storeName);
      }
    } catch (error) {
      console.log('No Shopify connection found');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectShopify = async () => {
    if (!shopifyStore.trim()) {
      toast.error('Please enter your Shopify store name');
      return;
    }

    try {
      // Request OAuth URL from backend
      const shop = shopifyStore.includes('.myshopify.com') 
        ? shopifyStore 
        : `${shopifyStore}.myshopify.com`;

      const response = await api.post('/integrations/shopify/auth-url', { shop });
      
      // Redirect to Shopify OAuth page
      window.location.href = response.data.authUrl;
    } catch (error) {
      console.error('Error connecting to Shopify:', error);
      toast.error(error.response?.data?.message || 'Failed to connect to Shopify');
    }
  };

  const handleImportProducts = async () => {
    setImporting(true);
    setStep('importing');

    try {
      const response = await api.post('/integrations/shopify/import-products');
      
      setImportStats({
        imported: response.data.imported || 0,
        updated: response.data.updated || 0,
        failed: response.data.failed || 0,
        total: response.data.total || 0
      });

      setStep('success');
      toast.success(`Successfully imported ${response.data.imported} products!`);
    } catch (error) {
      console.error('Error importing products:', error);
      toast.error(error.response?.data?.message || 'Failed to import products');
      setStep('connect');
    } finally {
      setImporting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect your Shopify store?')) {
      return;
    }

    try {
      await api.post('/integrations/shopify/disconnect');
      setIsConnected(false);
      setShopifyStore('');
      setStep('connect');
      toast.success('Shopify store disconnected');
    } catch (error) {
      console.error('Error disconnecting Shopify:', error);
      toast.error('Failed to disconnect Shopify store');
    }
  };

  if (loading) {
    return (
      <div className="shopify-integration-page">
        <div className="loading-container">
          <Spinner size="large" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AppProvider
      i18n={{
        Polaris: {
          Common: {
            checkbox: 'checkbox',
          },
        },
      }}
    >
      {/* <Frame> */}
        <div className="shopify-integration-page">
          <div className="shopify-container">
            
            {/* Not Connected State */}
            {step === 'connect' && !isConnected && (
              <div className="shopify-content">
                <div className="shopify-header">
                  <div className="shopify-icon-wrapper">
                    <svg viewBox="0 0 128 128" className="shopify-icon">
                      <path fill="#95BF47" d="M114.85 23.14c-.11-.28-.29-.42-.53-.42-.24 0-11.33-.15-11.33-.15s-9.62-9.34-10.61-10.33c-.99-.99-2.93-.71-3.68-.47 0 0-1.85.57-4.96 1.52-.21-6.59-5.21-12.65-11.25-12.65-.11 0-.22.01-.33.01-.59-.78-1.32-1.12-2.11-1.12-5.27 0-7.77 6.6-8.56 9.94-2.74.85-4.69 1.45-4.93 1.53-1.54.47-1.59.53-1.79 1.96-.15 1.08-4.09 31.59-4.09 31.59L27.38 54.72l87.47 16.42s-9.88-60.63-10.01-61.17z"/>
                      <path fill="#5E8E3E" d="M114.32 23.56c-.24 0-11.33-.15-11.33-.15s-9.62-9.34-10.61-10.33c-.38-.38-1.02-.6-1.67-.66v91.32l34.35-8.12s-9.88-60.63-10.01-61.17c-.11-.28-.29-.42-.53-.42-.05 0-.12 0-.2.13z"/>
                      <path fill="#FFFFFF" d="M80.79 34.15l-3.68 10.95s-3.35-1.52-7.38-1.52c-5.94 0-6.24 3.72-6.24 4.65 0 5.11 13.38 7.06 13.38 19.03 0 9.42-5.97 15.48-14.03 15.48-9.68 0-14.63-6.03-14.63-6.03l2.59-8.56s5.07 4.37 9.33 4.37c2.78 0 3.92-2.2 3.92-3.8 0-6.64-10.96-6.94-10.96-17.91 0-9.21 6.61-18.15 19.97-18.15 5.11 0 7.73 1.49 7.73 1.49z"/>
                    </svg>
                  </div>
                  <h1 className="shopify-title">Connect Your Shopify Store</h1>
                  <p className="shopify-subtitle">Import all your products to Paya Marketplace in just a few clicks</p>
                </div>

                <div className="shopify-form-card">
                  <div className="form-section">
                    <TextField
                      label="Shopify Store Name"
                      value={shopifyStore}
                      onChange={setShopifyStore}
                      placeholder="your-store-name"
                      suffix=".myshopify.com"
                      helpText="Enter your Shopify store name (e.g., 'my-awesome-store')"
                      autoComplete="off"
                      sx={{ width: '100%' }}
                    />
                  </div>

                  <div className="connect-button-wrapper">
                    <Button
                      primary
                      size="large"
                      onClick={handleConnectShopify}
                      disabled={!shopifyStore.trim()}
                    >
                      Connect to Shopify
                    </Button>
                  </div>
                </div>

                <div className="shopify-features-grid">
                  <div className="feature-card">
                    <div className="feature-icon">🔒</div>
                    <h3>Secure Connection</h3>
                    <p>OAuth 2.0 authentication ensures your data is safe and secure</p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">⚡</div>
                    <h3>Quick Import</h3>
                    <p>Import all your products in seconds with one click</p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">🔄</div>
                    <h3>Auto Sync</h3>
                    <p>Keep your products updated across both platforms</p>
                  </div>
                </div>

                <div className="shopify-info-grid">
                  <div className="info-card">
                    <h3>📋 What We'll Import</h3>
                    <ul className="info-list">
                      <li>✓ Product names & descriptions</li>
                      <li>✓ Prices & currencies</li>
                      <li>✓ Product images</li>
                      <li>✓ Inventory quantities</li>
                      <li>✓ SKUs & variants</li>
                      <li>✓ Categories & tags</li>
                    </ul>
                  </div>

                  <div className="info-card">
                    <h3>🔐 Permissions Required</h3>
                    <p className="info-text">
                      We only request <strong>read-only</strong> access to your products. 
                      We cannot modify or delete anything in your Shopify store.
                    </p>
                  </div>

                  <div className="info-card steps-card">
                    <h3>🚀 How It Works</h3>
                    <div className="steps-list">
                      <div className="step-item">
                        <span className="step-number">1</span>
                        <span>Enter your store name above</span>
                      </div>
                      <div className="step-item">
                        <span className="step-number">2</span>
                        <span>Click "Connect to Shopify"</span>
                      </div>
                      <div className="step-item">
                        <span className="step-number">3</span>
                        <span>Log in to your Shopify account</span>
                      </div>
                      <div className="step-item">
                        <span className="step-number">4</span>
                        <span>Approve the connection</span>
                      </div>
                      <div className="step-item">
                        <span className="step-number">5</span>
                        <span>Import your products!</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Connected State */}
            {step === 'connect' && isConnected && (
              <div className="shopify-content connected-view">
                <div className="success-header">
                  <div className="success-icon-large">✓</div>
                  <h1 className="success-title-main">Connected to Shopify!</h1>
                  <p className="success-store-name">{shopifyStore}.myshopify.com</p>
                </div>

                <div className="connected-banner">
                  <div className="banner-icon">🎉</div>
                  <div className="banner-content">
                    <h3>Your store is successfully connected</h3>
                    <p>You can now import all your products from Shopify with a single click.</p>
                  </div>
                </div>

                <div className="action-cards">
                  <div className="action-card primary-action">
                    <div className="action-icon">🚀</div>
                    <h3>Import Products</h3>
                    <p>Sync your product catalog to Paya Marketplace</p>
                    <Button
                      primary
                      size="large"
                      onClick={handleImportProducts}
                      loading={importing}
                    >
                      Import Products Now
                    </Button>
                  </div>

                  <div className="action-card secondary-action">
                    <div className="action-icon">🔌</div>
                    <h3>Disconnect Store</h3>
                    <p>Remove the connection to your Shopify store</p>
                    <Button
                      size="large"
                      onClick={handleDisconnect}
                      destructive
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Importing State */}
            {step === 'importing' && (
              <div className="shopify-content importing-view">
                <div className="importing-animation">
                  <Spinner size="large" />
                  <div className="importing-dots">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                </div>
                <h1 className="importing-title">Importing Your Products...</h1>
                <p className="importing-subtitle">
                  Please wait while we securely import your products from Shopify.
                </p>
                <div className="importing-info-box">
                  <p>⏱️ This may take a few moments depending on your product count</p>
                  <p>🔄 Do not close this window</p>
                </div>
              </div>
            )}

            {/* Success State */}
            {step === 'success' && importStats && (
              <div className="shopify-content success-view">
                <div className="success-animation-large">
                  <div className="checkmark-circle">✓</div>
                </div>
                <h1 className="success-title-large">Import Complete! 🎉</h1>

                <div className="import-stats-grid">
                  <div className="stat-card stat-imported">
                    <div className="stat-number">{importStats.imported}</div>
                    <div className="stat-label">New Products</div>
                  </div>
                  <div className="stat-card stat-updated">
                    <div className="stat-number">{importStats.updated}</div>
                    <div className="stat-label">Updated</div>
                  </div>
                  {importStats.failed > 0 && (
                    <div className="stat-card stat-failed">
                      <div className="stat-number">{importStats.failed}</div>
                      <div className="stat-label">Failed</div>
                    </div>
                  )}
                </div>

                <div className="success-message-box">
                  <p>Your products have been successfully imported to Paya Marketplace!</p>
                  <p>You can now start selling on our platform.</p>
                </div>

                <div className="success-actions">
                  <Button
                    primary
                    size="large"
                    onClick={() => window.location.href = '/products'}
                  >
                    View My Products
                  </Button>
                  <Button
                    size="large"
                    onClick={() => setStep('connect')}
                  >
                    Import More
                  </Button>
                </div>
              </div>
            )}

          </div>
        </div>
      {/* </Frame> */}
    </AppProvider>
  );
};

export default ShopifyIntegration;
