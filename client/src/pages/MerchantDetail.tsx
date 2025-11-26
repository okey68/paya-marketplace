import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Avatar,
  Rating,
  Chip,
  Divider,
  Card,
  CardMedia,
  CardContent,
  CardActions,
} from "@mui/material";
import {
  Store as StoreIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Verified as VerifiedIcon,
  ArrowBack as ArrowBackIcon,
  ShoppingCart as ShoppingCartIcon,
} from "@mui/icons-material";
import api from "../utils/api";
import toast from "react-hot-toast";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  images?: string[];
  category?: string;
  inventory?: {
    quantity: number;
    lowStockThreshold: number;
    trackInventory: boolean;
  };
  primaryImage?: string | null;
  stockStatus?: string;
  isAvailable?: boolean;
}

interface MerchantData {
  _id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  address?: {
    street?: string;
    city?: string;
    county?: string;
    postalCode?: string;
    country?: string;
  };
  businessInfo?: {
    businessName?: string;
    businessType?: string;
    tradingName?: string;
    businessEmail?: string;
    description?: string;
    logo?: string;
    approvalStatus?: string;
    industrialClassification?: string;
    industrialSector?: string;
    typeOfBusiness?: string;
    companyNumber?: string;
    registrationDate?: string;
  };
  stats?: {
    totalProducts: number;
    totalOrders: number;
    memberSince: string;
  };
}

const MerchantDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);

  const fetchMerchantDetails = async () => {
    try {
      const response = await api.get(`/merchants/${id}`);
      setMerchant(response.data.merchant || response.data);
    } catch (error) {
      console.error("Error fetching merchant details:", error);
      toast.error("Failed to load merchant details");
    } finally {
      setLoading(false);
    }
  };

  const fetchMerchantProducts = async () => {
    try {
      const response = await api.get(`/merchants/${id}/products`);
      setProducts(response.data.products || response.data || []);
    } catch (error) {
      console.error("Error fetching merchant products:", error);
      toast.error("Failed to load merchant products");
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchMerchantDetails();
    fetchMerchantProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const getMerchantInitials = (businessName?: string) => {
    if (!businessName) return "M";
    return businessName
      .split(" ")
      .map((word) => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const getMerchantStats = () => {
    return {
      products: merchant?.stats?.totalProducts || products.length || 0,
      orders: merchant?.stats?.totalOrders || 0,
      rating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
      reviews: Math.floor(Math.random() * 200) + 10,
    };
  };

  if (loading) {
    return (
      <Box sx={{ bgcolor: "#f9fafb", minHeight: "100vh" }}>
        <Container maxWidth="lg" sx={{ pt: 12, pb: 8, textAlign: "center" }}>
          <CircularProgress size={60} sx={{ mb: 2, color: "#4f46e5" }} />
          <Typography variant="h6" sx={{ color: "#64748b" }}>
            Loading merchant details...
          </Typography>
        </Container>
      </Box>
    );
  }

  if (!merchant) {
    return (
      <Box sx={{ bgcolor: "#f9fafb", minHeight: "100vh" }}>
        <Container maxWidth="lg" sx={{ pt: 12, pb: 8, textAlign: "center" }}>
          <StoreIcon sx={{ fontSize: 80, color: "#cbd5e1", mb: 2 }} />
          <Typography
            variant="h4"
            fontWeight={700}
            gutterBottom
            sx={{ color: "#0f172a" }}
          >
            Merchant Not Found
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: "#64748b" }}>
            The merchant you're looking for doesn't exist or has been removed.
          </Typography>
          <Button
            component={Link}
            to="/merchants"
            variant="contained"
            startIcon={<ArrowBackIcon />}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
              bgcolor: "#4f46e5",
              "&:hover": { bgcolor: "#4c1d95" },
            }}
          >
            Back to Merchants
          </Button>
        </Container>
      </Box>
    );
  }

  const stats = getMerchantStats();

  return (
    <Box sx={{ bgcolor: "#f9fafb", minHeight: "100vh", pt: 4, pb: 8 }}>
      <Container maxWidth="lg">
        {/* Back Button */}
        <Button
          component={Link}
          to="/merchants"
          startIcon={<ArrowBackIcon />}
          sx={{
            mb: 3,
            color: "#64748b",
            textTransform: "none",
            fontWeight: 600,
            "&:hover": { bgcolor: "transparent", color: "#4f46e5" },
          }}
        >
          Back to Merchants
        </Button>

        {/* Merchant Header */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 4,
            borderRadius: 3,
            border: "1px solid #e2e8f0",
          }}
        >
          <Box
            sx={{
              display: "flex",
              gap: 3,
              alignItems: "start",
              flexWrap: "wrap",
            }}
          >
            {merchant.businessInfo?.logo ? (
              <Avatar
                src={merchant.businessInfo.logo}
                alt={merchant.businessInfo?.businessName}
                sx={{ width: 120, height: 120 }}
              />
            ) : (
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  bgcolor: "#4f46e5",
                  fontSize: "2.5rem",
                }}
              >
                {getMerchantInitials(merchant.businessInfo?.businessName)}
              </Avatar>
            )}

            <Box sx={{ flex: 1 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <Typography
                  variant="h3"
                  fontWeight={700}
                  sx={{ color: "#0f172a" }}
                >
                  {merchant.businessInfo?.businessName || "Merchant Store"}
                </Typography>
                {merchant.businessInfo?.approvalStatus === "approved" && (
                  <VerifiedIcon sx={{ fontSize: 32, color: "#3b82f6" }} />
                )}
              </Box>

              <Chip
                label={merchant.businessInfo?.businessType || "General"}
                sx={{
                  mb: 2,
                  bgcolor: "#eff6ff",
                  color: "#3b82f6",
                  fontWeight: 600,
                }}
              />

              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <Rating
                  value={stats.rating}
                  precision={0.1}
                  size="medium"
                  readOnly
                />
                <Typography variant="body1" sx={{ color: "#64748b" }}>
                  {stats.rating} ({stats.reviews} reviews)
                </Typography>
              </Box>

              <Typography
                variant="body1"
                sx={{ mb: 3, color: "#64748b", lineHeight: 1.7 }}
              >
                {merchant.businessInfo?.description ||
                  "Quality products and excellent service from a trusted merchant."}
              </Typography>

              <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                {merchant.address?.city && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LocationIcon sx={{ color: "#64748b", fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: "#64748b" }}>
                      {merchant.address.city}, {merchant.address.country}
                    </Typography>
                  </Box>
                )}
                {merchant.businessInfo?.businessEmail && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <EmailIcon sx={{ color: "#64748b", fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: "#64748b" }}>
                      {merchant.businessInfo.businessEmail}
                    </Typography>
                  </Box>
                )}
                {merchant.phoneNumber && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <PhoneIcon sx={{ color: "#64748b", fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: "#64748b" }}>
                      {merchant.phoneNumber}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Stats */}
          <Box sx={{ display: "flex", gap: 4, justifyContent: "center" }}>
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="h4"
                fontWeight={700}
                sx={{ color: "#0f172a" }}
              >
                {stats.products}
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748b" }}>
                Products
              </Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="h4"
                fontWeight={700}
                sx={{ color: "#0f172a" }}
              >
                {stats.orders}
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748b" }}>
                Orders
              </Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="h4"
                fontWeight={700}
                sx={{ color: "#0f172a" }}
              >
                {stats.rating}
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748b" }}>
                Rating
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Products Section */}
        <Typography
          variant="h4"
          fontWeight={700}
          sx={{ mb: 3, color: "#0f172a" }}
        >
          Products
        </Typography>

        {productsLoading ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CircularProgress size={40} sx={{ color: "#4f46e5" }} />
          </Box>
        ) : products && products.length > 0 ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
              },
              gap: 3,
            }}
          >
            {products.map((product) => (
              <Card
                key={product._id}
                elevation={0}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 3,
                  border: "1px solid #e2e8f0",
                  transition: "all 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                  },
                }}
              >
                {product.primaryImage ||
                (product.images && product.images.length > 0) ? (
                  <CardMedia
                    component="img"
                    height="200"
                    image={product.primaryImage || product.images?.[0]}
                    alt={product.name}
                    sx={{ objectFit: "cover" }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 200,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "#f1f5f9",
                    }}
                  >
                    <ShoppingCartIcon sx={{ fontSize: 80, color: "#cbd5e1" }} />
                  </Box>
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    gutterBottom
                    sx={{ color: "#0f172a" }}
                  >
                    {product.name}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, color: "#64748b" }}>
                    {product.description}
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight={700}
                    sx={{ color: "#4f46e5" }}
                  >
                    KES {product.price?.toLocaleString()}
                  </Typography>
                  {product.inventory?.trackInventory && (
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          product.stockStatus === "in_stock"
                            ? "#10b981"
                            : "#ef4444",
                        display: "block",
                        mt: 0.5,
                      }}
                    >
                      {product.inventory.quantity > 0
                        ? `${product.inventory.quantity} in stock`
                        : "Out of stock"}
                    </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ p: 2 }}>
                  <Button
                    component={Link}
                    to={`/product/${product._id}`}
                    fullWidth
                    variant="contained"
                    startIcon={<ShoppingCartIcon />}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 2,
                      bgcolor: "#4f46e5",
                      "&:hover": { bgcolor: "#4c1d95" },
                    }}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Box>
        ) : (
          <Paper
            elevation={0}
            sx={{
              textAlign: "center",
              py: 8,
              borderRadius: 3,
              border: "1px solid #e2e8f0",
            }}
          >
            <ShoppingCartIcon sx={{ fontSize: 80, color: "#cbd5e1", mb: 2 }} />
            <Typography
              variant="h5"
              fontWeight={700}
              gutterBottom
              sx={{ color: "#0f172a" }}
            >
              No Products Available
            </Typography>
            <Typography variant="body1" sx={{ color: "#64748b" }}>
              This merchant hasn't listed any products yet.
            </Typography>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default MerchantDetail;
