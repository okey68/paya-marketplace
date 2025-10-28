import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import ShopifyIntegrationPolaris from '../components/ShopifyIntegrationPolaris';
import { Button, AppProvider } from '@shopify/polaris';
// Temporarily commented out to fix Netlify build - CSS calc() issue
// import '@shopify/polaris/build/esm/styles.css';

const MerchantProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showShopifyIntegration, setShowShopifyIntegration] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProducts();
    
    // Check for Shopify connection status in URL
    const urlParams = new URLSearchParams(window.location.search);
    const shopifyStatus = urlParams.get('shopify');
    
    if (shopifyStatus === 'connected') {
      toast.success('Shopify store connected! Click "Connect Shopify" to import products.');
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (shopifyStatus === 'error') {
      const reason = urlParams.get('reason');
      const message = reason === 'session_expired' 
        ? 'Session expired. Please try connecting again.' 
        : 'Failed to connect Shopify store. Please try again.';
      toast.error(message);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products/merchant/my-products');
      const fetchedProducts = response.data.products || response.data;
      console.log('Fetched products:', fetchedProducts);
      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await api.delete(`/products/${productId}`);
      setProducts(products.filter(p => p._id !== productId));
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleToggleStatus = async (productId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await api.patch(`/products/${productId}/status`, { status: newStatus });
      
      setProducts(products.map(p => 
        p._id === productId ? { ...p, status: newStatus } : p
      ));
      
      toast.success(`Product ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating product status:', error);
      toast.error('Failed to update product status');
    }
  };

  const handleBulkUpload = async () => {
    if (!uploadFile) {
      toast.error('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);

    setUploading(true);
    try {
      const response = await api.post('/products/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Upload response:', response.data);
      
      // Show errors if any
      if (response.data.errors && response.data.errors.length > 0) {
        toast.success(`Uploaded ${response.data.count} products (${response.data.errors.length} rows had errors)`);
        console.log('Upload errors:', response.data.errors);
      } else {
        toast.success(`Successfully uploaded ${response.data.count} products!`);
      }
      
      setShowBulkUpload(false);
      setUploadFile(null);
      
      // Refresh products list
      await fetchProducts();
    } catch (error) {
      console.error('Error uploading products:', error);
      console.log('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to upload products');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'name,description,price,stock,category,sku,currency,taxRate,shippingCost,tags,lowStockThreshold\n' +
      'Sample Product,Product description here,1000,50,Electronics,SKU-001,KES,0,0,electronics;gadget,10\n' +
      'Another Product,Another product description,2000,30,Clothing,SKU-002,KES,0,0,clothing;fashion,5\n' +
      'Third Product,Third product description,1500,100,Appliances,SKU-003,KES,0,0,appliance;home,15';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredProducts = products
    .filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterCategory === '' || product.category === filterCategory)
    )
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price') return a.price - b.price;
      if (sortBy === 'stock') return a.stock - b.stock;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const categories = [...new Set(products.map(p => p.category))];

  if (loading) {
    return (
      <div className="merchant-products">
        <div className="loading-spinner">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="merchant-products">
      <div className="products-header">
        <h1>My Products</h1>
        <div className="header-actions">
          <AppProvider
            i18n={{
              Polaris: {
                Common: {
                  checkbox: 'checkbox',
                },
              },
            }}
          >
            <div style={{ display: 'inline-block' }}>
              <Button
                onClick={() => setShowShopifyIntegration(true)}
                size="large"
              >
                Connect Shopify
              </Button>
            </div>
          </AppProvider>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowBulkUpload(true)}
          >
            📤 Bulk Upload
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.href = '/products/add'}
          >
            + Add New Product
          </button>
        </div>
      </div>

      {/* Products Summary - Moved to top */}
      {products.length > 0 && (
        <div className="products-summary">
          <div className="summary-stats">
            <div className="stat">
              <strong>{products.length}</strong>
              <span>Total Products</span>
            </div>
            <div className="stat">
              <strong>{products.filter(p => p.status === 'active').length}</strong>
              <span>Active</span>
            </div>
            <div className="stat">
              <strong>{products.filter(p => (p.inventory?.quantity || 0) <= 5).length}</strong>
              <span>Low Stock</span>
            </div>
            <div className="stat">
              <strong>{products.filter(p => (p.inventory?.quantity || 0) === 0).length}</strong>
              <span>Out of Stock</span>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="products-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="createdAt">Newest First</option>
            <option value="name">Name A-Z</option>
            <option value="price">Price Low-High</option>
            <option value="stock">Stock Low-High</option>
          </select>
        </div>
      </div>

      {/* Products List */}
      {filteredProducts.length > 0 ? (
        <div className="products-list">
          <div className="products-list-header">
            <div className="col-product">Product</div>
            <div className="col-category">Category</div>
            <div className="col-price">Price</div>
            <div className="col-stock">Stock</div>
            <div className="col-status">Status</div>
            <div className="col-actions">Actions</div>
          </div>
          {filteredProducts.map(product => (
            <div key={product._id} className="product-list-item">
              <div className="col-product">
                <div className="product-image-small">
                  {product.images && product.images.length > 0 ? (
                    <img 
                      src={`/api/uploads/${product.images[0]}`} 
                      alt={product.name}
                      onError={(e) => {
                        e.target.src = '/placeholder-product.png';
                      }}
                    />
                  ) : (
                    <div className="placeholder-image-small">📦</div>
                  )}
                </div>
                <div className="product-name-info">
                  <h4>{product.name}</h4>
                  <span className="product-sku">{product.sku}</span>
                </div>
              </div>

              <div className="col-category">
                <span className="category-badge">{product.category}</span>
              </div>

              <div className="col-price">
                <strong>KES {product.price.toLocaleString()}</strong>
              </div>

              <div className="col-stock">
                <span className={(product.inventory?.quantity || 0) <= 5 ? 'stock-low' : (product.inventory?.quantity || 0) === 0 ? 'stock-out' : 'stock-ok'}>
                  {product.inventory?.quantity || 0}
                  {(product.inventory?.quantity || 0) <= 5 && (product.inventory?.quantity || 0) > 0 && ' (Low)'}
                  {(product.inventory?.quantity || 0) === 0 && ' (Out)'}
                </span>
              </div>

              <div className="col-status">
                <span className={`status-badge status-${product.status}`}>
                  {product.status}
                </span>
              </div>

              <div className="col-actions">
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={() => window.location.href = `/products/edit/${product._id}`}
                  title="Edit"
                >
                  Edit
                </button>
                
                <button 
                  className={`btn btn-sm ${product.status === 'active' ? 'btn-warning' : 'btn-success'}`}
                  onClick={() => handleToggleStatus(product._id, product.status)}
                  title={product.status === 'active' ? 'Deactivate' : 'Activate'}
                >
                  {product.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
                
                <button 
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDeleteProduct(product._id)}
                  title="Delete"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No Products Found</h3>
          <p>
            {searchTerm || filterCategory 
              ? 'No products match your current filters.' 
              : 'You haven\'t added any products yet.'
            }
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.href = '/products/add'}
          >
            Add Your First Product
          </button>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <div className="modal-overlay" onClick={() => setShowBulkUpload(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Bulk Upload Products</h2>
              <button className="modal-close" onClick={() => setShowBulkUpload(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Upload a CSV or Excel file to add multiple products at once.
              </p>
              
              <div className="upload-instructions">
                <h4>Instructions:</h4>
                <ol>
                  <li>Download the template file below</li>
                  <li>Fill in your product information</li>
                  <li>Upload the completed file</li>
                </ol>
                <button className="btn btn-link" onClick={downloadTemplate}>
                  📥 Download CSV Template
                </button>
              </div>

              <div className="file-upload-area">
                <input
                  type="file"
                  id="bulk-upload-file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  style={{ display: 'none' }}
                />
                <label htmlFor="bulk-upload-file" className="file-upload-label">
                  {uploadFile ? (
                    <div className="file-selected">
                      <span>📄 {uploadFile.name}</span>
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={(e) => {
                          e.preventDefault();
                          setUploadFile(null);
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="file-upload-placeholder">
                      <span className="upload-icon">📤</span>
                      <p>Click to select a CSV or Excel file</p>
                      <p className="upload-hint">or drag and drop</p>
                    </div>
                  )}
                </label>
              </div>

              <div className="csv-format-info">
                <h4>CSV Columns:</h4>
                <ul>
                  <li><strong>name</strong> - Product name (required)</li>
                  <li><strong>description</strong> - Product description</li>
                  <li><strong>price</strong> - Price (required)</li>
                  <li><strong>stock</strong> - Stock quantity (required)</li>
                  <li><strong>category</strong> - Must be one of: Electronics, Appliances, Clothing, Cosmetics, Medical Care, Services, Other</li>
                  <li><strong>sku</strong> - Stock keeping unit (auto-generated if empty)</li>
                  <li><strong>currency</strong> - Currency code (default: KES)</li>
                  <li><strong>taxRate</strong> - Tax rate as decimal (default: 0)</li>
                  <li><strong>shippingCost</strong> - Shipping cost (default: 0)</li>
                  <li><strong>tags</strong> - Tags separated by semicolon (e.g., tag1;tag2)</li>
                  <li><strong>lowStockThreshold</strong> - Low stock alert threshold (default: 10)</li>
                </ul>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowBulkUpload(false)}
                disabled={uploading}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleBulkUpload}
                disabled={!uploadFile || uploading}
              >
                {uploading ? 'Uploading...' : 'Upload Products'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shopify Integration Modal */}
      {showShopifyIntegration && (
        <ShopifyIntegrationPolaris
          onClose={() => setShowShopifyIntegration(false)}
          onSuccess={() => {
            setShowShopifyIntegration(false);
            fetchProducts();
          }}
        />
      )}
    </div>
  );
};

export default MerchantProducts;
