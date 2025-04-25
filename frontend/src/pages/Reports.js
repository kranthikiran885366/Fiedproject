import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip
} from '@mui/material';
import {
  Download,
  Print,
  Share,
  FilterList,
  Search
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { useQuery } from 'react-query';
import { analyticsAPI } from '../services/api';

import AttendanceReportGenerator from '../components/reports/AttendanceReportGenerator';
import InteractiveReport from '../components/reports/InteractiveReport';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from 'react-query';
import { reportAPI } from '../services/api';

const Reports = () => {
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState(null);
  
  const { data: reportData } = useQuery(
    ['reportData', selectedReport],
    () => selectedReport && reportAPI.getReportData(selectedReport),
    { enabled: !!selectedReport }
  );

  const isHOD = user.role === 'hod';
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    type: 'all',
    searchQuery: ''
  });

  const { data: reports, isLoading } = useQuery(
    ['reports', filters],
    () => analyticsAPI.generateReport(filters)
  );

  const handleFilterChange = (field) => (event) => {
    setFilters(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleDateChange = (field) => (date) => {
    setFilters(prev => ({
      ...prev,
      [field]: date
    }));
  };

  const handleExport = (format) => {
    // Implementation for exporting reports
    console.log(`Exporting in ${format} format`);
  };

  const renderReportSection = () => {
    if (selectedReport && reportData) {
      return (
        <Box sx={{ mt: 4 }}>
          <InteractiveReport
            data={reportData}
            type={selectedReport.type}
          />
        </Box>
      );
    }
    return null;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Reports & Analytics
        </Typography>
        <Typography color="textSecondary">
          Generate and analyze attendance reports
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={3}>
            <DatePicker
              label="Start Date"
              value={filters.startDate}
              onChange={handleDateChange('startDate')}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <DatePicker
              label="End Date"
              value={filters.endDate}
              onChange={handleDateChange('endDate')}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={filters.type}
                onChange={handleFilterChange('type')}
                label="Report Type"
              >
                <MenuItem value="all">All Reports</MenuItem>
                <MenuItem value="attendance">Attendance</MenuItem>
                <MenuItem value="behavior">Behavior</MenuItem>
                <MenuItem value="emotion">Emotion</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Search"
              value={filters.searchQuery}
              onChange={handleFilterChange('searchQuery')}
              InputProps={{
                endAdornment: <Search color="action" />
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Actions */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={() => handleExport('pdf')}
        >
          Export PDF
        </Button>
        <Button
          variant="outlined"
          startIcon={<Print />}
          onClick={() => handleExport('print')}
        >
          Print
        </Button>
        <Button
          variant="outlined"
          startIcon={<Share />}
          onClick={() => handleExport('share')}
        >
          Share
        </Button>
      </Box>

      {/* Reports Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports?.map((report) => (
              <TableRow key={report.id}>
                <TableCell>{new Date(report.date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Chip
                    label={report.type}
                    color={
                      report.type === 'attendance' ? 'primary' :
                      report.type === 'behavior' ? 'secondary' :
                      'default'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>{report.description}</TableCell>
                <TableCell>
                  <Chip
                    label={report.status}
                    color={
                      report.status === 'completed' ? 'success' :
                      report.status === 'pending' ? 'warning' :
                      'error'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleExport(report.id)}
                  >
                    <Download />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleExport(report.id)}
                  >
                    <Share />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
          {/* Report Generator */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <AttendanceReportGenerator
            onReportGenerated={setSelectedReport}
            isHOD={isHOD}
          />
        </Grid>
      </Grid>

      {/* Interactive Report Display */}
      {renderReportSection()}
    </Container>
  );
};

export default Reports;
