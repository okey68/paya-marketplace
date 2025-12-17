import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Divider,
} from '@mui/material';

const Terms = () => {
  return (
    <Box sx={{ py: 6, bgcolor: 'grey.50', minHeight: '100vh' }}>
      <Container maxWidth="md">
        <Paper sx={{ p: { xs: 3, md: 6 } }}>
          <Typography variant="h3" component="h1" gutterBottom fontWeight={700}>
            Terms of Service
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Last updated: December 16, 2025
          </Typography>
          <Divider sx={{ my: 3 }} />

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            1. Acceptance of Terms
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            By accessing and using Paya Marketplace, you accept and agree to be bound by the terms
            and provisions of this agreement. If you do not agree to abide by these terms, please
            do not use this service.
          </Typography>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            2. Description of Service
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            Paya Marketplace is an online platform that connects merchants with customers in Kenya,
            offering Buy Now Pay Later (BNPL) solutions. We facilitate transactions between buyers
            and sellers while providing flexible payment options.
          </Typography>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            3. User Accounts
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            To use certain features of the platform, you must register for an account. You agree to:
          </Typography>
          <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
            <li>Provide accurate and complete information during registration</li>
            <li>Maintain the security of your account credentials</li>
            <li>Notify us immediately of any unauthorized access</li>
            <li>Accept responsibility for all activities under your account</li>
          </Box>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            4. Buy Now Pay Later (BNPL) Terms
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            Our BNPL service allows you to purchase products and pay in installments. By using this service:
          </Typography>
          <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
            <li>You agree to make payments according to the agreed schedule</li>
            <li>Late payments may incur additional fees</li>
            <li>Failure to pay may result in account suspension and collection actions</li>
            <li>Credit limits are determined based on your payment history and creditworthiness</li>
          </Box>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            5. Merchant Responsibilities
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            Merchants using our platform agree to:
          </Typography>
          <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
            <li>Provide accurate product descriptions and pricing</li>
            <li>Fulfill orders in a timely manner</li>
            <li>Comply with all applicable laws and regulations</li>
            <li>Maintain appropriate customer service standards</li>
          </Box>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            6. Prohibited Activities
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            You may not use the platform to:
          </Typography>
          <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
            <li>Engage in fraudulent or illegal activities</li>
            <li>Sell prohibited or counterfeit items</li>
            <li>Harass or harm other users</li>
            <li>Interfere with the platform's operation</li>
            <li>Violate intellectual property rights</li>
          </Box>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            7. Limitation of Liability
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            Paya Marketplace shall not be liable for any indirect, incidental, special, or
            consequential damages resulting from your use of the platform. Our total liability
            shall not exceed the amount you paid for the specific transaction in question.
          </Typography>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            8. Dispute Resolution
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            Any disputes arising from these terms shall be resolved through arbitration in
            accordance with Kenyan law. You agree to attempt informal resolution before
            initiating any formal proceedings.
          </Typography>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            9. Changes to Terms
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            We reserve the right to modify these terms at any time. Changes will be effective
            upon posting to the platform. Your continued use of the service constitutes
            acceptance of the modified terms.
          </Typography>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            10. Contact Information
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            For questions about these Terms of Service, please contact us at:
          </Typography>
          <Box sx={{ pl: 3, color: 'text.secondary' }}>
            <Typography variant="body1">Email: legal@paya.com</Typography>
            <Typography variant="body1">Phone: +254 700 000 000</Typography>
            <Typography variant="body1">Address: Nairobi, Kenya</Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Terms;
