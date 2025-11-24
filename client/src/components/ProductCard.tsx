import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  IconButton,
  Box,
  Skeleton,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    description?: string;
    price: number;
    currency?: string;
    images?: string[];
    primaryImage?: string;
    category?: string;
    merchantName?: string;
    stockStatus?: string;
    inventory?: {
      quantity: number;
    };
  };
  onAddToCart?: (product: any) => void;
  onToggleWishlist?: (productId: string) => void;
  isInWishlist?: boolean;
  loading?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onToggleWishlist,
  isInWishlist = false,
  loading = false,
}) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const { items } = useCart();

  // Check if product is in cart
  const isInCart = items.some((item: any) => 
    (item.id === product._id || item.product?._id === product._id)
  );

  const formatPrice = (price: number, currency: string = 'KES') => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleViewProduct = () => {
    navigate(`/product/${product._id}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleWishlist) {
      onToggleWishlist(product._id);
    }
  };

  const isOutOfStock = product.stockStatus === 'out_of_stock' || 
                       (product.inventory && product.inventory.quantity === 0);

  const imageUrl = product.primaryImage || product.images?.[0];
  const hasImage = !!imageUrl;

  if (loading) {
    return (
      <Card 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: 3,
          border: '1px solid',
          borderColor: '#e2e8f0',
          boxShadow: 'none',
        }}
      >
        <Skeleton variant="rectangular" height={200} />
        <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
          <Skeleton variant="text" height={24} />
          <Skeleton variant="text" height={20} width="60%" />
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Skeleton variant="rectangular" width={44} height={44} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rectangular" height={44} sx={{ flex: 1, borderRadius: 2 }} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        borderRadius: 3,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: '#e2e8f0',
        bgcolor: 'white',
        boxShadow: 'none',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          borderColor: '#cbd5e1',
        },
      }}
      onClick={handleViewProduct}
    >
      {/* Image Container */}
      <Box
        sx={{
          position: 'relative',
          paddingTop: '75%',
          bgcolor: '#f1f5f9',
          overflow: 'hidden',
        }}
      >
        {/* Product Image */}
        {hasImage && !imageError ? (
          <CardMedia
            component="img"
            image={imageUrl}
            alt={product.name}
            onError={() => setImageError(true)}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 1,
              bgcolor: '#f3f4f6',
            }}
          >
            <Typography sx={{ fontSize: '3rem' }}>🛍️</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              No image
            </Typography>
          </Box>
        )}
      </Box>

      {/* Product Info */}
      <CardContent sx={{ 
        flexGrow: 1, 
        p: 2, 
        pb: 1.5,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Title and Price Row */}
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'start', alignItems: 'start', mb: 0.5, gap: 0.5 }}>
          <Typography
            variant="h6"
            component="h3"
            sx={{
              fontWeight: 600,
              fontSize: '16px',
              color: '#0f172a',
              lineHeight: 1.3,
              flex: 1,
            }}
          >
            {product.name}
          </Typography>
          <Typography
            variant="h6"
            component="div"
            sx={{ 
              fontWeight: 700,
              color: '#0f172a',
              fontSize: '16px',
              // ml: 1,
              whiteSpace: 'nowrap',
            }}
          >
            {formatPrice(product.price, product.currency)}
          </Typography>
        </Box>

        {/* Merchant Name as Description */}
        <Typography 
          variant="body2" 
          sx={{ 
            fontSize: '0.8rem',
            color: '#64748b',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            minHeight: '2.3em',
            lineHeight: 1.35,
            mb: 1.5,
          }}
        >
          {product.merchantName || 'Quality product from verified merchant'}
        </Typography>

        {/* Actions Row */}
        <Box sx={{ 
          display: 'flex', 
          gap: 1,
          marginTop: 'auto',
        }}>
          {/* Wishlist Button */}
          <IconButton
            onClick={handleToggleWishlist}
            sx={{
              bgcolor: isInWishlist ? '#fce7f3' : '#f1f5f9',
              width: 44,
              height: 44,
              borderRadius: 2,
              flexShrink: 0,
              '&:hover': {
                bgcolor: isInWishlist ? '#fce7f3' : '#e2e8f0',
              },
            }}
          >
            {isInWishlist ? (
              <FavoriteIcon sx={{ color: '#ec4899', fontSize: 20 }} />
            ) : (
              <FavoriteBorderIcon sx={{ fontSize: 20, color: '#64748b' }} />
            )}
          </IconButton>

          {/* Add to Cart Button */}
          <Button
            fullWidth
            variant="contained"
            onClick={handleAddToCart}
            disabled={isOutOfStock || isInCart}
            startIcon={isInCart ? <CheckCircleIcon /> : undefined}
            sx={{
              py: 1,
              fontWeight: 600,
              fontSize: '0.8125rem',
              textTransform: 'none',
              borderRadius: 2,
              bgcolor: isInCart ? '#10b981' : '#5b21b6',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: isInCart ? '#059669' : '#4c1d95',
                boxShadow: 'none',
              },
              '&:disabled': {
                bgcolor: isInCart ? '#10b981' : '#e2e8f0',
                color: isInCart ? 'white' : '#94a3b8',
                opacity: isInCart ? 1 : 0.6,
              },
            }}
          >
            {isOutOfStock ? 'Out of Stock' : isInCart ? 'Added to cart' : 'Add to cart'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
