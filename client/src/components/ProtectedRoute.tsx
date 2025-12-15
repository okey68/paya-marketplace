import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRole?: 'customer' | 'merchant' | 'admin';
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireRole,
  redirectTo = '/login',
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Check if there's a token - if so, we should wait for auth to complete
  const hasToken = Boolean(localStorage.getItem('token'));

  // Show loading spinner while checking auth status
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 2,
        }}
      >
        <CircularProgress sx={{ color: '#667FEA' }} />
        <Typography color="text.secondary">Loading...</Typography>
      </Box>
    );
  }

  // If there's a token but user isn't loaded yet, wait for auth to complete
  if (hasToken && !user) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 2,
        }}
      >
        <CircularProgress sx={{ color: '#667FEA' }} />
        <Typography color="text.secondary">Verifying session...</Typography>
      </Box>
    );
  }

  // Check if authentication is required and user is not logged in
  if (requireAuth && !user) {
    // Save the current location so we can redirect back after login
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check if specific role is required
  if (requireRole && user?.role !== requireRole) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 2,
          textAlign: 'center',
          px: 3,
        }}
      >
        <Typography variant="h4" fontWeight={700}>
          Access Denied
        </Typography>
        <Typography color="text.secondary">
          You don't have permission to access this page.
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
