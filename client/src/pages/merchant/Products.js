import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const MerchantProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/products/merchant');
      setProducts(response.data);
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
      await axios.delete(`/products/${productId}`);
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
      await axios.patch(`/products/${productId}/status`, { status: newStatus });
      
      setProducts(products.map(p => 
        p._id === productId ? { ...p, status: newStatus } : p
      ));
      
      toast.success(`Product ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating product status:', error);
      toast.error('Failed to update product status');
    }
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
        <button 
          className="btn btn-primary"
          onClick={() => window.location.href = '/merchant/products/add'}
        >
          + Add New Product
        </button>
      </div>

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

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="products-grid">
          {filteredProducts.map(product => (
            <div key={product._id} className="product-card">
              <div className="product-image">
                {product.images && product.images.length > 0 ? (
                  <img 
                    src={`/api/uploads/${product.images[0]}`} 
                    alt={product.name}
                    onError={(e) => {
                      e.target.src = '/placeholder-product.png';
                    }}
                  />
                ) : (
                  <div className="placeholder-image">📦</div>
                )}
              </div>

              <div className="product-info">
                <h3>{product.name}</h3>
                <p className="product-category">{product.category}</p>
                <p className="product-price">KSh {product.price.toLocaleString()}</p>
                <p className="product-stock">
                  Stock: {product.stock} 
                  {product.stock <= 5 && product.stock > 0 && (
                    <span className="low-stock"> (Low Stock)</span>
                  )}
                  {product.stock === 0 && (
                    <span className="out-of-stock"> (Out of Stock)</span>
                  )}
                </p>
                
                <div className="product-status">
                  <span className={`status-badge status-${product.status}`}>
                    {product.status}
                  </span>
                </div>
              </div>

              <div className="product-actions">
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={() => window.location.href = `/merchant/products/edit/${product._id}`}
                >
                  Edit
                </button>
                
                <button 
                  className={`btn btn-sm ${product.status === 'active' ? 'btn-warning' : 'btn-success'}`}
                  onClick={() => handleToggleStatus(product._id, product.status)}
                >
                  {product.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
                
                <button 
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDeleteProduct(product._id)}
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
            onClick={() => window.location.href = '/merchant/products/add'}
          >
            Add Your First Product
          </button>
        </div>
      )}

      {/* Products Summary */}
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
              <strong>{products.filter(p => p.stock <= 5).length}</strong>
              <span>Low Stock</span>
            </div>
            <div className="stat">
              <strong>{products.filter(p => p.stock === 0).length}</strong>
              <span>Out of Stock</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantProducts;
