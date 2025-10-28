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
  Spinner,
  EmptyState,
} from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';
import api from '../utils/api';
import toast from 'react-hot-toast';

const ShopifyPublishingSection = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState({});
  const [feedback, setFeedback] = useState({});

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products/merchant/my-products');
      const fetchedProducts = response.data.products || response.data;
      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (productId) => {
    setPublishing(prev => ({ ...prev, [productId]: true }));
    
    try {
      // Publish to Shopify ProductListing API
      await api.post(`/integrations/shopify/product-listings/${productId}`);
      
      // Send success feedback
      await api.post('/integrations/shopify/resource-feedback', {
        product_id: productId,
        state: 'success',
        messages: [{
          message: 'Product successfully published to Paya Marketplace',
          code: 'published'
        }]
      });
      
      toast.success('Product published successfully!');
      setFeedback(prev => ({
        ...prev,
        [productId]: { status: 'success', message: 'Published to Paya Marketplace' }
      }));
    } catch (error) {
      console.error('Error publishing product:', error);
      
      // Send error feedback
      try {
        await api.post(`/integrations/shopify/products/${productId}/feedback/error`, {
          error_message: error.response?.data?.message || 'Failed to publish product'
        });
      } catch (feedbackError) {
        console.error('Error sending feedback:', feedbackError);
      }
      
      toast.error('Failed to publish product');
      setFeedback(prev => ({
        ...prev,
        [productId]: { status: 'error', message: error.response?.data?.message || 'Publishing failed' }
      }));
    } finally {
      setPublishing(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleUnpublish = async (productId) => {
    setPublishing(prev => ({ ...prev, [productId]: true }));
    
    try {
      await api.delete(`/integrations/shopify/product-listings/${productId}`);
      toast.success('Product unpublished successfully!');
      setFeedback(prev => ({
        ...prev,
        [productId]: { status: 'info', message: 'Unpublished from Paya Marketplace' }
      }));
    } catch (error) {
      console.error('Error unpublishing product:', error);
      toast.error('Failed to unpublish product');
    } finally {
      setPublishing(prev => ({ ...prev, [productId]: false }));
    }
  };

  const checkEligibility = (product) => {
    const issues = [];
    
    if (!product.images || product.images.length === 0) {
      issues.push('Missing product images');
    }
    
    if (!product.description || product.description.length < 50) {
      issues.push('Description too short (minimum 50 characters)');
    }
    
    if (!product.price || product.price <= 0) {
      issues.push('Invalid product price');
    }
    
    if (!product.inventory || product.inventory.quantity <= 0) {
      issues.push('Out of stock');
    }
    
    return issues;
  };

  if (loading) {
    return (
      <AppProvider i18n={{}}>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <Spinner size="large" />
        </div>
      </AppProvider>
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
      <div style={{ padding: '20px' }}>
        <BlockStack gap="500">
          {/* Header */}
          <BlockStack gap="200">
            <Text variant="headingXl" as="h1">
              Product Publishing
            </Text>
            <Text variant="bodyMd" as="p" tone="subdued">
              Manage which products are published to Paya Marketplace
            </Text>
          </BlockStack>

          {/* Info Banner */}
          <Banner status="info">
            <p>
              <strong>Publishing to Paya Marketplace:</strong> Select which products you want to sell on Paya Marketplace. 
              Published products will be visible to customers and available for purchase with Buy Now, Pay Later options.
            </p>
          </Banner>

          {/* Link to Marketplace */}
          <Card>
            <BlockStack gap="300">
              <Text variant="headingMd" as="h2">
                View Your Products on Paya Marketplace
              </Text>
              <InlineStack gap="300">
                <Button
                  url="https://paya-marketplace.com"
                  target="_blank"
                  external
                  variant="primary"
                >
                  Visit Paya Marketplace
                </Button>
                <Button
                  url="https://paya-marketplace.com/products"
                  target="_blank"
                  external
                >
                  Browse All Products
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>

          {/* Products List */}
          {products.length === 0 ? (
            <Card>
              <EmptyState
                heading="No products found"
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>Import products from Shopify or add products manually to get started.</p>
              </EmptyState>
            </Card>
          ) : (
            <BlockStack gap="400">
              {products.map((product) => {
                const eligibilityIssues = checkEligibility(product);
                const isEligible = eligibilityIssues.length === 0;
                const productFeedback = feedback[product._id];
                const isPublishing = publishing[product._id];

                return (
                  <Card key={product._id}>
                    <BlockStack gap="400">
                      {/* Product Header */}
                      <InlineStack align="space-between" blockAlign="start">
                        <BlockStack gap="200">
                          <InlineStack gap="300" blockAlign="center">
                            <Text variant="headingMd" as="h3">
                              {product.name}
                            </Text>
                            {product.status === 'active' ? (
                              <Badge status="success">Active</Badge>
                            ) : (
                              <Badge>Inactive</Badge>
                            )}
                          </InlineStack>
                          <Text variant="bodyMd" as="p" tone="subdued">
                            ${product.price} • {product.inventory?.quantity || 0} in stock
                          </Text>
                        </BlockStack>

                        {/* Publishing Actions */}
                        <InlineStack gap="200">
                          {isEligible ? (
                            <>
                              <Button
                                onClick={() => handlePublish(product._id)}
                                loading={isPublishing}
                                variant="primary"
                              >
                                Publish
                              </Button>
                              <Button
                                onClick={() => handleUnpublish(product._id)}
                                loading={isPublishing}
                              >
                                Unpublish
                              </Button>
                            </>
                          ) : (
                            <Badge status="warning">Not Eligible</Badge>
                          )}
                        </InlineStack>
                      </InlineStack>

                      {/* Feedback Banner */}
                      {productFeedback && (
                        <Banner
                          status={
                            productFeedback.status === 'success' ? 'success' :
                            productFeedback.status === 'error' ? 'critical' : 'info'
                          }
                        >
                          <p>{productFeedback.message}</p>
                        </Banner>
                      )}

                      {/* Eligibility Issues */}
                      {!isEligible && (
                        <Banner
                          title="Product requires attention"
                          status="warning"
                        >
                          <BlockStack gap="200">
                            <Text variant="bodyMd" as="p">
                              This product cannot be published until the following issues are resolved:
                            </Text>
                            <ul style={{ marginLeft: '20px' }}>
                              {eligibilityIssues.map((issue, index) => (
                                <li key={index}>{issue}</li>
                              ))}
                            </ul>
                          </BlockStack>
                        </Banner>
                      )}

                      {/* Product Details */}
                      <BlockStack gap="200">
                        <Text variant="bodyMd" as="p" fontWeight="semibold">
                          Publishing Details:
                        </Text>
                        <InlineStack gap="400">
                          <Text variant="bodySm" as="p" tone="subdued">
                            Category: {product.category || 'Uncategorized'}
                          </Text>
                          <Text variant="bodySm" as="p" tone="subdued">
                            Images: {product.images?.length || 0}
                          </Text>
                          <Text variant="bodySm" as="p" tone="subdued">
                            SKU: {product.inventory?.sku || 'N/A'}
                          </Text>
                        </InlineStack>
                      </BlockStack>
                    </BlockStack>
                  </Card>
                );
              })}
            </BlockStack>
          )}

          {/* Publishing Guidelines Card */}
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Publishing Guidelines
              </Text>
              
              <Text variant="bodyMd" as="p">
                To ensure your products are approved for Paya Marketplace:
              </Text>

              <BlockStack gap="300">
                <Card background="bg-surface-secondary">
                  <BlockStack gap="200">
                    <Text variant="bodyMd" as="p" fontWeight="semibold">
                      ✓ Product Images
                    </Text>
                    <Text variant="bodySm" as="p" tone="subdued">
                      Include at least one high-quality image (800x800px or larger)
                    </Text>
                  </BlockStack>
                </Card>

                <Card background="bg-surface-secondary">
                  <BlockStack gap="200">
                    <Text variant="bodyMd" as="p" fontWeight="semibold">
                      ✓ Product Description
                    </Text>
                    <Text variant="bodySm" as="p" tone="subdued">
                      Write detailed descriptions (minimum 50 characters)
                    </Text>
                  </BlockStack>
                </Card>

                <Card background="bg-surface-secondary">
                  <BlockStack gap="200">
                    <Text variant="bodyMd" as="p" fontWeight="semibold">
                      ✓ Pricing & Inventory
                    </Text>
                    <Text variant="bodySm" as="p" tone="subdued">
                      Set valid prices and maintain accurate inventory levels
                    </Text>
                  </BlockStack>
                </Card>
              </BlockStack>

              <Banner status="info">
                <p>
                  Products that meet all requirements will be automatically approved and visible on Paya Marketplace within minutes.
                </p>
              </Banner>
            </BlockStack>
          </Card>
        </BlockStack>
      </div>
    </AppProvider>
  );
};

export default ShopifyPublishingSection;
