import React from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Button
} from "@mui/material";
import { ArrowForward as ArrowForwardIcon } from "@mui/icons-material";

interface HeroSectionProps {
  user: any;
}

const HeroSection: React.FC<HeroSectionProps> = ({ user }) => {
  return (
    <Box
      sx={{
        background:
          "linear-gradient(to bottom, #ffffff 0%, #f0f9ff 50%, #faf5ff 100%)",
        pt: { xs: "80px", md: "50px" },
        pb: { xs: 12, md: 16 },
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 5 } }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" },
            gap: { xs: 8, lg: 6 },
            alignItems: "center",
          }}
        >
          {/* Left Content */}
          <Box>
            <Box
              sx={{
                maxWidth: "768px",
                mx: { xs: "auto", lg: 0 },
                textAlign: { xs: "center", lg: "left" },
              }}
            >
              {/* Overline */}
              <Box
                sx={{
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: { xs: "center", lg: "flex-start" },
                }}
              >
                <Typography
                  component="span"
                  sx={{
                    display: "inline-block",
                    transform: "rotate(90deg)",
                    mr: 1,
                    color: "primary.main",
                    fontWeight: 500,
                  }}
                >
                  |
                </Typography>
                <Typography
                  variant="overline"
                  sx={{
                    fontWeight: 600,
                    color: "#4f46e5",
                    letterSpacing: "0.1em",
                    fontSize: "0.85rem",
                  }}
                >
                  PLATFORM THAT HELPS YOUR BUSINESS GROW
                </Typography>
              </Box>

              {/* Main Heading */}
              <Typography
                variant="h1"
                sx={{
                  color: "#0f172a",
                  fontSize: { xs: "2.25rem", md: "3rem" },
                  fontWeight: 700,
                  lineHeight: 1.2,
                  mb: 2,
                }}
              >
                Shop Now, Pay Later with {" "}
                <span style={{ color: "#4f46e5" }}>PAYA</span>
              </Typography>

              {/* Description */}
              <Typography
                variant="body1"
                sx={{
                  color: "#475569",
                  fontSize: "1rem",
                  lineHeight: 1.75,
                  mt: 3,
                }}
              >
                Our intuitive platform streamlines every aspect of your shopping
                experience. Effortlessly browse products, apply for credit, and
                manage payments through your employer's payroll system. Connect
                meaningfully with trusted Kenyan merchants.
              </Typography>

              {/* CTA Buttons */}
              <Box
                sx={{
                  mt: 6,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 3,
                  justifyContent: { xs: "center", lg: "flex-start" },
                }}
              >
                <Button
                  component={Link}
                  to="/marketplace"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    bgcolor: "#4f46e5",
                    color: "white",
                    px: 3,
                    py: 1.5,
                    fontSize: "1rem",
                    fontWeight: 600,
                    borderRadius: 2,
                    border: "1px solid #4338ca",
                    textTransform: "none",
                    boxShadow: "none",
                    "&:hover": {
                      bgcolor: "#4338ca",
                      boxShadow: "none",
                    },
                  }}
                >
                  Get Started Free
                </Button>
                <Button
                  component={Link}
                  to="/merchants"
                  variant="outlined"
                  size="large"
                  sx={{
                    borderColor: "#9ca3af",
                    color: "#0f172a",
                    px: 3,
                    py: 1.5,
                    fontSize: "1rem",
                    fontWeight: 600,
                    borderRadius: 2,
                    textTransform: "none",
                    "&:hover": {
                      borderColor: "#4338ca",
                      bgcolor: "transparent",
                    },
                  }}
                >
                  View Merchants
                </Button>
              </Box>

              {/* Trust Indicators */}
              {/* <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  justifyContent: { xs: "center", lg: "flex-start" },
                  gap: 2,
                  mt: 4,
                }}
              >
                <AvatarGroup
                  max={3}
                  sx={{
                    "& .MuiAvatar-root": {
                      width: 40,
                      height: 40,
                      border: "2px solid white",
                      fontSize: "0.9rem",
                    },
                  }}
                >
                  <Avatar
                    alt="User 1"
                    src="https://i.pravatar.cc/150?img=1"
                    sx={{ bgcolor: "#4f46e5" }}
                  />
                  <Avatar
                    alt="User 2"
                    src="https://i.pravatar.cc/150?img=2"
                    sx={{ bgcolor: "#7c3aed" }}
                  />
                  <Avatar
                    alt="User 3"
                    src="https://i.pravatar.cc/150?img=3"
                    sx={{ bgcolor: "#ec4899" }}
                  />
                </AvatarGroup>
                <Typography
                  variant="body2"
                  sx={{
                    color: "#475569",
                    fontSize: "1rem",
                  }}
                >
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    Over 10,000
                  </Box>{" "}
                  Professionals trust us
                </Typography>
              </Box> */}
            </Box>
          </Box>

          {/* Right Image */}
          <Box
            sx={{
              width: "100%",
              aspectRatio: "42/33",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box
              component="img"
              src="https://mockuuups.studio/cdn-cgi/image/format=auto/web-cdn/images/header-iphone-mockups-2-p-1080.png"
              //   src="https://readymadeui.com/images/mobile-app-img-5.webp"
              //   src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop"
              alt="Paya Marketplace"
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                borderRadius: "50px",
                margin: "10px",
              }}
            />
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default HeroSection;
