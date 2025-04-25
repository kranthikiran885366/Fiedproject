import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
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
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import DownloadIcon from '@mui/icons-material/Download';

const Reports = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const mockData = [
        {
          id: 1,
          studentName: 'John Doe',
          totalClasses: 20,
          attended: 18,
          percentage: 90,
          lastAttended: '2025-04-08',
        },
        {
          id: 2,
          studentName: 'Jane Smith',
          totalClasses: 20,
          attended: 16,
          percentage: 80,
          lastAttended: '2025-04-09',
        },
      ];
      setReportData(mockData);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    // TODO: Implement report download functionality
    console.log('Downloading report...');
  };

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Typography variant="h4" gutterBottom>
          Attendance Reports
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper elevation={2}>
              <Box p={3}>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth>
                      <InputLabel>Select Class</InputLabel>
                      <Select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        label="Select Class"
                      >
                        <MenuItem value="mathematics">Mathematics</MenuItem>
                        <MenuItem value="physics">Physics</MenuItem>
                        <MenuItem value="chemistry">Chemistry</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Start Date"
                        value={startDate}
                        onChange={setStartDate}
                        renderInput={(params) => <FormControl fullWidth {...params} />}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="End Date"
                        value={endDate}
                        onChange={setEndDate}
                        renderInput={(params) => <FormControl fullWidth {...params} />}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      onClick={handleGenerateReport}
                      disabled={!selectedClass || !startDate || !endDate}
                    >
                      Generate Report
                    </Button>
                  </Grid>
                </Grid>

                {reportData.length > 0 && (
                  <Box mt={4}>
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography variant="h6">Report Results</Typography>
                      <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleDownloadReport}
                      >
                        Download Report
                      </Button>
                    </Box>

                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Student Name</TableCell>
                            <TableCell align="right">Total Classes</TableCell>
                            <TableCell align="right">Attended</TableCell>
                            <TableCell align="right">Percentage</TableCell>
                            <TableCell>Last Attended</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {loading ? (
                            <TableRow>
                              <TableCell colSpan={5} align="center">
                                Generating report...
                              </TableCell>
                            </TableRow>
                          ) : (
                            reportData.map((row) => (
                              <TableRow key={row.id}>
                                <TableCell>{row.studentName}</TableCell>
                                <TableCell align="right">{row.totalClasses}</TableCell>
                                <TableCell align="right">{row.attended}</TableCell>
                                <TableCell align="right">{row.percentage}%</TableCell>
                                <TableCell>{row.lastAttended}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Reports;
