import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const AddEditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    sku: '',
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    },
    tags: [],
    images: [],
    status: 'active'
  });

  const [newTag, setNewTag] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);

  const categories = [
    'Electronics',
    'Fashion',
    'Home & Garden',
    'Sports & Outdoors',
    'Books',
    'Health & Beauty',
    'Toys & Games',
    'Automotive',
    'Food & Beverages',
    'Art & Crafts',
    'Other'
  ];

  useEffect(() => {
    if (isEdit) {
      fetchProduct();
    }
  }, [id, isEdit]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/products/${id}`);
      const productData = response.data;
      
      setProduct({
        ...productData,
        price: productData.price.toString(),
        stock: productData.stock.toString(),
        weight: productData.weight?.toString() || '',
        dimensions: {
          length: productData.dimensions?.length?.toString() || '',
          width: productData.dimensions?.width?.toString() || '',
          height: productData.dimensions?.height?.toString() || ''
        }
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setProduct(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setProduct(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !product.tags.includes(newTag.trim())) {
      setProduct(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setProduct(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleImageUpload = async (files) => {
    if (files.length === 0) return;

    setUploadingImages(true);
    const uploadedImageIds = [];

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await axios.post('/uploads/product-image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        uploadedImageIds.push(response.data.file.id);
      }

      setProduct(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedImageIds]
      }));

      toast.success(`${uploadedImageIds.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = (imageId) => {
    setProduct(prev => ({
      ...prev,
      images: prev.images.filter(id => id !== imageId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!product.name || !product.description || !product.price || !product.category || !product.stock) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const productData = {
        ...product,
        price: parseFloat(product.price),
        stock: parseInt(product.stock),
        weight: product.weight ? parseFloat(product.weight) : undefined,
        dimensions: {
          length: product.dimensions.length ? parseFloat(product.dimensions.length) : undefined,
          width: product.dimensions.width ? parseFloat(product.dimensions.width) : undefined,
          height: product.dimensions.height ? parseFloat(product.dimensions.height) : undefined
        }
      };

      if (isEdit) {
        await axios.put(`/products/${id}`, productData);
        toast.success('Product updated successfully');
      } else {
        await axios.post('/products', productData);
        toast.success('Product created successfully');
      }

      navigate('/products');
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className="add-product">
        <div className="loading-spinner">Loading product...</div>
      </div>
    );
  }

  return (
    <div className="add-product">
      <div className="page-header">
        <h1>{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
        <button 
          className="btn btn-secondary"
          onClick={() => navigate('/products')}
        >
          Back to Products
        </button>
      </div>

      <form onSubmit={handleSubmit} className="product-form">
        {/* Basic Information */}
        <div className="form-section">
          <h2>Basic Information</h2>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Product Name *</label>
              <input
                type="text"
                value={product.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="form-group">
              <label>SKU (Optional)</label>
              <input
                type="text"
                value={product.sku}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                placeholder="Product SKU"
              />
            </div>

            <div className="form-group full-width">
              <label>Description *</label>
              <textarea
                value={product.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your product"
                rows="4"
                required
              />
            </div>

            <div className="form-group">
              <label>Category *</label>
              <select
                value={product.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                required
              >
                <option value="">Select category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={product.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pricing and Inventory */}
        <div className="form-section">
          <h2>Pricing & Inventory</h2>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Price (KSh) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={product.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="form-group">
              <label>Stock Quantity *</label>
              <input
                type="number"
                min="0"
                value={product.stock}
                onChange={(e) => handleInputChange('stock', e.target.value)}
                placeholder="0"
                required
              />
            </div>

            <div className="form-group">
              <label>Weight (kg)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={product.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Dimensions */}
        <div className="form-section">
          <h2>Dimensions (cm)</h2>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Length</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={product.dimensions.length}
                onChange={(e) => handleInputChange('dimensions.length', e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>Width</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={product.dimensions.width}
                onChange={(e) => handleInputChange('dimensions.width', e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>Height</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={product.dimensions.height}
                onChange={(e) => handleInputChange('dimensions.height', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="form-section">
          <h2>Tags</h2>
          
          <div className="tags-input">
            <div className="add-tag">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <button type="button" onClick={handleAddTag}>Add</button>
            </div>
            
            <div className="tags-list">
              {product.tags.map(tag => (
                <span key={tag} className="tag">
                  {tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)}>×</button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="form-section">
          <h2>Product Images</h2>
          
          <div className="image-upload">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleImageUpload(Array.from(e.target.files))}
              disabled={uploadingImages}
            />
            
            {uploadingImages && <p>Uploading images...</p>}
            
            <div className="uploaded-images">
              {product.images.map(imageId => (
                <div key={imageId} className="image-preview">
                  <img 
                    src={`/api/uploads/${imageId}`} 
                    alt="Product"
                    onError={(e) => {
                      e.target.src = '/placeholder-product.png';
                    }}
                  />
                  <button 
                    type="button" 
                    className="remove-image"
                    onClick={() => handleRemoveImage(imageId)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => navigate('/products')}
          >
            Cancel
          </button>
          
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEditProduct;
