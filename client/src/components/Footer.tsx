import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Link,
  Divider,
  IconButton,
  Stack,
} from '@mui/material';import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Twitter as TwitterIcon,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
} from '@mui/icons-material';

const Footer = () => {
  const footerSections = [
    {
      title: 'For Customers',
      links: [
        { label: 'Browse Products', path: '/marketplace' },
        { label: 'How BNPL Works', path: '/how-it-works' },
        { label: 'Customer Support', path: '/support' },
        { label: 'Track Your Order', path: '/track-order' },
      ],
    },
    {
      title: 'For Merchants',
      links: [
        { label: 'Become a Seller', path: '/register?role=merchant' },
        { label: 'Seller Resources', path: '/seller-resources' },
        { label: 'Fee Structure', path: '/fees' },
        { label: 'Merchant Support', path: '/merchant-support' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', path: '/about' },
        { label: 'Careers', path: '/careers' },
        { label: 'Privacy Policy', path: '/privacy' },
        { label: 'Terms of Service', path: '/terms' },
      ],
    },
  ];

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'grey.900',
        color: 'grey.300',
        py: 6,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
            },
            gap: 4,
          }}
        >
          {/* Company Info */}
          <Box>
            <Typography
              variant="h6"
              color="grey.100"
              gutterBottom
              fontWeight={600}
            >
              Paya Marketplace
            </Typography>
            <Typography
              variant="body2"
              color="grey.400"
              sx={{ mb: 2, lineHeight: 1.7 }}
            >
              Kenya's premier marketplace connecting businesses with customers
              through innovative BNPL solutions.
            </Typography>
            <Stack direction="row" spacing={1}>
              <IconButton
                component="a"
                href="mailto:info@paya.com"
                size="small"
                sx={{ color: 'grey.400', '&:hover': { color: 'primary.main' } }}
              >
                <EmailIcon />
              </IconButton>
              <IconButton
                component="a"
                href="tel:+254700000000"
                size="small"
                sx={{ color: 'grey.400', '&:hover': { color: 'primary.main' } }}
              >
                <PhoneIcon />
              </IconButton>
              <IconButton
                component="a"
                href="https://twitter.com/paya"
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                sx={{ color: 'grey.400', '&:hover': { color: 'primary.main' } }}
              >
                <TwitterIcon />
              </IconButton>
              <IconButton
                component="a"
                href="https://facebook.com/paya"
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                sx={{ color: 'grey.400', '&:hover': { color: 'primary.main' } }}
              >
                <FacebookIcon />
              </IconButton>
              <IconButton
                component="a"
                href="https://instagram.com/paya"
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                sx={{ color: 'grey.400', '&:hover': { color: 'primary.main' } }}
              >
                <InstagramIcon />
              </IconButton>
            </Stack>
          </Box>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <Box key={section.title}>
              <Typography
                variant="subtitle1"
                color="grey.100"
                gutterBottom
                fontWeight={600}
              >
                {section.title}
              </Typography>
              <Stack spacing={1}>
                {section.links.map((link) => (
                  <Link
                    key={link.path}
                    component={RouterLink}
                    to={link.path}
                    color="grey.400"
                    underline="none"
                    sx={{
                      fontSize: '0.875rem',
                      '&:hover': {
                        color: 'primary.main',
                      },
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </Stack>
            </Box>
          ))}
        </Box>

        {/* Bottom Bar */}
        <Divider sx={{ my: 4, borderColor: 'grey.800' }} />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Typography variant="body2" color="grey.500">
            © {new Date().getFullYear()} Paya Marketplace. All rights reserved.
          </Typography>
          {/* <Typography variant="body2" color="grey.500">
            Made with ❤️ in Kenya
          </Typography> */}
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
