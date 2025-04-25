import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Button,
  Snackbar,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { settingsService } from '../services/settingsService';

const Settings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    privacy: {
      profileVisibility: 'public',
      showAttendance: true
    },
    appearance: {
      theme: 'light',
      fontSize: 'medium'
    }
  });
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      const response = await settingsService.getSettings();
      if (response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaveLoading(true);
    try {
      await settingsService.updateSettings(settings);
      setSnackbar({ open: true, message: 'Settings saved successfully' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to save settings' });
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Notifications
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={settings.notifications.email}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, email: e.target.checked }
                })}
              />
            }
            label="Email Notifications"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.notifications.push}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, push: e.target.checked }
                })}
              />
            }
            label="Push Notifications"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.notifications.sms}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, sms: e.target.checked }
                })}
              />
            }
            label="SMS Notifications"
          />
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Privacy
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={settings.privacy.showAttendance}
                onChange={(e) => setSettings({
                  ...settings,
                  privacy: { ...settings.privacy, showAttendance: e.target.checked }
                })}
              />
            }
            label="Show Attendance History"
          />
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Appearance
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={settings.appearance.theme === 'dark'}
                onChange={(e) => setSettings({
                  ...settings,
                  appearance: { ...settings.appearance, theme: e.target.checked ? 'dark' : 'light' }
                })}
              />
            }
            label="Dark Mode"
          />
        </CardContent>
      </Card>

      <Box display="flex" justifyContent="flex-end">
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={saveLoading}
        >
          Save Changes
          {saveLoading && <CircularProgress size={24} sx={{ ml: 1 }} />}
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
};

export default Settings;
