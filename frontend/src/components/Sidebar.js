import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Box,
  useTheme,
  Collapse,
  Typography
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  Face as FaceIcon,
  LocationOn as LocationIcon,
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
  QrCode as QrCodeIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  School as SchoolIcon,
  Security as SecurityIcon,
  Timeline as TimelineIcon,
  Fingerprint as FingerprintIcon,
  Analytics as AnalyticsIcon,
  Videocam as VideocamIcon,
  Psychology as PsychologyIcon,
  ExpandLess,
  ExpandMore
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const drawerWidth = 280;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  {
    text: 'Attendance',
    icon: <PersonIcon />,
    subitems: [
      { text: 'Face Recognition', icon: <FaceIcon />, path: '/attendance/face' },
      { text: 'QR Code Scan', icon: <QrCodeIcon />, path: '/attendance/qr' },
      { text: 'Session', icon: <ScheduleIcon />, path: '/attendance/session' },
      { text: 'History', icon: <TimelineIcon />, path: '/attendance/history' }
    ]
  },
  {
    text: 'Monitoring',
    icon: <VideocamIcon />,
    subitems: [
      { text: 'CCTV View', icon: <VideocamIcon />, path: '/monitoring' },
      { text: 'Emotion Tracking', icon: <PsychologyIcon />, path: '/emotion-tracking' },
      { text: 'Behavior Analysis', icon: <AnalyticsIcon />, path: '/behavior-analysis' }
    ]
  },
  {
    text: 'Analytics',
    icon: <AssessmentIcon />,
    subitems: [
      { text: 'Attendance Stats', icon: <TimelineIcon />, path: '/analytics' },
      { text: 'Reports', icon: <AssessmentIcon />, path: '/reports' }
    ]
  },
  { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
  { text: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
  { text: 'CCTV Monitoring', icon: <VideocamIcon />, path: '/monitoring' }
];

const bottomMenuItems = [
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  { text: 'Help', icon: <HelpIcon />, path: '/help' }
];

const MenuItem = ({ item, depth = 0, handleNavigation, selectedPath }) => {
  const [open, setOpen] = React.useState(false);
  const hasSubItems = item.subitems && item.subitems.length > 0;

  const handleClick = () => {
    if (hasSubItems) {
      setOpen(!open);
    } else {
      handleNavigation(item.path);
    }
  };

  return (
    <>
      <ListItem disablePadding>
        <ListItemButton
          onClick={handleClick}
          selected={!hasSubItems && selectedPath === item.path}
          sx={{
            pl: depth * 4 + 2,
            '&.Mui-selected': {
              bgcolor: 'primary.light',
              '&:hover': {
                bgcolor: 'primary.light',
              },
            },
          }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            {item.icon}
          </ListItemIcon>
          <ListItemText primary={item.text} />
          {hasSubItems && (open ? <ExpandLess /> : <ExpandMore />)}
        </ListItemButton>
      </ListItem>
      {hasSubItems && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List disablePadding>
            {item.subitems.map((subitem) => (
              <MenuItem
                key={subitem.text}
                item={subitem}
                depth={depth + 1}
                handleNavigation={handleNavigation}
                selectedPath={selectedPath}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

const Sidebar = ({ open, variant, onClose }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleNavigation = (path) => {
    navigate(path);
    if (variant === 'temporary') {
      onClose();
    }
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* User Profile Section */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          bgcolor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText
        }}
      >
        <Box
          component="img"
          src={user?.photoURL || '/assets/images/default-avatar.png'}
          alt={user?.name}
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            mb: 1,
            border: `2px solid ${theme.palette.primary.contrastText}`
          }}
        />
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {user?.name || 'Guest User'}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            {user?.role || 'No Role'}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Main Menu Items */}
      <List sx={{ flexGrow: 1, pt: 0 }}>
        {menuItems.map((item) => (
          <MenuItem
            key={item.text}
            item={item}
            handleNavigation={handleNavigation}
            selectedPath={location.pathname}
          />
        ))}
      </List>

      <Divider />

      {/* Bottom Menu Items */}
      <List>
        {bottomMenuItems.map((item) => (
          <MenuItem
            key={item.text}
            item={item}
            handleNavigation={handleNavigation}
            selectedPath={location.pathname}
          />
        ))}
      </List>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      {drawer}
    </Drawer>
  );
};

export default Sidebar;
