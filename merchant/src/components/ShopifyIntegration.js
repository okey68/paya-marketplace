import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const ShopifyIntegration = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState('connect'); // connect, importing, success
  const [shopifyStore, setShopifyStore] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importStats, setImportStats] = useState(null);

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
      
      // Call onSuccess callback after a delay
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 2000);
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
      toast.success('Shopify store disconnected');
    } catch (error) {
      console.error('Error disconnecting Shopify:', error);
      toast.error('Failed to disconnect Shopify store');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content shopify-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🛍️ Connect Shopify Store</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {step === 'connect' && (
            <>
              {!isConnected ? (
                <>
                  <p className="modal-description">
                    Connect your Shopify store to import all your products to Paya Marketplace.
                  </p>

                  <div className="shopify-connect-section">
                    <div className="form-group">
                      <label>Shopify Store Name</label>
                      <div className="shopify-input-group">
                        <input
                          type="text"
                          placeholder="your-store-name"
                          value={shopifyStore}
                          onChange={(e) => setShopifyStore(e.target.value)}
                          className="shopify-store-input"
                          onKeyPress={(e) => e.key === 'Enter' && handleConnectShopify()}
                        />
                        <span className="shopify-domain">.myshopify.com</span>
                      </div>
                      <small>Enter your Shopify store name (e.g., "my-awesome-store")</small>
                    </div>

                    <div className="shopify-info-box">
                      <h4>🔐 What you'll authorize:</h4>
                      <p style={{ marginBottom: '0.75rem', color: '#6c757d', fontSize: '0.9rem' }}>
                        After clicking "Connect to Shopify", you'll be asked to log in to your Shopify store and authorize Paya to access:
                      </p>
                      <ul>
                        <li>✅ Product names & descriptions</li>
                        <li>✅ Prices</li>
                        <li>✅ Images</li>
                        <li>✅ Inventory quantities</li>
                        <li>✅ SKUs</li>
                        <li>✅ Categories & tags</li>
                        <li>✅ Active/inactive status</li>
                      </ul>
                      <p style={{ marginTop: '0.75rem', color: '#96bf48', fontSize: '0.85rem', fontWeight: '500' }}>
                        🔒 We only request read-only access. We cannot modify or delete your products.
                      </p>
                    </div>

                    <div className="shopify-info-box">
                      <h4>📋 How it works:</h4>
                      <ol style={{ paddingLeft: '1.5rem' }}>
                        <li>Enter your store name above</li>
                        <li>Click "Connect to Shopify"</li>
                        <li>Log in to your Shopify account</li>
                        <li>Review and approve the permissions</li>
                        <li>Get redirected back to import your products</li>
                      </ol>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="shopify-connected">
                    <div className="success-icon">✅</div>
                    <h3>Connected to Shopify</h3>
                    <p className="connected-store">{shopifyStore}.myshopify.com</p>
                    <p>Your Shopify store is connected. You can now import your products.</p>
                  </div>

                  <div className="shopify-actions">
                    <button 
                      className="btn btn-primary btn-block"
                      onClick={handleImportProducts}
                      disabled={importing}
                    >
                      {importing ? '⏳ Importing...' : '📥 Import Products'}
                    </button>
                    <button 
                      className="btn btn-secondary btn-block"
                      onClick={handleDisconnect}
                    >
                      🔌 Disconnect Store
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {step === 'importing' && (
            <div className="importing-state">
              <div className="spinner-large"></div>
              <h3>Importing Products...</h3>
              <p>Please wait while we import your products from Shopify.</p>
              <p className="import-note">This may take a few moments depending on the number of products.</p>
            </div>
          )}

          {step === 'success' && importStats && (
            <div className="import-success">
              <div className="success-icon-large">🎉</div>
              <h3>Import Complete!</h3>
              <div className="import-stats">
                <div className="stat-item">
                  <strong>{importStats.imported}</strong>
                  <span>New Products</span>
                </div>
                <div className="stat-item">
                  <strong>{importStats.updated}</strong>
                  <span>Updated</span>
                </div>
                {importStats.failed > 0 && (
                  <div className="stat-item error">
                    <strong>{importStats.failed}</strong>
                    <span>Failed</span>
                  </div>
                )}
              </div>
              <p>Your products have been successfully imported to Paya Marketplace!</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {step === 'connect' && !isConnected && (
            <>
              <button className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleConnectShopify}
              >
                Connect to Shopify
              </button>
            </>
          )}
          {step === 'success' && (
            <button className="btn btn-primary" onClick={onClose}>
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopifyIntegration;
