import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Chip,
  Box,
  Skeleton,
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Store as StoreIcon,
} from '@mui/icons-material';

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
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Skeleton variant="rectangular" height={240} />
        <CardContent sx={{ flexGrow: 1 }}>
          <Skeleton variant="text" height={32} />
          <Skeleton variant="text" height={24} width="60%" />
          <Skeleton variant="text" height={20} />
        </CardContent>
        <CardActions>
          <Skeleton variant="rectangular" width="100%" height={36} />
        </CardActions>
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
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px rgba(102, 126, 234, 0.15)',
          borderColor: 'primary.main',
          '& .product-image': {
            transform: 'scale(1.05)',
          },
        },
      }}
      onClick={handleViewProduct}
    >
      {/* Image Container */}
      <Box
        sx={{
          position: 'relative',
          paddingTop: '75%', // 4:3 aspect ratio
          bgcolor: 'grey.50',
          overflow: 'hidden',
        }}
      >
        {/* Wishlist Button */}
        <IconButton
          onClick={handleToggleWishlist}
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 2,
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: 'white',
              transform: 'scale(1.1)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            },
          }}
          size="small"
        >
          {isInWishlist ? (
            <FavoriteIcon sx={{ color: 'error.main', fontSize: 20 }} />
          ) : (
            <FavoriteBorderIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
          )}
        </IconButton>

        {/* Stock Status Badge */}
        {isOutOfStock && (
          <Chip
            label="Out of Stock"
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              zIndex: 2,
              bgcolor: 'error.main',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />
        )}

        {/* Category Badge */}
        {product.category && !isOutOfStock && (
          <Chip
            label={product.category}
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              zIndex: 2,
              bgcolor: 'rgba(102, 126, 234, 0.95)',
              backdropFilter: 'blur(8px)',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          />
        )}

        {/* Product Image */}
        {hasImage && !imageError ? (
          <CardMedia
            component="img"
            image={imageUrl}
            alt={product.name}
            onError={() => setImageError(true)}
            className="product-image"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        ) : (
          <Box
            className="product-image"
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
              bgcolor: 'grey.100',
            }}
          >
            <Typography sx={{ fontSize: '4rem' }}>🛍️</Typography>
            <Typography variant="caption" color="text.secondary">
              No image available
            </Typography>
          </Box>
        )}
      </Box>

      {/* Product Info */}
      <CardContent sx={{ flexGrow: 1, p: 2.5, pb: 2 }}>
        <Typography
          variant="h6"
          component="h3"
          sx={{
            fontWeight: 600,
            fontSize: '1.1rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            minHeight: '3.3em',
            lineHeight: 1.5,
            mb: 1.5,
            color: 'text.primary',
          }}
        >
          {product.name}
        </Typography>

        {product.merchantName && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
            <StoreIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: '0.875rem' }}
            >
              {product.merchantName}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 1 }}>
          <Typography
            variant="h5"
            component="div"
            sx={{ 
              fontWeight: 700,
              color: 'primary.main',
              fontSize: '1.5rem',
            }}
          >
            {formatPrice(product.price, product.currency)}
          </Typography>
        </Box>

        {product.inventory && product.inventory.quantity > 0 && product.inventory.quantity <= 10 && (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              bgcolor: 'warning.lighter',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              mt: 1,
            }}
          >
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'warning.dark',
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
            >
              Only {product.inventory.quantity} left
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ p: 2.5, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          startIcon={<CartIcon />}
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          sx={{
            py: 1.25,
            fontWeight: 600,
            fontSize: '0.95rem',
            textTransform: 'none',
            borderRadius: 1.5,
            '&:hover': {
              transform: 'translateY(-1px)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
            transition: 'all 0.2s',
          }}
        >
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </CardActions>
    </Card>
  );
};

export default ProductCard;
