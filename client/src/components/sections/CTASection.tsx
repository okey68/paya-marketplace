import React from "react";
import { Link } from "react-router-dom";
import { Container, Box, Typography, Button } from "@mui/material";
import { ArrowForward as ArrowForwardIcon } from "@mui/icons-material";

const CTASection: React.FC = () => {
  return (
    <Box
      sx={{
        position: "relative",
        color: "white",
        py: 10,
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      {/* Background with overlay */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            "url(https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1600&h=600&fit=crop)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          "&::after": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
          },
        }}
      />

      <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
        <Typography
          variant="h3"
          fontWeight={800}
          gutterBottom
          sx={{ fontSize: { xs: "2rem", md: "3rem" } }}
        >
          Ready to Start Shopping?
        </Typography>
        <Typography
          variant="h6"
          sx={{ mb: 4, opacity: 0.9, fontWeight: 400, lineHeight: 1.6 }}
        >
          Join thousands of satisfied customers shopping with Paya's flexible
          payment solutions
        </Typography>
        <Box
          sx={{
            display: "flex",
            gap: 3,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Button
            component={Link}
            to="/marketplace"
            variant="contained"
            // color="primary"
            size="large"
            endIcon={<ArrowForwardIcon />}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: "1.1rem",
              fontWeight: 600,
              borderRadius: 2,
              bgcolor: "#667FEA",
              boxShadow: "0 4px 14px rgba(102, 126, 234, 0.5)",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 6px 20px rgba(102, 126, 234, 0.6)",
              },
              transition: "all 0.3s ease",
            }}
          >
            Browse Products
          </Button>
          <Button
            component={Link}
            to="/register?role=merchant"
            variant="outlined"
            size="large"
            sx={{
              borderColor: "white",
              color: "white",
              px: 4,
              py: 1.5,
              fontSize: "1.1rem",
              fontWeight: 600,
              borderRadius: 2,
              borderWidth: 2,
              "&:hover": {
                borderColor: "white",
                borderWidth: 2,
                bgcolor: "rgba(255, 255, 255, 0.1)",
                transform: "translateY(-2px)",
              },
              transition: "all 0.3s ease",
            }}
          >
            Become a Merchant
          </Button>
        </Box>

        {/* Stats Section */}
        {/* <Box 
          sx={{ 
            mt: 8, 
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
            gap: 4,
          }}
        >
          {[
            { number: '10,000+', label: 'Happy Customers' },
            { number: '500+', label: 'Trusted Merchants' },
            { number: '99%', label: 'Satisfaction Rate' },
          ].map((stat, index) => (
            <Box key={index}>
              <Typography variant="h3" fontWeight={800} gutterBottom>
                {stat.number}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {stat.label}
              </Typography>
            </Box>
          ))}
        </Box> */}
      </Container>
    </Box>
  );
};

export default CTASection;
