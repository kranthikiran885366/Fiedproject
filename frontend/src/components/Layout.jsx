import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Tooltip,
  styled,
  Container
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Person,
  Settings,
  Help,
  ExitToApp,
  Notifications as NotificationsIcon,
  School,
  Assessment,
  History,
  QrCode,
  Videocam,
  Home as HomeIcon
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationBadge from './NotificationBadge';

const drawerWidth = 280;

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    backgroundColor: theme.palette.background.default,
    width: drawerWidth,
    boxSizing: 'border-box',
    borderRight: 'none',
    boxShadow: '4px 0px 20px rgba(0,0,0,0.05)'
  }
}));

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: '0px 1px 10px rgba(0,0,0,0.05)',
  zIndex: theme.zIndex.drawer + 1
}));

const menuItems = [
  { text: 'Home', icon: <HomeIcon />, path: '/' },
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { text: 'Take Attendance', icon: <QrCode />, path: '/attendance' },
  { text: 'Attendance History', icon: <History />, path: '/attendance/history' },
  { text: 'Analytics', icon: <Assessment />, path: '/attendance/analytics' },
  { text: 'CCTV Monitoring', icon: <Videocam />, path: '/monitoring' },
  { text: 'Profile', icon: <Person />, path: '/profile' },
  { text: 'Settings', icon: <Settings />, path: '/settings' },
  { text: 'Help', icon: <Help />, path: '/help' }
];

const Layout = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNotificationsClick = (event) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  const handleProfileClick = (event) => {
    setProfileAnchor(event.currentTarget);
  };

  const handleProfileClose = () => {
    setProfileAnchor(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleNewNotification = (notification) => {
    setNotifications(prev => [...prev, notification]);
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const mockNotifications = [
          { id: 1, message: 'New attendance marked', type: 'info' },
          { id: 2, message: 'Class schedule updated', type: 'info' }
        ];
        setNotifications(mockNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();

    // Add WebSocket or event listener for real-time notifications
    const handleRealTimeNotification = (event) => {
      const newNotification = {
        id: Date.now(),
        message: event.message || 'New notification',
        type: event.type || 'info'
      };
      handleNewNotification(newNotification);
    };

    // Example: Listen for custom event (you can replace this with your actual notification system)
    window.addEventListener('newNotification', handleRealTimeNotification);

    return () => {
      window.removeEventListener('newNotification', handleRealTimeNotification);
    };
  }, []);

  const drawer = (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2, mb: 2 }}>
        <School sx={{ color: 'primary.main', mr: 1 }} />
        <Typography variant="h6" color="primary" fontWeight="bold">
          AAS
        </Typography>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => handleNavigation(item.path)}
            selected={location.pathname === item.path}
            sx={{
              borderRadius: '0 24px 24px 0',
              mr: 2,
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.light',
                },
              },
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <StyledAppBar position="fixed">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Automated Attendance System
          </Typography>
          {user ? (
            <>
              <Tooltip title={`${notifications.length} new notifications`}>
                <IconButton color="inherit" onClick={handleNotificationsClick}>
                  <Badge badgeContent={notifications.length} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
              <IconButton onClick={handleProfileClick}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={profileAnchor}
                open={Boolean(profileAnchor)}
                onClose={handleProfileClose}
              >
                <MenuItem onClick={() => handleNavigation('/profile')}>Profile</MenuItem>
                <MenuItem onClick={() => handleNavigation('/settings')}>Settings</MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ExitToApp sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
              <Menu
                anchorEl={notificationsAnchor}
                open={Boolean(notificationsAnchor)}
                onClose={handleNotificationsClose}
              >
                {notifications.length > 0 ? (
                  notifications.map((notification, index) => (
                    <MenuItem key={index} onClick={handleNotificationsClose}>
                      <NotificationBadge notification={notification} />
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem onClick={handleNotificationsClose}>No notifications</MenuItem>
                )}
              </Menu>
            </>
          ) : (
            <Box>
              <IconButton color="inherit" onClick={() => handleNavigation('/login')}>
                Login
              </IconButton>
              <IconButton color="inherit" onClick={() => handleNavigation('/register')}>
                Register
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </StyledAppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <StyledDrawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
          }}
        >
          {drawer}
        </StyledDrawer>
        <StyledDrawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
          }}
          open
        >
          {drawer}
        </StyledDrawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8
        }}
      >
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
