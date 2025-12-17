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
    <Box sx={{ py: 6, bgcolor: 'grey.50', minHeight: '100vh' , marginTop: '-74px'}}>
      <Container maxWidth="md">
        <Paper sx={{ p: { xs: 3, md: 6 } }}>
          <Typography variant="h3" component="h1" gutterBottom fontWeight={700}>
            Terms of Use
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            Please read these Terms of Use ("Terms") carefully before accessing or using the services 
            provided by Paya Ventures Limited ("we," "us," or "our"). These Terms govern your use of 
            our website, mobile application, and any other products or services we provide (collectively 
            referred to as the "Services"). By accessing or using our Services, you agree to be bound by 
            these Terms.
          </Typography>
          <Divider sx={{ my: 3 }} />

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            Acceptance of Terms
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            By accessing or using our Services, you acknowledge that you have read, understood, and agreed 
            to these Terms. If you do not agree to these Terms, you may not access or use our Services.
          </Typography>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            Eligibility
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            You must be at least 18 years old and have the legal capacity to enter into a binding agreement 
            to use our Services. By accessing or using our Services, you represent and warrant that you meet 
            these eligibility requirements.
          </Typography>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            Use of Services
          </Typography>
          <Typography variant="h6" gutterBottom fontWeight={500} sx={{ mt: 2 }}>
            Permitted Use
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            You may use our Services for your personal, non-commercial use and in compliance with these 
            Terms and applicable laws and regulations.
          </Typography>

          <Typography variant="h6" gutterBottom fontWeight={500} sx={{ mt: 2 }}>
            Prohibited Use
          </Typography>
          <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
            <li>Use our Services for any unlawful or unauthorized purpose.</li>
            <li>Interfere with or disrupt the operation of our Services or the networks connected to it.</li>
            <li>Attempt to gain unauthorized access to our Services, user accounts, or any computer systems or networks associated with our Services.</li>
            <li>Engage in any activity that could harm, damage, or impair our Services or our reputation.</li>
            <li>Collect or store personal information of other users without their consent.</li>
            <li>Use our Services in a manner that infringes upon the intellectual property or other rights of third parties.</li>
          </Box>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            Intellectual Property
          </Typography>
          <Typography variant="h6" gutterBottom fontWeight={500} sx={{ mt: 2 }}>
            Ownership
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            All content, materials, and intellectual property rights associated with our Services, including 
            but not limited to text, graphics, logos, images, software, and audio or video files, are owned by 
            or licensed to us. You acknowledge that these materials are protected by copyright, trademark, and 
            other laws.
          </Typography>

          <Typography variant="h6" gutterBottom fontWeight={500} sx={{ mt: 2 }}>
            Limited License
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            We grant you a limited, non-exclusive, non-transferable, and revocable license to access and use 
            our Services for your personal, non-commercial use. You may not copy, modify, distribute, transmit, 
            display, perform, reproduce, publish, license, create derivative works from, transfer, or sell any 
            content or materials obtained from our Services without our prior written consent.
          </Typography>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            Privacy
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            We collect, use, and disclose personal information in accordance with our Privacy Policy. By using 
            our Services, you consent to our collection, use, and disclosure of personal information as described 
            in our Privacy Policy.
          </Typography>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            Disclaimer of Warranties
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            While we strive to provide accurate and reliable information, our Services are provided on an "as is" 
            and "as available" basis without warranties of any kind. We do not guarantee the accuracy, completeness, 
            reliability, or suitability of the content and materials provided through our Services.
          </Typography>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            Limitation of Liability
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            To the extent permitted by law, we shall not be liable for any direct, indirect, incidental, 
            consequential, or punitive damages arising out of or in connection with your use of our Services. 
            We shall not be liable for any errors, omissions, interruptions, or delays in the operation of our Services.
          </Typography>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            Modifications to the Terms
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            We reserve the right to modify these Terms at any time. Any changes will be effective upon posting 
            the updated Terms on our website or mobile application. Your continued use of our Services after the 
            posting of the updated Terms constitutes your acceptance of the modified Terms.
          </Typography>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            Termination
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            We may suspend or terminate your access to our Services, in whole or in part, at our sole discretion 
            and without prior notice or liability, for any reason including, but not limited to, violation of these 
            Terms or applicable laws. Upon termination, you must immediately cease all use of our Services.
          </Typography>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            Governing Law and Jurisdiction
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            These Terms shall be governed by and construed in accordance with the laws of Kenya. Any dispute 
            arising out of or relating to these Terms or your use of our Services shall be subject to the 
            exclusive jurisdiction of the courts located in Kenya.
          </Typography>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            Severability
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            If any provision of these Terms is held to be invalid, illegal, or unenforceable, the remaining 
            provisions shall continue in full force and effect.
          </Typography>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            Entire Agreement
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            These Terms constitute the entire agreement between you and Paya Ventures Ltd regarding the use of 
            our Services and supersede any prior or contemporaneous agreements, communications, and proposals, 
            whether oral or written, between you and us.
          </Typography>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            Contact Us
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            If you have any questions or concerns about these Terms, please contact us at support@paya.co.ke.
          </Typography>

          <Divider sx={{ my: 4 }} />
          <Typography variant="body2" color="text.secondary" fontStyle="italic">
            By accessing or using our Services, you acknowledge that you have read, understood, and agreed to these Terms.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Terms;
