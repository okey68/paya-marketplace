import React, { useState, useEffect } from 'react';
import {
  AppProvider,
  Card,
  Button,
  TextField,
  Banner,
  Spinner,
  BlockStack,
  InlineStack,
  TextContainer,
  List,
  Modal,
  Frame,
} from '@shopify/polaris';
// Temporarily commented out to fix Netlify build - CSS calc() issue
// import '@shopify/polaris/build/esm/styles.css';
import api from '../utils/api';
import toast from 'react-hot-toast';

const ShopifyIntegrationPolaris = ({ onClose, onSuccess }) => {
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

  const modalContent = () => {
    if (step === 'connect' && !isConnected) {
      return (
        <Modal.Section>
          <BlockStack gap="500">
            <TextContainer>
              <p>Connect your Shopify store to import all your products to Paya Marketplace.</p>
            </TextContainer>

            <TextField
              label="Shopify Store Name"
              value={shopifyStore}
              onChange={setShopifyStore}
              placeholder="your-store-name"
              suffix=".myshopify.com"
              helpText="Enter your Shopify store name (e.g., 'my-awesome-store')"
              autoComplete="off"
            />

            <Card sectioned>
              <BlockStack gap="300">
                <TextContainer>
                  <p style={{ fontWeight: 600 }}>What you'll authorize:</p>
                  <p style={{ fontSize: '0.9rem', color: '#6d7175' }}>
                    After clicking "Connect to Shopify", you'll be asked to log in to your Shopify store and authorize Paya to access:
                  </p>
                </TextContainer>
                <List type="bullet">
                  <List.Item>Product names & descriptions</List.Item>
                  <List.Item>Prices</List.Item>
                  <List.Item>Images</List.Item>
                  <List.Item>Inventory quantities</List.Item>
                  <List.Item>SKUs</List.Item>
                  <List.Item>Categories & tags</List.Item>
                  <List.Item>Active/inactive status</List.Item>
                  <List.Item>Order information (read-only)</List.Item>
                </List>
                <Banner status="info">
                  We only request read-only access. We cannot modify or delete your products.
                </Banner>
              </BlockStack>
            </Card>

            <Card sectioned>
              <BlockStack gap="300">
                <TextContainer>
                  <p style={{ fontWeight: 600 }}>How it works:</p>
                </TextContainer>
                <List type="number">
                  <List.Item>Enter your store name above</List.Item>
                  <List.Item>Click "Connect to Shopify"</List.Item>
                  <List.Item>Log in to your Shopify account</List.Item>
                  <List.Item>Review and approve the permissions</List.Item>
                  <List.Item>Get redirected back to import your products</List.Item>
                </List>
              </BlockStack>
            </Card>
          </BlockStack>
        </Modal.Section>
      );
    }

    if (step === 'connect' && isConnected) {
      return (
        <Modal.Section>
          <BlockStack gap="500">
            <Banner status="success">
              <p style={{ fontWeight: 600 }}>Connected to Shopify</p>
              <p>{shopifyStore}.myshopify.com</p>
            </Banner>

            <TextContainer>
              <p>Your Shopify store is connected. You can now import your products.</p>
            </TextContainer>

            <InlineStack gap="300" blockAlign="stretch">
              <Button
                primary
                size="large"
                onClick={handleImportProducts}
                loading={importing}
              >
                Import Products
              </Button>
              <Button
                size="large"
                onClick={handleDisconnect}
              >
                Disconnect Store
              </Button>
            </InlineStack>
          </BlockStack>
        </Modal.Section>
      );
    }

    if (step === 'importing') {
      return (
        <Modal.Section>
          <BlockStack gap="500" align="center">
            <Spinner size="large" />
            <TextContainer>
              <p style={{ fontWeight: 600, textAlign: 'center' }}>Importing Products...</p>
              <p style={{ textAlign: 'center' }}>Please wait while we import your products from Shopify.</p>
              <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#6d7175' }}>
                This may take a few moments depending on the number of products.
              </p>
            </TextContainer>
          </BlockStack>
        </Modal.Section>
      );
    }

    if (step === 'success' && importStats) {
      return (
        <Modal.Section>
          <BlockStack gap="500" align="center">
            <div style={{ fontSize: '3rem', color: '#008060' }}>✓</div>
            <TextContainer>
              <p style={{ fontWeight: 600, fontSize: '1.2rem', textAlign: 'center' }}>Import Complete!</p>
            </TextContainer>

            <Card sectioned>
              <InlineStack gap="400" blockAlign="center">
                <BlockStack gap="200" align="center">
                  <p style={{ fontSize: '1.5rem', fontWeight: 600, color: '#008060' }}>{importStats.imported}</p>
                  <p style={{ fontSize: '0.9rem', color: '#6d7175' }}>New Products</p>
                </BlockStack>
                <BlockStack gap="200" align="center">
                  <p style={{ fontSize: '1.5rem', fontWeight: 600, color: '#2c6ecb' }}>{importStats.updated}</p>
                  <p style={{ fontSize: '0.9rem', color: '#6d7175' }}>Updated</p>
                </BlockStack>
                {importStats.failed > 0 && (
                  <BlockStack gap="200" align="center">
                    <p style={{ fontSize: '1.5rem', fontWeight: 600, color: '#d72c0d' }}>{importStats.failed}</p>
                    <p style={{ fontSize: '0.9rem', color: '#6d7175' }}>Failed</p>
                  </BlockStack>
                )}
              </InlineStack>
            </Card>

            <TextContainer>
              <p style={{ textAlign: 'center' }}>Your products have been successfully imported to Paya Marketplace!</p>
            </TextContainer>
          </BlockStack>
        </Modal.Section>
      );
    }
  };

  const primaryAction = () => {
    if (step === 'connect' && !isConnected) {
      return {
        content: 'Connect to Shopify',
        onAction: handleConnectShopify,
        disabled: !shopifyStore.trim(),
      };
    }
    if (step === 'success') {
      return {
        content: 'Done',
        onAction: onClose,
      };
    }
    return null;
  };

  const secondaryActions = () => {
    if (step === 'connect' && !isConnected) {
      return [
        {
          content: 'Cancel',
          onAction: onClose,
        },
      ];
    }
    return [];
  };

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
      <Frame>
        <Modal
          open={true}
          onClose={onClose}
          title="Connect Shopify Store"
          primaryAction={primaryAction()}
          secondaryActions={secondaryActions()}
          large
        >
          {modalContent()}
        </Modal>
      </Frame>
    </AppProvider>
  );
};

export default ShopifyIntegrationPolaris;
