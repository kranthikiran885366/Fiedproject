import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Box,
  Typography,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  QrCode as QrCodeIcon,
  History as HistoryIcon,
  Assessment as AssessmentIcon,
  Videocam as VideocamIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

const Sidebar = ({ open, variant, onClose }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = [
    {
      title: 'Main',
      items: [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
        { text: 'Take Attendance', icon: <QrCodeIcon />, path: '/attendance/session' },
        { text: 'Attendance History', icon: <HistoryIcon />, path: '/attendance/history' },
        { text: 'Analytics', icon: <AssessmentIcon />, path: '/attendance/analytics' },
      ]
    },
    {
      title: 'Monitoring',
      items: [
        { text: 'CCTV Monitoring', icon: <VideocamIcon />, path: '/monitoring' },
      ]
    },
    {
      title: 'Settings',
      items: [
        { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
        { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
        { text: 'Help', icon: <HelpIcon />, path: '/help' },
      ]
    }
  ];

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 280,
          border: 'none',
          background: `linear-gradient(180deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          color: 'primary.contrastText',
          boxShadow: `4px 0 24px ${alpha(theme.palette.primary.main, 0.25)}`,
        }
      }}
    >
      {/* Header */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <SchoolIcon sx={{ fontSize: 32, color: 'primary.contrastText' }} />
        <Box>
          <Typography variant="h6" fontWeight="600" color="primary.contrastText">
            Attendance System
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            {user?.role}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: alpha('#fff', 0.1) }} />

      {/* Menu Items */}
      <Box sx={{ py: 2, flexGrow: 1 }}>
        {menuItems.map((section, index) => (
          <Box key={section.title} sx={{ mb: 2 }}>
            <Typography
              variant="overline"
              sx={{ px: 3, py: 1, opacity: 0.7, display: 'block' }}
            >
              {section.title}
            </Typography>

            <List disablePadding>
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <ListItem
                    button
                    key={item.text}
                    onClick={() => navigate(item.path)}
                    sx={{
                      mx: 1,
                      mb: 0.5,
                      borderRadius: 2,
                      backgroundColor: isActive
                        ? alpha('#fff', 0.1)
                        : 'transparent',
                      '&:hover': {
                        backgroundColor: alpha('#fff', 0.05)
                      }
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 40,
                        color: isActive
                          ? 'primary.contrastText'
                          : alpha('#fff', 0.7)
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontWeight: isActive ? 600 : 400,
                        color: isActive
                          ? 'primary.contrastText'
                          : alpha('#fff', 0.7)
                      }}
                    />
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* Version */}
      <Box sx={{ p: 3 }}>
        <Typography variant="caption" sx={{ opacity: 0.5 }}>
          Version 1.0.0
        </Typography>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
