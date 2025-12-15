import React, { useState } from "react";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Box,
  Container,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  Avatar,
} from "@mui/material";
import {
  ShoppingCart as ShoppingCartIcon,
  Menu as MenuIcon,
  Store as StoreIcon,
  Support as SupportIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  ShoppingBag as OrdersIcon,
  Favorite as FavoriteIcon,
  Logout as LogoutIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { getItemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  const handleLogout = () => {
    logout();
    navigate("/");
    setMobileMenuOpen(false);
    setUserMenuAnchor(null);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleUserMenuItemClick = (path: string) => {
    navigate(path);
    handleUserMenuClose();
  };

  const getInitials = () => {
    const first = user?.firstName?.[0] || '';
    const last = user?.lastName?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  const cartItemCount = getItemCount();

  const navItems = [
    { label: "Shop", path: "/marketplace", icon: <StoreIcon /> },
    { label: "Merchants", path: "/merchants", icon: <DashboardIcon /> },
    { label: "Support", path: "/support", icon: <SupportIcon /> },
  ];

  const isActivePath = (path: string) => location.pathname === path;

  const handleDrawerToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  // Mobile drawer content
  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ width: 250 }}>
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="h6" color="#667FEA" fontWeight="bold">
          Paya Marketplace
        </Typography>
      </Box>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={isActivePath(item.path)}
              onClick={() => handleNavClick(item.path)}
            >
              <Box sx={{ mr: 2, display: "flex", alignItems: "center" }}>
                {item.icon}
              </Box>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
        <ListItem disablePadding>
          <ListItemButton
            selected={isActivePath("/cart")}
            onClick={() => handleNavClick("/cart")}
          >
            <Box sx={{ mr: 2, display: "flex", alignItems: "center" }}>
              <Badge badgeContent={cartItemCount} color="error">
                <ShoppingCartIcon />
              </Badge>
            </Box>
            <ListItemText primary="Cart" />
          </ListItemButton>
        </ListItem>
      </List>
      <Divider />
      <List>
        {user ? (
          <>
            <ListItem>
              <ListItemText
                primary={`Hello, ${user.firstName}`}
                secondary={user.email}
              />
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleNavClick("/profile")}>
                <ListItemIcon><PersonIcon /></ListItemIcon>
                <ListItemText primary="My Profile" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleNavClick("/orders")}>
                <ListItemIcon><OrdersIcon /></ListItemIcon>
                <ListItemText primary="My Orders" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleNavClick("/wishlist")}>
                <ListItemIcon><FavoriteIcon /></ListItemIcon>
                <ListItemText primary="Wishlist" />
              </ListItemButton>
            </ListItem>
            {user.role === "merchant" && (
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleNavClick("/merchant/dashboard")}>
                  <ListItemIcon><DashboardIcon /></ListItemIcon>
                  <ListItemText primary="Dashboard" />
                </ListItemButton>
              </ListItem>
            )}
            <Divider sx={{ my: 1 }} />
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout}>
                <ListItemIcon><LogoutIcon /></ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </ListItem>
          </>
        ) : (
          <>
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleNavClick("/login")}>
                <ListItemText primary="Login" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleNavClick("/register")}>
                <ListItemText primary="Sign Up" />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          backgroundColor: "white",
          color: "text.primary",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            {/* Mobile Menu Icon */}
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}

            {/* Logo */}
            <Typography
              variant="h6"
              component={RouterLink}
              to="/"
              sx={{
                fontWeight: 700,
                color: "#667FEA",
                textDecoration: "none",
                flexGrow: isMobile ? 1 : 0,
                mr: 4,
              }}
            >
              Paya Marketplace
            </Typography>

            {/* Desktop Navigation */}
            {!isMobile && (
              <Box
                sx={{
                  flexGrow: 1,
                  display: "flex",
                  gap: 1,
                  justifyContent: "center",
                }}
              >
                {navItems.map((item) => (
                  <Button
                    key={item.path}
                    component={RouterLink}
                    to={item.path}
                    sx={{
                      color: isActivePath(item.path)
                        ? "#667FEA"
                        : "text.secondary",
                      fontWeight: isActivePath(item.path) ? 600 : 400,
                      "&:hover": {
                        color: "#667FEA",
                        backgroundColor: "action.hover",
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
                <IconButton
                  component={RouterLink}
                  to="/cart"
                  sx={{
                    color: isActivePath("/cart") ? "#667FEA" : "text.secondary",
                  }}
                >
                  <Badge badgeContent={cartItemCount} color="error">
                    <ShoppingCartIcon />
                  </Badge>
                </IconButton>
              </Box>
            )}

            {/* Desktop Auth Buttons */}
            {!isMobile && (
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                {user ? (
                  <>
                    <Button
                      onClick={handleUserMenuOpen}
                      endIcon={<ArrowDownIcon />}
                      sx={{
                        textTransform: "none",
                        color: "text.primary",
                        borderRadius: 2,
                        px: 1.5,
                        "&:hover": {
                          bgcolor: "action.hover",
                        },
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: "#667FEA",
                          fontSize: "0.875rem",
                          mr: 1,
                        }}
                      >
                        {getInitials()}
                      </Avatar>
                      {user.firstName}
                    </Button>
                    <Menu
                      anchorEl={userMenuAnchor}
                      open={Boolean(userMenuAnchor)}
                      onClose={handleUserMenuClose}
                      anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "right",
                      }}
                      transformOrigin={{
                        vertical: "top",
                        horizontal: "right",
                      }}
                      PaperProps={{
                        sx: {
                          mt: 1,
                          minWidth: 200,
                          borderRadius: 2,
                          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                        },
                      }}
                    >
                      <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: "divider" }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {user.firstName} {user.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.email}
                        </Typography>
                      </Box>
                      <MenuItem onClick={() => handleUserMenuItemClick("/profile")}>
                        <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>My Profile</ListItemText>
                      </MenuItem>
                      <MenuItem onClick={() => handleUserMenuItemClick("/orders")}>
                        <ListItemIcon><OrdersIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>My Orders</ListItemText>
                      </MenuItem>
                      <MenuItem onClick={() => handleUserMenuItemClick("/wishlist")}>
                        <ListItemIcon><FavoriteIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Wishlist</ListItemText>
                      </MenuItem>
                      {user.role === "merchant" && (
                        <MenuItem onClick={() => handleUserMenuItemClick("/merchant/dashboard")}>
                          <ListItemIcon><DashboardIcon fontSize="small" /></ListItemIcon>
                          <ListItemText>Merchant Dashboard</ListItemText>
                        </MenuItem>
                      )}
                      <Divider />
                      <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
                        <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
                        <ListItemText>Logout</ListItemText>
                      </MenuItem>
                    </Menu>
                  </>
                ) : (
                  <>
                    <Button
                      component={RouterLink}
                      to="/login"
                      variant="outlined"
                      size="small"
                      sx={{
                        textTransform: "none",
                        borderRadius: 2,
                        borderColor: "#667FEA",
                        width: "100px",
                        height: "36px",
                      }}
                    >
                      Login
                    </Button>
                    <Button
                      component={RouterLink}
                      to="/register"
                      variant="contained"
                      color="primary"
                      size="small"
                      sx={{
                        textTransform: "none",
                        borderRadius: 2,
                        bgcolor: "#667FEA",
                        width: "100px",
                        height: "36px",
                      }}
                    >
                      Sign Up
                    </Button>
                  </>
                )}
              </Box>
            )}

            {/* Mobile Cart Icon */}
            {isMobile && (
              <IconButton
                component={RouterLink}
                to="/cart"
                sx={{ color: "text.primary" }}
              >
                <Badge badgeContent={cartItemCount} color="error">
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
      >
        {drawer}
      </Drawer>

      {/* Toolbar spacer */}
      <Toolbar />
    </>
  );
};

export default Navbar;
