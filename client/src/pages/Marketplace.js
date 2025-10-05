import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const Marketplace = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedPriceRange, setSelectedPriceRange] = useState('');
  const [categoriesExpanded, setCategoriesExpanded] = useState(true);
  const [priceExpanded, setPriceExpanded] = useState(true);
  
  const { addToCart } = useCart();

  const categories = [
    'Electronics',
    'Appliances',
    'Clothing',
    'Cosmetics',
    'Medical Care',
    'Services',
    'Other'
  ];

  const priceRanges = [
    { label: 'Under KSh 5,000', min: 0, max: 5000, value: '0-5000' },
    { label: 'KSh 5,000 - KSh 15,000', min: 5000, max: 15000, value: '5000-15000' },
    { label: 'KSh 15,000 - KSh 50,000', min: 15000, max: 50000, value: '15000-50000' },
    { label: 'KSh 50,000 - KSh 100,000', min: 50000, max: 100000, value: '50000-100000' },
    { label: 'KSh 100,000 - KSh 200,000', min: 100000, max: 200000, value: '100000-200000' },
    { label: 'Over KSh 200,000', min: 200000, max: Infinity, value: '200000-inf' }
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/products/public');
      // Handle both array response (old format) and object response (new format)
      const productsData = response.data.products || response.data;
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    addToCart({
      id: product._id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || null,
      merchantName: product.merchantName
    });
    toast.success(`${product.name} added to cart!`);
  };

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === '' || product.category === selectedCategory;
      
      // Handle selected price range
      let matchesPrice = true;
      if (selectedPriceRange) {
        const range = priceRanges.find(r => r.value === selectedPriceRange);
        if (range) {
          matchesPrice = product.price >= range.min && (range.max === Infinity || product.price <= range.max);
        }
      }
      
      return matchesSearch && matchesCategory && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  if (loading) {
    return (
      <div className="marketplace-container">
        <div className="loading-spinner">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="marketplace-container">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <span>Marketplace</span>
          {selectedCategory && (
            <>
              <span>/</span>
              <span>{selectedCategory}</span>
            </>
          )}
        </nav>

        <div className="marketplace-layout">
          {/* Sidebar Filters */}
          <div className="marketplace-sidebar">
            {/* Search */}
            <div className="sidebar-section">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Categories */}
            <div className="sidebar-section">
              <div 
                className="section-header"
                onClick={() => setCategoriesExpanded(!categoriesExpanded)}
              >
                <h3>Categories</h3>
                <span className={`expand-icon ${categoriesExpanded ? 'expanded' : ''}`}>
                  ▼
                </span>
              </div>
              {categoriesExpanded && (
                <div className="category-filters">
                  <label className="category-item">
                    <input
                      type="radio"
                      name="category"
                      value=""
                      checked={selectedCategory === ''}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    />
                    <span>All Categories</span>
                    <span className="count">({products.length})</span>
                  </label>
                  {categories.map(category => {
                    const count = products.filter(p => p.category === category).length;
                    return (
                      <label key={category} className="category-item">
                        <input
                          type="radio"
                          name="category"
                          value={category}
                          checked={selectedCategory === category}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                        />
                        <span>{category}</span>
                        <span className="count">({count})</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Price Range */}
            <div className="sidebar-section">
              <div 
                className="section-header"
                onClick={() => setPriceExpanded(!priceExpanded)}
              >
                <h3>Price Range (KSh)</h3>
                <span className={`expand-icon ${priceExpanded ? 'expanded' : ''}`}>
                  ▼
                </span>
              </div>
              {priceExpanded && (
                <div className="price-filters">
                  <label className="price-item">
                    <input
                      type="radio"
                      name="priceRange"
                      value=""
                      checked={selectedPriceRange === ''}
                      onChange={(e) => setSelectedPriceRange(e.target.value)}
                    />
                    <span>All Prices</span>
                    <span className="count">({products.length})</span>
                  </label>
                  {priceRanges.map(range => {
                    const count = products.filter(p => 
                      p.price >= range.min && (range.max === Infinity || p.price <= range.max)
                    ).length;
                    return (
                      <label key={range.value} className="price-item">
                        <input
                          type="radio"
                          name="priceRange"
                          value={range.value}
                          checked={selectedPriceRange === range.value}
                          onChange={(e) => setSelectedPriceRange(e.target.value)}
                        />
                        <span>{range.label}</span>
                        <span className="count">({count})</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Clear Filters */}
            <div className="sidebar-section">
              <button 
                className="btn btn-outline btn-sm btn-full"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                  setSelectedPriceRange('');
                }}
              >
                Clear All Filters
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="marketplace-main">
            {/* Results Header */}
            <div className="results-header">
              <div className="results-info">
                <p>Selected Products: <strong>{filteredProducts.length}</strong></p>
              </div>
              <div className="sort-controls">
                <label>Sort By:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name A-Z</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <div className="products-grid">
                {filteredProducts.map(product => (
                  <div key={product._id} className="product-card">
                    <Link to={`/product/${product._id}`} className="product-link">
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
                        <p className="product-merchant">by {product.merchantName}</p>
                        <p className="product-price">KSh {product.price.toLocaleString()}</p>
                        <p className="product-description">
                          {product.description.length > 100 
                            ? `${product.description.substring(0, 100)}...` 
                            : product.description
                          }
                        </p>
                      </div>
                    </Link>

                    <div className="product-actions">
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => handleAddToCart(product)}
                        disabled={product.inventory?.quantity === 0}
                      >
                        {product.inventory?.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                      <Link 
                        to={`/product/${product._id}`}
                        className="btn btn-outline btn-sm"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>No Products Found</h3>
                <p>Try adjusting your search or filter criteria</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                    setSelectedPriceRange('');
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
