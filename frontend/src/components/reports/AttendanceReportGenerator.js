import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  TextField,
  Autocomplete,
  Stack,
  IconButton,
  Tooltip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  FileDownload,
  PictureAsPdf,
  TableChart,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { reportAPI } from '../../services/api';
import { format } from 'date-fns';

const AttendanceReportGenerator = () => {
  const [reportType, setReportType] = useState('daily');
  const [reportScope, setReportScope] = useState('student');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [exportFormat, setExportFormat] = useState('pdf');

  const { data: entities } = useQuery(
    ['entities', reportScope],
    () => reportAPI.getEntitiesByScope(reportScope)
  );

  const handleGenerateReport = async () => {
    const params = {
      type: reportType,
      scope: reportScope,
      startDate: startDate ? format(startDate, 'yyyy-MM-dd') : null,
      endDate: endDate ? format(endDate, 'yyyy-MM-dd') : null,
      entityId: selectedEntity?.id,
      format: exportFormat
    };

    try {
      const report = await reportAPI.generateReport(params);
      if (exportFormat === 'pdf') {
        window.open(report.url, '_blank');
      } else if (exportFormat === 'excel') {
        const link = document.createElement('a');
        link.href = report.url;
        link.download = `attendance_report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        link.click();
      }
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const getEntityLabel = (entity) => {
    switch (reportScope) {
      case 'student':
        return `${entity.name} (${entity.studentId})`;
      case 'class':
        return `${entity.courseName} - ${entity.section}`;
      case 'department':
        return entity.name;
      default:
        return entity.name;
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Generate Attendance Report
        </Typography>

        <Grid container spacing={3}>
          {/* Report Type Selection */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                label="Report Type"
              >
                <MenuItem value="daily">Daily Report</MenuItem>
                <MenuItem value="weekly">Weekly Report</MenuItem>
                <MenuItem value="monthly">Monthly Report</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Report Scope Selection */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Report Scope</InputLabel>
              <Select
                value={reportScope}
                onChange={(e) => setReportScope(e.target.value)}
                label="Report Scope"
              >
                <MenuItem value="student">Student-wise</MenuItem>
                <MenuItem value="class">Class-wise</MenuItem>
                <MenuItem value="department">Department-wise</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Date Range Selection */}
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
              {reportType === 'custom' && (
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={setEndDate}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              )}
            </Stack>
          </Grid>

          {/* Entity Selection */}
          <Grid item xs={12} md={6}>
            <Autocomplete
              value={selectedEntity}
              onChange={(event, newValue) => setSelectedEntity(newValue)}
              options={entities || []}
              getOptionLabel={getEntityLabel}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={`Select ${reportScope.charAt(0).toUpperCase() + reportScope.slice(1)}`}
                  fullWidth
                />
              )}
            />
          </Grid>

          {/* Export Format and Generate Button */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Tooltip title="Export as PDF">
                  <IconButton
                    color={exportFormat === 'pdf' ? 'primary' : 'default'}
                    onClick={() => setExportFormat('pdf')}
                  >
                    <PictureAsPdf />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Export as Excel">
                  <IconButton
                    color={exportFormat === 'excel' ? 'primary' : 'default'}
                    onClick={() => setExportFormat('excel')}
                  >
                    <TableChart />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Interactive Graph">
                  <IconButton
                    color={exportFormat === 'interactive' ? 'primary' : 'default'}
                    onClick={() => setExportFormat('interactive')}
                  >
                    <BarChartIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              <Button
                variant="contained"
                startIcon={<FileDownload />}
                onClick={handleGenerateReport}
                disabled={!selectedEntity || !startDate}
              >
                Generate Report
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default AttendanceReportGenerator;
