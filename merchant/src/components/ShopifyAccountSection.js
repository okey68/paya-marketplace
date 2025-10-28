import React, { useState, useEffect } from 'react';
import {
  AppProvider,
  Card,
  Banner,
  Button,
  BlockStack,
  InlineStack,
  Text,
  Badge,
  Link,
  Divider,
  List,
} from '@shopify/polaris';
// Temporarily commented out to fix Netlify build - CSS calc() issue
// import '@shopify/polaris/build/esm/styles.css';
import api from '../utils/api';
import toast from 'react-hot-toast';

const ShopifyAccountSection = () => {
  const [integration, setIntegration] = useState(null);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [accountStatus, setAccountStatus] = useState('pending'); // pending, approved, active

  useEffect(() => {
    checkIntegration();
  }, []);

  const checkIntegration = async () => {
    try {
      const response = await api.get('/integrations/shopify/status');
      if (response.data.connected) {
        setIntegration(response.data);
        setAccountStatus('active');
      }
    } catch (error) {
      console.error('Error checking integration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect your Shopify store?')) {
      return;
    }

    try {
      await api.post('/integrations/shopify/disconnect');
      setIntegration(null);
      setAccountStatus('pending');
      toast.success('Shopify store disconnected');
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Failed to disconnect Shopify store');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
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
      <div style={{ padding: '20px' }}>
        <BlockStack gap="500">
          {/* Header */}
          <BlockStack gap="200">
            <Text variant="headingXl" as="h1">
              Shopify Sales Channel Account
            </Text>
            <Text variant="bodyMd" as="p" tone="subdued">
              Manage your Paya Marketplace sales channel connection
            </Text>
          </BlockStack>

          {/* Account Status Banner */}
          {integration ? (
            <Banner
              title="Account Connected"
              status="success"
            >
              <p>
                Your Shopify store <strong>{integration.storeName}.myshopify.com</strong> is connected to Paya Marketplace.
              </p>
            </Banner>
          ) : (
            <Banner
              title="No Account Connected"
              status="warning"
            >
              <p>Connect your Shopify store to start selling on Paya Marketplace.</p>
            </Banner>
          )}

          {/* Account Information Card */}
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Account Information
              </Text>
              
              {integration ? (
                <BlockStack gap="300">
                  <InlineStack align="space-between">
                    <Text variant="bodyMd" as="p">Store Name</Text>
                    <Text variant="bodyMd" as="p" fontWeight="semibold">
                      {integration.storeName}.myshopify.com
                    </Text>
                  </InlineStack>
                  
                  <InlineStack align="space-between">
                    <Text variant="bodyMd" as="p">Account Status</Text>
                    <Badge status="success">Active</Badge>
                  </InlineStack>
                  
                  <InlineStack align="space-between">
                    <Text variant="bodyMd" as="p">Sales Channel</Text>
                    <Text variant="bodyMd" as="p" fontWeight="semibold">
                      Paya Marketplace
                    </Text>
                  </InlineStack>

                  <Divider />

                  <Button onClick={handleDisconnect} tone="critical">
                    Disconnect Account
                  </Button>
                </BlockStack>
              ) : (
                <Text variant="bodyMd" as="p" tone="subdued">
                  No Shopify store connected. Go to the Products page to connect your store.
                </Text>
              )}
            </BlockStack>
          </Card>

          {/* Account Approval Process Card */}
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Account Approval Process
              </Text>
              
              <Text variant="bodyMd" as="p">
                Your Paya Marketplace account is automatically approved when you connect your Shopify store. Here's what happens:
              </Text>

              <List type="number">
                <List.Item>Connect your Shopify store via OAuth</List.Item>
                <List.Item>Your account is instantly activated</List.Item>
                <List.Item>Import your products to Paya Marketplace</List.Item>
                <List.Item>Start selling to Kenyan customers</List.Item>
              </List>

              <Banner status="info">
                <p>
                  <strong>Instant Approval:</strong> No waiting period required. Start selling immediately after connecting your store.
                </p>
              </Banner>
            </BlockStack>
          </Card>

          {/* Eligibility Requirements Card */}
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Eligibility Requirements
              </Text>
              
              <Text variant="bodyMd" as="p">
                To sell on Paya Marketplace, your products must meet these requirements:
              </Text>

              <List type="bullet">
                <List.Item>Products must have clear images (minimum 800x800px recommended)</List.Item>
                <List.Item>Products must have detailed descriptions</List.Item>
                <List.Item>Products must have valid pricing in your currency</List.Item>
                <List.Item>Products must have inventory tracking enabled</List.Item>
                <List.Item>Products must comply with Kenyan import regulations</List.Item>
              </List>

              <Banner status="warning">
                <p>
                  Products that don't meet these requirements may not be eligible for publishing to Paya Marketplace.
                </p>
              </Banner>
            </BlockStack>
          </Card>

          {/* Commission Structure Card */}
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Commission Structure
              </Text>
              
              <Text variant="bodyMd" as="p">
                Paya Marketplace charges a commission on each sale made through our platform:
              </Text>

              <Card background="bg-surface-secondary">
                <BlockStack gap="300">
                  <InlineStack align="space-between">
                    <Text variant="bodyMd" as="p">Commission Rate</Text>
                    <Text variant="headingMd" as="p" fontWeight="bold">
                      5% per sale
                    </Text>
                  </InlineStack>
                  
                  <Text variant="bodySm" as="p" tone="subdued">
                    Commission is calculated on the product price before taxes and shipping
                  </Text>
                </BlockStack>
              </Card>

              <BlockStack gap="200">
                <Text variant="bodyMd" as="p" fontWeight="semibold">
                  What's Included:
                </Text>
                <List type="bullet">
                  <List.Item>Access to Kenyan customer base</List.Item>
                  <List.Item>Buy Now, Pay Later (BNPL) financing for customers</List.Item>
                  <List.Item>Payment processing and fraud protection</List.Item>
                  <List.Item>Customer support</List.Item>
                  <List.Item>Marketing and promotion on Paya platform</List.Item>
                </List>
              </BlockStack>

              <Banner status="info">
                <p>
                  <strong>No Monthly Fees:</strong> You only pay when you make a sale. No subscription or listing fees.
                </p>
              </Banner>
            </BlockStack>
          </Card>

          {/* Marketplace Link Card */}
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Your Paya Marketplace Store
              </Text>
              
              <Text variant="bodyMd" as="p">
                View your products and manage your store on Paya Marketplace:
              </Text>

              <InlineStack gap="300">
                <Button
                  url="https://paya-marketplace.com"
                  target="_blank"
                  external
                >
                  Visit Paya Marketplace
                </Button>
                
                {integration && (
                  <Button
                    url={`https://paya-marketplace.com/stores/${integration.storeName}`}
                    target="_blank"
                    external
                    variant="primary"
                  >
                    View Your Store
                  </Button>
                )}
              </InlineStack>
            </BlockStack>
          </Card>

          {/* Terms and Conditions Card */}
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Terms and Conditions
              </Text>
              
              <Text variant="bodyMd" as="p">
                By using Paya Marketplace as a sales channel, you agree to our terms and conditions:
              </Text>

              <InlineStack gap="300">
                <Link
                  url="https://paya-marketplace.com/terms"
                  target="_blank"
                  external
                >
                  Terms of Service
                </Link>
                
                <Link
                  url="https://paya-marketplace.com/privacy"
                  target="_blank"
                  external
                >
                  Privacy Policy
                </Link>
                
                <Link
                  url="https://paya-marketplace.com/seller-agreement"
                  target="_blank"
                  external
                >
                  Seller Agreement
                </Link>
              </InlineStack>

              <Text variant="bodySm" as="p" tone="subdued">
                All links open in a new window
              </Text>
            </BlockStack>
          </Card>

          {/* Support Card */}
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Need Help?
              </Text>
              
              <Text variant="bodyMd" as="p">
                Our support team is here to help you succeed on Paya Marketplace.
              </Text>

              <InlineStack gap="300">
                <Button url="mailto:support@paya-marketplace.com">
                  Email Support
                </Button>
                
                <Button
                  url="https://paya-marketplace.com/help"
                  target="_blank"
                  external
                >
                  Help Center
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </BlockStack>
      </div>
    </AppProvider>
  );
};

export default ShopifyAccountSection;
