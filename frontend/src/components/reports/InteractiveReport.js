import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const InteractiveReport = ({ data, type = 'attendance' }) => {
  const [chartType, setChartType] = useState('bar');
  const [timeRange, setTimeRange] = useState('daily');

  const handleChartTypeChange = (event, newType) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="attendance" fill="#8884d8" name="Attendance %" />
              {type === 'comprehensive' && (
                <>
                  <Bar dataKey="onTime" fill="#82ca9d" name="On Time %" />
                  <Bar dataKey="late" fill="#ffc658" name="Late %" />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="attendance"
                stroke="#8884d8"
                name="Attendance %"
              />
              {type === 'comprehensive' && (
                <>
                  <Line
                    type="monotone"
                    dataKey="onTime"
                    stroke="#82ca9d"
                    name="On Time %"
                  />
                  <Line
                    type="monotone"
                    dataKey="late"
                    stroke="#ffc658"
                    name="Late %"
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={150}
                label
              >
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const renderStats = () => {
    if (!data || !data.length) return null;

    const stats = {
      average: data.reduce((acc, curr) => acc + curr.attendance, 0) / data.length,
      highest: Math.max(...data.map(item => item.attendance)),
      lowest: Math.min(...data.map(item => item.attendance))
    };

    return (
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="subtitle2" color="textSecondary">
              Average Attendance
            </Typography>
            <Typography variant="h4">
              {stats.average.toFixed(1)}%
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="subtitle2" color="textSecondary">
              Highest Attendance
            </Typography>
            <Typography variant="h4">
              {stats.highest}%
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="subtitle2" color="textSecondary">
              Lowest Attendance
            </Typography>
            <Typography variant="h4">
              {stats.lowest}%
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Interactive Attendance Report
          </Typography>
          <Box>
            <FormControl sx={{ minWidth: 120, mr: 2 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                label="Time Range"
                size="small"
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>
            <ToggleButtonGroup
              value={chartType}
              exclusive
              onChange={handleChartTypeChange}
              size="small"
            >
              <ToggleButton value="bar">Bar</ToggleButton>
              <ToggleButton value="line">Line</ToggleButton>
              <ToggleButton value="pie">Pie</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {renderChart()}
        {renderStats()}
      </CardContent>
    </Card>
  );
};

export default InteractiveReport;
