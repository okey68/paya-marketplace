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
    <Box sx={{ py: 6, bgcolor: 'grey.50', minHeight: '100vh', marginTop: '-74px' }}>
      <Container maxWidth="md">
        <Paper sx={{ p: { xs: 3, md: 6 } }}>
          <Typography variant="h3" component="h1" gutterBottom fontWeight={700}>
            Data Privacy Policy
          </Typography>
          {/* <Typography variant="body2" color="text.secondary" gutterBottom>
            Last Updated: November 28th, 2024
          </Typography> */}
          <Divider sx={{ my: 3 }} />

          <Typography variant="h5" gutterBottom fontWeight={600}>
            Introduction
          </Typography>
          <Typography variant="h6" gutterBottom fontWeight={500} sx={{ mt: 2 }}>
            Purpose of this privacy policy
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            Paya Ventures Ltd. ("Paya," "we," "our," or "us") is committed to protecting your privacy 
            and ensuring your data security. This Privacy Policy outlines how we collect, use, and share 
            your personal information and explains your rights concerning this information. By using our 
            services, you consent to this Privacy Policy.
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            As a customer, you accept this privacy policy when you sign up for, access, or use our products, 
            services, content, features, technologies, or functions offered on our website and all related sites, 
            applications, and services.
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            This privacy policy aims to give you information on how Paya collects and processes your personal 
            data through your use of Paya on this website or its app, including any data you may provide through 
            this website when you sign up as a user. This website is not intended for children, and we do not 
            knowingly collect data relating to children.
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            It is important that you read this privacy policy together with any other policy we may provide on 
            specific occasions when we are collecting or processing personal data about you so that you are fully 
            aware of how and why we are using your data. This privacy policy supplements other notices and privacy 
            policies and is not intended to override them.
          </Typography>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            Scope of Policy and Terms
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            This Privacy Policy applies to your use of:
          </Typography>
          <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
            <li>Paya Mobile Application Software ("App") available on our website or hosted on the Google Play Store ("App Site").</li>
            <li>Paya's website (www.paya.co.ke).</li>
            <li>Paya Services, accessible through the App or our Service Sites.</li>
          </Box>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            Definitions
          </Typography>
          <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
            <li><strong>"Customer" or "User"</strong> Any individual using Paya's products or services.</li>
            <li><strong>"Personal Data"</strong> Any information directly or indirectly identifying a person, including name, contact details, or financial records.</li>
            <li><strong>"Sensitive Personal Information"</strong> Data that may include government-issued IDs, financial data, or biometrics.</li>
            <li><strong>"Subprocessors"</strong> Third-party vendors contracted by Paya to process data as required for service delivery.</li>
            <li><strong>"Laws"</strong> Includes applicable Kenyan and international legal frameworks.</li>
          </Box>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            Disclosure Statement
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            By using Paya's services, you acknowledge and consent to the collection and sharing of your SMS logs, 
            including transactional messages, with our trusted third-party processors. This data is used solely for 
            purposes such as credit scoring, fraud prevention, and improving our services. Paya ensures that all 
            third-party processors are rigorously vetted and bound by stringent confidentiality and data protection 
            agreements to safeguard your information.
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            If you do not wish to share your SMS data, you may opt out by discontinuing the use of Paya's services. 
            Please note that opting out may affect our ability to provide certain functionalities, such as credit 
            eligibility assessment. For questions or concerns, contact us at support@paya.co.ke
          </Typography>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            Information We Collect
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            We collect and process various types of information to provide and improve our services, which may include:
          </Typography>

          <Typography variant="h6" gutterBottom fontWeight={500} sx={{ mt: 2 }}>
            Information You Provide
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            When interacting with Paya, you may provide:
          </Typography>
          <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
            <li><strong>Personal Details:</strong> Name, ID number, address, email, phone number, and photo.</li>
            <li><strong>Financial Data:</strong> Bank details, loan application details, and income information.</li>
            <li><strong>Communication Data:</strong> Messages, queries, and other correspondence with us.</li>
          </Box>

          <Typography variant="h6" gutterBottom fontWeight={500} sx={{ mt: 2 }}>
            Device and Technical Information
          </Typography>
          <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
            <li>Mobile device type, IMEI, serial number, SIM card details, and browser type.</li>
            <li>Call logs, SMS logs, GPS location, and social media contact lists (if explicitly authorized).</li>
          </Box>

          <Typography variant="h6" gutterBottom fontWeight={500} sx={{ mt: 2 }}>
            Automatically Collected Information
          </Typography>
          <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
            <li>Interaction data from your use of our App or website (e.g., login times, pages visited, and actions taken).</li>
            <li>Information obtained via cookies or similar technologies for analytics and functionality.</li>
          </Box>

          <Typography variant="h6" gutterBottom fontWeight={500} sx={{ mt: 2 }}>
            Information from Third Parties
          </Typography>
          <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
            <li>Data from credit bureaus, financial institutions, and publicly available sources.</li>
          </Box>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            Cookies
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            Cookies help us offer you the best experience when using our site. In this policy, we use the term 
            "cookies" to refer to cookies and similar technologies.
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            Cookies are small data files that we or our partners may place on your computer or other devices when 
            you visit our website. They allow us to remember your actions or preferences over time.
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            We use cookies to collect data that helps us to:
          </Typography>
          <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
            <li>Track site usage and browsing behavior;</li>
            <li>Allow you to log in to your account and navigate through the website;</li>
            <li>Monitor the effectiveness of our promotions and advertising;</li>
            <li>Mitigate risks, enhance security, and help prevent fraud.</li>
          </Box>
          <Typography variant="body1" paragraph color="text.secondary">
            We use both session and persistent cookies. Session cookies are deleted when you close your browser, 
            while persistent cookies remain on your device until they expire or are deleted by you. Persistent 
            cookies allow us to remember information about you when you visit our website again.
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            By signing up for an account with Paya or continuing to use our website, you consent to our use of 
            cookies as described in this policy. You may decline our cookies if your browser or browser add-on 
            permits, but doing so may affect your ability to use Paya's services. For more information on how to 
            delete or reject cookies, you can consult the "help" section in your browser or visit www.allaboutcookies.org.
          </Typography>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            Why We Collect Information
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            We collect and process your information for the following purposes:
          </Typography>
          <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
            <li><strong>Loan Assessment and Approval:</strong> To assess creditworthiness and provide financing solutions.</li>
            <li><strong>Regulatory Compliance:</strong> To meet legal obligations, including anti-money laundering (AML) and "know-your-customer" (KYC) requirements.</li>
            <li><strong>Fraud Prevention:</strong> To detect and prevent fraudulent activities.</li>
            <li><strong>Marketing and Communication:</strong> To send promotional offers and updates (subject to your consent).</li>
          </Box>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            How We Use and Share Your Information
          </Typography>
          <Typography variant="h6" gutterBottom fontWeight={500} sx={{ mt: 2 }}>
            Use of Personal data and Information collected
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            We will only use your personal data based on your consent or when required by law. Most commonly, we 
            use your data for the following purposes:
          </Typography>
          <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
            <li>Provide tailored loan services and credit models.</li>
            <li>Improve customer service and technical support.</li>
            <li>Ensure compliance with applicable laws and regulatory requirements.</li>
          </Box>

          <Typography variant="h6" gutterBottom fontWeight={500} sx={{ mt: 2 }}>
            Sharing of Information
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            Your data may be shared with:
          </Typography>
          <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
            <li><strong>Credit Bureaus:</strong> To report loan performance and support credit scoring.</li>
            <li><strong>Third-Party Service Providers:</strong> For payment processing, marketing, and customer support.</li>
            <li><strong>Regulatory Authorities:</strong> As required by law or court orders.</li>
            <li><strong>Subprocessors:</strong> Vetted and compliant partners necessary for providing BNPL services.</li>
          </Box>
          <Typography variant="body1" paragraph color="text.secondary">
            We require all third parties to respect the security of your personal data and to treat it in accordance 
            with the law. We do not allow our third-party service providers to use your personal data for their own 
            purposes and only permit them to process your personal data for specified purposes and in accordance with 
            our instructions.
          </Typography>

          <Typography variant="h6" gutterBottom fontWeight={500} sx={{ mt: 2 }}>
            Change of Purpose
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            We will only use your personal data for the purposes for which it was collected, unless we reasonably 
            consider that it needs to be used for another purpose that is compatible with the original one. If you 
            would like an explanation about how the new purpose is compatible with the original purpose, please 
            contact us.
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            If we need to use your personal data for an unrelated purpose, we will notify you and explain the legal 
            basis that allows us to do so.
          </Typography>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            Data Security
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            We have put in place appropriate security measures to prevent your personal data from being accidentally 
            lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your 
            personal data to those employees, agents, contractors and other third parties who have a business need to 
            know. They will only process your personal data on our instructions, and they are subject to a duty of 
            confidentiality.
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            However, please note that although we take reasonable steps to protect your information, no website, 
            Internet transmission, computer system, or wireless connection is completely secure. We have therefore 
            put in place procedures to deal with any suspected personal data breach and will notify you and any 
            applicable regulator of a breach where we are legally required to do so.
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            In addition to the foregoing, Paya takes appropriate measures to safeguard your personal information, including:
          </Typography>
          <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
            <li><strong>Encryption:</strong> All sensitive data is encrypted in transit and at rest.</li>
            <li><strong>Access Control:</strong> Restricted access to your data for authorized personnel only.</li>
            <li><strong>Regular Audits:</strong> Periodic security assessments to identify vulnerabilities.</li>
          </Box>
          <Typography variant="body1" paragraph color="text.secondary">
            Despite these measures, no system is completely secure. You are encouraged to protect your credentials.
          </Typography>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            Your Rights
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            As a Paya customer, you have the following rights:
          </Typography>
          <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
            <li><strong>Access and Rectification:</strong> Request access to or correction of your data.</li>
            <li><strong>Data Deletion:</strong> Request deletion of your data, subject to regulatory retention requirements.</li>
            <li><strong>Marketing Opt-Out:</strong> Opt-out of marketing communications via your App settings or by contacting support@paya.co.ke.</li>
          </Box>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            Retention of Data
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            We retain your information for as long as necessary to:
          </Typography>
          <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
            <li>Fulfill the purposes outlined in this Privacy Policy.</li>
            <li>Comply with legal and regulatory requirements.</li>
          </Box>
          <Typography variant="body1" paragraph color="text.secondary">
            If your account becomes inactive, we will archive your data in accordance with industry standards.
          </Typography>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            Updates to This Policy
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            We may revise this Privacy Policy from time to time. Updates will be posted on our App and website, and 
            you may be required to review and accept them to continue using our services.
          </Typography>

          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
            Contact Us
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            For inquiries or concerns about this policy, contact:
          </Typography>
          <Box sx={{ pl: 3, color: 'text.secondary' }}>
            <Typography variant="body1">Email: support@paya.co.ke</Typography>
            <Typography variant="body1">Website: www.paya.co.ke</Typography>
          </Box>

          <Divider sx={{ my: 4 }} />
          <Typography variant="body2" color="text.secondary">
            This privacy policy is compliant with the Kenya Data Protection Act, 2019 and international best practices for data protection.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Privacy;
