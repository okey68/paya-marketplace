import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({});

  const categories = [
    'Electronics', 'Appliances', 'Clothing', 'Cosmetics', 'Medical Care', 'Services', 'Other'
  ];

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });

      const response = await axios.get(`/admin/products?${params}`);
      setProducts(response.data.products);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { class: 'badge-success', label: 'Active' },
      inactive: { class: 'badge-danger', label: 'Inactive' },
      draft: { class: 'badge-warning', label: 'Draft' },
      out_of_stock: { class: 'badge-danger', label: 'Out of Stock' }
    };
    
    const config = statusConfig[status] || { class: 'badge-info', label: status };
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  const getStockStatus = (product) => {
    if (!product.inventory.trackInventory) {
      return <span className="badge badge-info">Unlimited</span>;
    }
    
    if (product.inventory.quantity === 0) {
      return <span className="badge badge-danger">Out of Stock</span>;
    }
    
    if (product.inventory.quantity <= product.inventory.lowStockThreshold) {
      return <span className="badge badge-warning">Low Stock</span>;
    }
    
    return <span className="badge badge-success">In Stock</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Products</h1>
        <p className="page-subtitle">Monitor all products across the marketplace</p>
      </div>

      {/* Filters */}
      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-input"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-input"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Search</label>
            <input
              type="text"
              className="form-input"
              placeholder="Product name, SKU..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            />
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            Products ({pagination.totalItems || 0})
          </h3>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Merchant</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Views</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {product.primaryImage && (
                          <img
                            src={`/api/uploads/download/${product.merchant._id}/${product.primaryImage.filename}`}
                            alt={product.name}
                            style={{
                              width: '40px',
                              height: '40px',
                              objectFit: 'cover',
                              borderRadius: '4px'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <div>
                          <strong>{product.name}</strong>
                          <br />
                          <small style={{ color: '#718096' }}>
                            SKU: {product.sku || 'N/A'}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      {product.merchant.businessInfo?.businessName || 
                       `${product.merchant.firstName} ${product.merchant.lastName}`}
                    </td>
                    <td>{product.category}</td>
                    <td>{formatCurrency(product.price)}</td>
                    <td>
                      {getStockStatus(product)}
                      <br />
                      <small style={{ color: '#718096' }}>
                        {product.inventory.trackInventory ? 
                          `${product.inventory.quantity} units` : 
                          'Unlimited'
                        }
                      </small>
                    </td>
                    <td>{getStatusBadge(product.status)}</td>
                    <td>{product.views || 0}</td>
                    <td>{new Date(product.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {products.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>
                No products found
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '1rem', 
            padding: '1rem',
            borderTop: '1px solid #e2e8f0'
          }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.currentPage === 1}
              onClick={() => setFilters({ ...filters, page: pagination.currentPage - 1 })}
            >
              Previous
            </button>
            
            <span>
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => setFilters({ ...filters, page: pagination.currentPage + 1 })}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
