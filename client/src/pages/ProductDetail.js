import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Product not found');
      navigate('/marketplace');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      for (let i = 0; i < quantity; i++) {
        addToCart({
          id: product._id,
          name: product.name,
          price: product.price,
          image: product.images?.[0] || null,
          merchantName: product.merchantName
        });
      }
      toast.success(`${quantity} x ${product.name} added to cart!`);
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  if (loading) {
    return (
      <div className="product-detail-container">
        <div className="loading-spinner">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-container">
        <div className="error-message">
          <h2>Product Not Found</h2>
          <p>The product you're looking for doesn't exist or has been removed.</p>
          <Link to="/marketplace" className="btn btn-primary">
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.inventory?.quantity === 0;
  const isLowStock = product.inventory?.quantity <= product.inventory?.lowStockThreshold;

  return (
    <div className="product-detail-container">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/marketplace">Marketplace</Link>
          <span>/</span>
          <span>{product.category}</span>
          <span>/</span>
          <span>{product.name}</span>
        </nav>

        <div className="product-detail-content">
          {/* Product Images */}
          <div className="product-images">
            <div className="main-image">
              {product.images && product.images.length > 0 ? (
                <img 
                  src={`/api/uploads/${product.images[selectedImage]}`} 
                  alt={product.name}
                  onError={(e) => {
                    e.target.src = '/placeholder-product.png';
                  }}
                />
              ) : (
                <div className="placeholder-image">📦</div>
              )}
            </div>
            
            {product.images && product.images.length > 1 && (
              <div className="image-thumbnails">
                {product.images.map((image, index) => (
                  <img
                    key={index}
                    src={`/api/uploads/${image}`}
                    alt={`${product.name} ${index + 1}`}
                    className={selectedImage === index ? 'active' : ''}
                    onClick={() => setSelectedImage(index)}
                    onError={(e) => {
                      e.target.src = '/placeholder-product.png';
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="product-info">
            <div className="product-header">
              <h1>{product.name}</h1>
              <p className="merchant-name">by {product.merchantName}</p>
              <div className="product-rating">
                <span className="stars">★★★★☆</span>
                <span className="rating-text">(4.0) • 23 reviews</span>
              </div>
            </div>

            <div className="product-price">
              <span className="current-price">KSh {product.price.toLocaleString()}</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="original-price">KSh {product.originalPrice.toLocaleString()}</span>
              )}
            </div>

            <div className="product-stock">
              {isOutOfStock ? (
                <span className="out-of-stock">Out of Stock</span>
              ) : isLowStock ? (
                <span className="low-stock">Only {product.inventory.quantity} left in stock</span>
              ) : (
                <span className="in-stock">In Stock ({product.inventory.quantity} available)</span>
              )}
            </div>

            {/* Quantity and Actions */}
            <div className="product-actions">
              <div className="quantity-selector">
                <label>Quantity:</label>
                <div className="quantity-controls">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span>{quantity}</span>
                  <button 
                    onClick={() => setQuantity(Math.min(product.inventory?.quantity || 1, quantity + 1))}
                    disabled={quantity >= (product.inventory?.quantity || 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="action-buttons">
                <button 
                  className="btn btn-primary btn-lg"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                >
                  Add to Cart
                </button>
                <button 
                  className="btn btn-secondary btn-lg"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                >
                  Buy Now
                </button>
              </div>
            </div>

            {/* Product Features */}
            <div className="product-features">
              <div className="feature">
                <span className="icon">🚚</span>
                <div>
                  <strong>Free Delivery</strong>
                  <p>On orders over KSh 5,000</p>
                </div>
              </div>
              <div className="feature">
                <span className="icon">🔄</span>
                <div>
                  <strong>30-Day Returns</strong>
                  <p>Easy returns within 30 days</p>
                </div>
              </div>
              <div className="feature">
                <span className="icon">🛡️</span>
                <div>
                  <strong>Warranty</strong>
                  <p>1-year manufacturer warranty</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="product-tabs">
          <div className="tab-headers">
            <button 
              className={activeTab === 'description' ? 'active' : ''}
              onClick={() => setActiveTab('description')}
            >
              Description
            </button>
            <button 
              className={activeTab === 'specifications' ? 'active' : ''}
              onClick={() => setActiveTab('specifications')}
            >
              Specifications
            </button>
            <button 
              className={activeTab === 'reviews' ? 'active' : ''}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews (23)
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'description' && (
              <div className="description-tab">
                <h3>Product Description</h3>
                <p>{product.description}</p>
                
                {product.tags && product.tags.length > 0 && (
                  <div className="product-tags">
                    <h4>Tags:</h4>
                    <div className="tags">
                      {product.tags.map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'specifications' && (
              <div className="specifications-tab">
                <h3>Product Specifications</h3>
                <table className="specs-table">
                  <tbody>
                    <tr>
                      <td>SKU</td>
                      <td>{product.sku || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td>Category</td>
                      <td>{product.category}</td>
                    </tr>
                    {product.weight && (
                      <tr>
                        <td>Weight</td>
                        <td>{product.weight} kg</td>
                      </tr>
                    )}
                    {product.dimensions && (
                      <>
                        {product.dimensions.length && (
                          <tr>
                            <td>Dimensions</td>
                            <td>{product.dimensions.length} x {product.dimensions.width} x {product.dimensions.height} cm</td>
                          </tr>
                        )}
                      </>
                    )}
                    <tr>
                      <td>Merchant</td>
                      <td>{product.merchantName}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="reviews-tab">
                <h3>Customer Reviews</h3>
                <div className="reviews-summary">
                  <div className="rating-overview">
                    <span className="big-rating">4.0</span>
                    <div className="stars-large">★★★★☆</div>
                    <p>Based on 23 reviews</p>
                  </div>
                </div>
                
                <div className="review-placeholder">
                  <p>Reviews feature coming soon! Customers will be able to leave feedback and ratings here.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        <div className="related-products">
          <h3>You might also like</h3>
          <p>Related products feature coming soon!</p>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
