import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  IconButton,
  Badge,
  Divider,
  Button
} from '@mui/material';
import {
  Notifications,
  CheckCircle,
  Warning,
  Info,
  Error as ErrorIcon,
  Close,
  DoneAll
} from '@mui/icons-material';
import { styled } from '@mui/system';
import { useNotifications } from '../hooks/useNotifications';

const NotificationList = styled(List)(({ theme }) => ({
  width: '100%',
  maxWidth: 360,
  backgroundColor: theme.palette.background.paper,
  maxHeight: 400,
  overflowY: 'auto'
}));

const NotificationItem = styled(ListItem)(({ theme, severity }) => {
  const colors = {
    success: theme.palette.success.light,
    warning: theme.palette.warning.light,
    error: theme.palette.error.light,
    info: theme.palette.info.light
  };

  return {
    '&:hover': {
      backgroundColor: colors[severity] || theme.palette.action.hover
    }
  };
});

const NotificationIcon = ({ severity }) => {
  const icons = {
    success: <CheckCircle color="success" />,
    warning: <Warning color="warning" />,
    error: <ErrorIcon color="error" />,
    info: <Info color="info" />
  };

  return icons[severity] || <Notifications />;
};

const NotificationBadge = ({ notifications = [], onClose }) => {
  const { markAsRead, clearAll } = useNotifications();

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.action) {
      notification.action();
    }
  };

  const handleClearAll = () => {
    clearAll();
    if (onClose) {
      onClose();
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Badge badgeContent={unreadCount} color="error" sx={{ mr: 1 }}>
            <Notifications color="action" />
          </Badge>
          <Typography variant="subtitle1">
            Notifications
          </Typography>
        </Box>
        {notifications.length > 0 && (
          <Button
            size="small"
            startIcon={<DoneAll />}
            onClick={handleClearAll}
          >
            Clear All
          </Button>
        )}
      </Box>

      <Divider />

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <NotificationList>
          {notifications.map((notification, index) => (
            <React.Fragment key={notification.id}>
              <NotificationItem
                severity={notification.severity}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  opacity: notification.read ? 0.7 : 1,
                  cursor: 'pointer'
                }}
              >
                <ListItemIcon>
                  <NotificationIcon severity={notification.severity} />
                </ListItemIcon>
                <ListItemText
                  primary={notification.title}
                  secondary={
                    <React.Fragment>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {notification.message}
                      </Typography>
                      <br />
                      <Typography
                        component="span"
                        variant="caption"
                        color="text.secondary"
                      >
                        {new Date(notification.timestamp).toLocaleString()}
                      </Typography>
                    </React.Fragment>
                  }
                />
                {!notification.read && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notification.id);
                    }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                )}
              </NotificationItem>
              {index < notifications.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </NotificationList>
      ) : (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            No notifications
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default NotificationBadge;
