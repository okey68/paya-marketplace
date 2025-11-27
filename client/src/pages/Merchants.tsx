import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Chip,
  CircularProgress,
  InputAdornment,
  Avatar,
  Rating,
} from "@mui/material";
import {
  Search as SearchIcon,
  Store as StoreIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import api from "../utils/api";
import toast from "react-hot-toast";

interface Merchant {
  _id: string;
  businessInfo?: {
    businessName?: string;
    businessType?: string;
    description?: string;
    logo?: string;
    location?: string;
    approvalStatus?: string;
  };
}

const Merchants = () => {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const categories = [
    "All Categories",
    "Electronics",
    "Appliances",
    "Clothing",
    "Cosmetics",
    "Medical Care",
    "Services",
    "Other",
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    try {
      const response = await api.get("/merchants/public");
      const merchantsData = response.data.merchants || response.data || [];
      setMerchants(Array.isArray(merchantsData) ? merchantsData : []);
    } catch (error) {
      console.error("Error fetching merchants:", error);
      toast.error("Failed to load merchants");
    } finally {
      setLoading(false);
    }
  };

  const filteredMerchants = merchants.filter((merchant) => {
    const matchesSearch =
      merchant.businessInfo?.businessName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      merchant.businessInfo?.businessType
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      merchant.businessInfo?.description
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "" ||
      selectedCategory === "All Categories" ||
      merchant.businessInfo?.businessType === selectedCategory;

    return (
      matchesSearch &&
      matchesCategory &&
      merchant.businessInfo?.approvalStatus === "approved"
    );
  });

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
      products: Math.floor(Math.random() * 50) + 5,
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
            Loading trusted merchants...
          </Typography>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "white", minHeight: "100vh", marginTop: "-68px" }}>
      {/* Featured Merchants Logos */}
      <Container maxWidth="lg" sx={{ pt: 4, mb: 6
       }}>
        <Typography
          variant="h5"
          fontWeight={700}
          textAlign="start"
          gutterBottom
          sx={{ color: "#0f172a" }}
        >
          Featured Merchants
        </Typography>
        <Typography
          variant="body2"
          textAlign="start"
          sx={{ color: "#64748b", mb: 4 }}
        >
          Shop from our verified and trusted merchant partners
        </Typography>
        {/* <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(3, 1fr)",
              md: "repeat(4, 1fr)",
              lg: "repeat(6, 1fr)",
            },
            gap: 2,
          }}
        >
          {filteredMerchants.slice(0, 12).map((merchant) => (
            <Paper
              key={merchant._id}
              component={Link}
              to={`/merchant/${merchant._id}`}
              elevation={0}
              sx={{
                p: 2,
                bgcolor: "white",
                borderRadius: 3,
                textAlign: "center",
                textDecoration: "none",
                transition: "all 0.2s",
                border: "1px solid #e2e8f0",
                boxShadow: "none",
                "&:hover": {
                  borderColor: "#4f46e5",
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                },
              }}
            >
              {merchant.businessInfo?.logo ? (
                <Avatar
                  src={merchant.businessInfo.logo}
                  alt={merchant.businessInfo?.businessName}
                  sx={{ width: 60, height: 60, mx: "auto", mb: 1 }}
                />
              ) : (
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    mx: "auto",
                    mb: 1,
                    bgcolor: "#4f46e5",
                  }}
                >
                  {getMerchantInitials(merchant.businessInfo?.businessName)}
                </Avatar>
              )}
              <Typography
                variant="caption"
                fontWeight={600}
                sx={{ display: "block", color: "#0f172a" }}
              >
                {merchant.businessInfo?.businessName}
              </Typography>
            </Paper>
          ))}
        </Box> */}
      </Container>

      {/* Merchant Directory */}
      <Container maxWidth="lg" sx={{ mb: 6 }}>
        {/* <Typography
          variant="h4"
          fontWeight={700}
          textAlign="center"
          gutterBottom
          sx={{ color: "#0f172a" }}
        >
          Merchant Directory
        </Typography>
        <Typography
          variant="body1"
          textAlign="center"
          sx={{ mb: 4, color: "#64748b" }}
        >
          Browse all our trusted merchant partners
        </Typography> */}

        {/* Search Bar */}
        <Box
          sx={{
            mb: 3,
            p: 3,
            bgcolor: "white",
            borderRadius: 3,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <TextField
            fullWidth
            placeholder="Search merchants by name or business type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#64748b" }} />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                "&:hover fieldset": {
                  borderColor: "#4f46e5",
                },
              },
            }}
          />

          {/* Category Filters */}
          {/* <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 3 }}>
            {categories.map((category) => (
              <Chip
                key={category}
                label={category}
                onClick={() =>
                  setSelectedCategory(
                    category === "All Categories" ? "" : category
                  )
                }
                sx={{
                  cursor: "pointer",
                  bgcolor:
                    selectedCategory === category ||
                    (category === "All Categories" && selectedCategory === "")
                      ? "#eff6ff"
                      : "#f9fafb",
                  color:
                    selectedCategory === category ||
                    (category === "All Categories" && selectedCategory === "")
                      ? "#3b82f6"
                      : "#64748b",
                  fontWeight: 600,
                  border: "1px solid",
                  borderColor:
                    selectedCategory === category ||
                    (category === "All Categories" && selectedCategory === "")
                      ? "#3b82f6"
                      : "#e2e8f0",
                  "&:hover": {
                    bgcolor: "#eff6ff",
                    borderColor: "#3b82f6",
                  },
                }}
              />
            ))}
          </Box> */}
        </Box>

        {/* Merchants Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            },
            gap: 3,
          }}
        >
          {filteredMerchants.map((merchant) => {
            const stats = getMerchantStats();
            return (
              <Paper
                key={merchant._id}
                elevation={0}
                sx={{
                  p: 3,
                  bgcolor: "white",
                  borderRadius: 3,
                  textDecoration: "none",
                  transition: "all 0.2s",
                  border: "1px solid #e2e8f0",
                  boxShadow: "none",
                  "&:hover": {
                    borderColor: "#cbd5e1",
                    transform: "translateY(-4px)",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                  },
                }}
              >
                <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                  {merchant.businessInfo?.logo ? (
                    <Avatar
                      src={merchant.businessInfo.logo}
                      alt={merchant.businessInfo?.businessName}
                      sx={{ width: 64, height: 64 }}
                    />
                  ) : (
                    <Avatar
                      sx={{
                        width: 64,
                        height: 64,
                        bgcolor: "#4f46e5",
                        fontSize: "1.5rem",
                      }}
                    >
                      {getMerchantInitials(merchant.businessInfo?.businessName)}
                    </Avatar>
                  )}
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      gutterBottom
                      sx={{ color: "#0f172a" }}
                    >
                      {merchant.businessInfo?.businessName}
                    </Typography>
                    <Typography
                      variant="body2"
                      gutterBottom
                      sx={{ color: "#64748b" }}
                    >
                      {merchant.businessInfo?.businessType || "General"}
                    </Typography>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Rating
                        value={stats.rating}
                        precision={0.1}
                        size="small"
                        readOnly
                      />
                      <Typography variant="caption" sx={{ color: "#64748b" }}>
                        ({stats.rating}) • {stats.reviews} reviews
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Typography
                  variant="body2"
                  sx={{ mb: 2, minHeight: 40, color: "#64748b" }}
                >
                  {merchant.businessInfo?.description ||
                    "Quality products and excellent service"}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Box sx={{ textAlign: "center" }}>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      sx={{ color: "#0f172a" }}
                    >
                      {stats.products}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      Products
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      sx={{ color: "#0f172a" }}
                    >
                      {stats.rating}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      Rating
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      sx={{ fontSize: "0.9rem", color: "#0f172a" }}
                    >
                      {merchant.businessInfo?.location || "Nairobi"}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      Location
                    </Typography>
                  </Box>
                </Box>

                <Button
                  component={Link}
                  to={`/merchants/${merchant._id}`}
                  variant="contained"
                  fullWidth
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: 2,
                    bgcolor: "#4f46e5",
                    boxShadow: "none",
                    "&:hover": {
                      bgcolor: "#4f46e5",
                      boxShadow: "none",
                    },
                  }}
                >
                  Visit Store
                </Button>
              </Paper>
            );
          })}
        </Box>

        {/* Empty State */}
        {filteredMerchants.length === 0 && (
          <Paper
            elevation={0}
            sx={{
              textAlign: "center",
              py: 8,
              bgcolor: "white",
              borderRadius: 3,
              border: "1px solid #e2e8f0",
            }}
          >
            <StoreIcon sx={{ fontSize: 80, color: "#cbd5e1", mb: 2 }} />
            <Typography
              variant="h5"
              fontWeight={700}
              gutterBottom
              sx={{ color: "#0f172a" }}
            >
              No Merchants Found
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: "#64748b" }}>
              Try adjusting your search or filter criteria
            </Typography>
            <Button
              variant="contained"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("");
              }}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                bgcolor: "#4f46e5",
                boxShadow: "none",
                "&:hover": {
                  bgcolor: "#4f46e5",
                  boxShadow: "none",
                },
              }}
            >
              Clear Filters
            </Button>
          </Paper>
        )}
      </Container>

      {/* CTA Section */}
      <Box sx={{ bgcolor: "#f8f4ff", py: 8 }}>
        <Container maxWidth="md" sx={{ textAlign: "center" }}>
          <Typography
            variant="h4"
            fontWeight={700}
            gutterBottom
            sx={{ color: "#0f172a" }}
          >
            Want to Join Our Merchant Network?
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: "#64748b" }}>
            Start selling your products to thousands of customers across Kenya
          </Typography>
          <Button
            component={Link}
            to="/merchant/register"
            variant="contained"
            size="large"
            endIcon={<ArrowForwardIcon />}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
              px: 4,
              py: 1.5,
              bgcolor: "#4f46e5",
              boxShadow: "none",
              "&:hover": {
                bgcolor: "#4f46e5",
                boxShadow: "none",
              },
            }}
          >
            Become a Merchant
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default Merchants;
