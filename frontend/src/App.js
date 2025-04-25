import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { AttendanceProvider } from './contexts/AttendanceContext';
import theme from './theme';
import Layout from './components/Layout';
import Home from './components/home';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Attendance from './components/Attendance';
import Settings from './components/Settings';
import AdminPanel from './components/AdminPanel';
import PrivateRoute from './components/auth/PrivateRoute';
import AdminRoute from './components/auth/AdminRoute';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AttendanceProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route
                path="dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="attendance"
                element={
                  <PrivateRoute>
                    <Attendance />
                  </PrivateRoute>
                }
              />
              <Route
                path="settings"
                element={
                  <PrivateRoute>
                    <Settings />
                  </PrivateRoute>
                }
              />
              <Route
                path="admin"
                element={
                  <AdminRoute>
                    <AdminPanel />
                  </AdminRoute>
                }
              />
            </Route>
          </Routes>
        </AttendanceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
