import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Badge,
  Avatar,
  Popover,
  useTheme,
  useMediaQuery,
  Container,
  Divider,
  alpha
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications,
  AccountCircle,
  Settings,
  Help,
  Logout
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import Sidebar from '../components/Sidebar';
import NotificationBadge from '../components/NotificationBadge';
import { useNotifications } from '../hooks/useNotifications';
import Footer from '../components/Footer';

const MainLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const { user, logout } = useAuth();
  const { notifications, unreadCount } = useNotifications();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'primary.contrastText',
          boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.15)}`
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          {/* University Logo */}
          <Box
            component="img"
            src="/assets/images/university-logo.png"
            alt="University Logo"
            sx={{ height: 40, mr: 2 }}
          />

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            University Attendance System
          </Typography>

          {/* Notifications */}
          <IconButton color="inherit" onClick={handleNotificationClick}>
            <Badge badgeContent={unreadCount} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          {/* Profile */}
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleProfileMenuOpen}
            sx={{ ml: 2 }}
          >
            {user?.photoURL ? (
              <Avatar
                src={user.photoURL}
                alt={user.name}
                sx={{ width: 32, height: 32 }}
              />
            ) : (
              <AccountCircle />
            )}
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Sidebar
        open={mobileOpen}
        variant={isMobile ? 'temporary' : 'permanent'}
        onClose={handleDrawerToggle}
      />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          width: { sm: `calc(100% - ${240}px)` },
          mt: 8,
          bgcolor: 'background.default',
          minHeight: '100vh'
        }}
      >
        <Container maxWidth="xl" sx={{ py: 3, flexGrow: 1 }}>
          <Outlet />
        </Container>
        <Footer />
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        PaperProps={{
          elevation: 4,
          sx: {
            width: 250,
            overflow: 'visible',
            mt: 1.5,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <Typography variant="subtitle1" noWrap fontWeight="bold">
            {user?.name}
          </Typography>
          <Typography variant="body2" noWrap sx={{ opacity: 0.8 }}>
            {user?.role}
          </Typography>
        </Box>
        <Box sx={{ p: 1 }}>
          <MenuItem onClick={() => { handleProfileMenuClose(); }} sx={{
            borderRadius: 1,
            '&:hover': { bgcolor: 'action.hover' }
          }}>
            <Settings sx={{ mr: 2, color: 'primary.main' }} /> Settings
          </MenuItem>
          <MenuItem onClick={() => { handleProfileMenuClose(); }} sx={{
            borderRadius: 1,
            '&:hover': { bgcolor: 'action.hover' }
          }}>
            <Help sx={{ mr: 2, color: 'info.main' }} /> Help Center
          </MenuItem>
          <Divider sx={{ my: 1 }} />
          <MenuItem onClick={handleLogout} sx={{
            borderRadius: 1,
            '&:hover': { bgcolor: 'error.lighter', color: 'error.main' }
          }}>
            <Logout sx={{ mr: 2, color: 'error.main' }} /> Logout
          </MenuItem>
        </Box>
      </Menu>

      {/* Notifications Popover */}
      <Popover
        open={Boolean(notificationAnchor)}
        anchorEl={notificationAnchor}
        onClose={handleNotificationClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { width: 360, maxHeight: 480 }
        }}
      >
        <NotificationBadge
          notifications={notifications}
          onClose={handleNotificationClose}
        />
      </Popover>
    </Box>
  );
};

export default MainLayout;
