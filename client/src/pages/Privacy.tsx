import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Divider,
} from '@mui/material';

const Privacy = () => {
  return (
    <Box sx={{ py: 6, bgcolor: 'grey.50', minHeight: '100vh' }}>
      <Container maxWidth="md">
        <Paper sx={{ p: { xs: 3, md: 6 } }}>
          <Typography variant="h3" component="h1" gutterBottom fontWeight={700}>
            Privacy Policy
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Last updated: December 16, 2025
          </Typography>
          <Divider sx={{ my: 3 }} />

          <Typography variant="body1" paragraph color="text.secondary">
            At Paya Marketplace, we are committed to protecting your privacy and ensuring the
            security of your personal information. This Privacy Policy explains how we collect,
            use, disclose, and safeguard your information.
          </Typography>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            1. Information We Collect
          </Typography>
          <Typography variant="h6" gutterBottom fontWeight={500} sx={{ mt: 2 }}>
            Personal Information
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            We may collect the following personal information:
          </Typography>
          <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
            <li>Name and contact information (email, phone number, address)</li>
            <li>Account credentials</li>
            <li>Payment information and transaction history</li>
            <li>National ID or other identification documents for verification</li>
            <li>M-Pesa phone number for payment processing</li>
          </Box>

          <Typography variant="h6" gutterBottom fontWeight={500} sx={{ mt: 2 }}>
            Automatically Collected Information
          </Typography>
          <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
            <li>Device information and browser type</li>
            <li>IP address and location data</li>
            <li>Usage patterns and browsing history on our platform</li>
            <li>Cookies and similar tracking technologies</li>
          </Box>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            2. How We Use Your Information
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            We use your information to:
          </Typography>
          <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
            <li>Process transactions and manage your account</li>
            <li>Provide and improve our BNPL services</li>
            <li>Assess creditworthiness for BNPL applications</li>
            <li>Send order updates and important notifications</li>
            <li>Provide customer support</li>
            <li>Detect and prevent fraud</li>
            <li>Comply with legal obligations</li>
            <li>Send marketing communications (with your consent)</li>
          </Box>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            3. Information Sharing
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            We may share your information with:
          </Typography>
          <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
            <li>Merchants to fulfill your orders</li>
            <li>Payment processors (including M-Pesa/Safaricom)</li>
            <li>Credit bureaus for credit assessments</li>
            <li>Service providers who assist our operations</li>
            <li>Law enforcement when required by law</li>
          </Box>
          <Typography variant="body1" paragraph color="text.secondary">
            We do not sell your personal information to third parties.
          </Typography>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            4. Data Security
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            We implement appropriate technical and organizational measures to protect your
            personal information, including:
          </Typography>
          <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
            <li>Encryption of data in transit and at rest</li>
            <li>Secure server infrastructure</li>
            <li>Regular security assessments</li>
            <li>Access controls and authentication measures</li>
            <li>Employee training on data protection</li>
          </Box>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            5. Your Rights
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            Under the Kenya Data Protection Act, 2019, you have the right to:
          </Typography>
          <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to processing of your data</li>
            <li>Data portability</li>
            <li>Withdraw consent at any time</li>
          </Box>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            6. Cookies
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            We use cookies and similar technologies to enhance your experience, analyze usage,
            and deliver personalized content. You can manage cookie preferences through your
            browser settings.
          </Typography>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            7. Data Retention
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            We retain your personal information for as long as necessary to provide our services,
            comply with legal obligations, and resolve disputes. Transaction records are kept
            for a minimum of 7 years as required by Kenyan law.
          </Typography>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            8. Children's Privacy
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            Our services are not intended for individuals under 18 years of age. We do not
            knowingly collect personal information from children.
          </Typography>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            9. Changes to This Policy
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            We may update this Privacy Policy periodically. We will notify you of significant
            changes through email or platform notifications. Your continued use of our services
            after changes constitutes acceptance of the updated policy.
          </Typography>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            10. Contact Us
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            For privacy-related inquiries or to exercise your rights, contact our Data Protection Officer:
          </Typography>
          <Box sx={{ pl: 3, color: 'text.secondary' }}>
            <Typography variant="body1">Email: privacy@paya.com</Typography>
            <Typography variant="body1">Phone: +254 700 000 000</Typography>
            <Typography variant="body1">Address: Nairobi, Kenya</Typography>
          </Box>

          <Divider sx={{ my: 4 }} />
          <Typography variant="body2" color="text.secondary">
            This privacy policy is compliant with the Kenya Data Protection Act, 2019 and
            international best practices for data protection.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Privacy;
