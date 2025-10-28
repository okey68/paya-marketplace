import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  Divider,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import axios from 'axios';

const Support = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    orderNumber: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [submitted]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const response = await axios.post(`${API_URL}/support/submit`, formData);
      setTicketNumber(response.data.ticket.ticketNumber);
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        orderNumber: '',
      });
    } catch (err: any) {
      console.error('Support submission error:', err);
      setError(err.response?.data?.message || 'Failed to submit support ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Container maxWidth="md" sx={{ pt: 8, pb: 8, textAlign: 'center' }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: 'success.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
          }}
        >
          <CheckIcon sx={{ fontSize: 48, color: 'white' }} />
        </Box>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Support Ticket Submitted!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
          Your ticket number is:
        </Typography>
        <Typography variant="h5" fontWeight={700} color="primary" sx={{ mb: 3, fontFamily: 'monospace' }}>
          {ticketNumber}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          We'll get back to you as soon as possible at the email address you provided.
        </Typography>
        <Button variant="contained" color="primary" size="large" onClick={() => setSubmitted(false)}>
          Submit Another Ticket
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ pt: 3, pb: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Contact Support
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Have a question or need help? We're here to assist you!
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ p: 4, border: 1, borderColor: 'divider', mb: 4 }}>
        <Box component="form" onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
            <TextField
              label="Name"
              name="name"
              required
              fullWidth
              value={formData.name}
              onChange={handleChange}
              placeholder="Your full name"
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              required
              fullWidth
              value={formData.email}
              onChange={handleChange}
              placeholder="your.email@example.com"
            />
          </Box>

          <TextField
            label="Order Number (Optional)"
            name="orderNumber"
            fullWidth
            value={formData.orderNumber}
            onChange={handleChange}
            placeholder="PY-YYYYMMDD-XXXXX"
            helperText="If your question is about a specific order, please include the order number"
            sx={{ mb: 2 }}
          />

          <TextField
            label="Subject"
            name="subject"
            required
            fullWidth
            value={formData.subject}
            onChange={handleChange}
            placeholder="Brief description of your issue"
            sx={{ mb: 2 }}
          />

          <TextField
            label="Message"
            name="message"
            required
            fullWidth
            multiline
            rows={6}
            value={formData.message}
            onChange={handleChange}
            placeholder="Please provide as much detail as possible..."
            sx={{ mb: 3 }}
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Ticket'}
          </Button>
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ p: 4, border: 1, borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Other Ways to Reach Us
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: 'primary.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <EmailIcon color="primary" />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                support@paya.com
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: 'primary.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PhoneIcon color="primary" />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Phone
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                +254 700 000 000
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: 'primary.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ScheduleIcon color="primary" />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Hours
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                Monday - Friday, 9AM - 6PM EAT
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Support;
