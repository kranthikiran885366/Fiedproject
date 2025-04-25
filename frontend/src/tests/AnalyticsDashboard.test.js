import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import AnalyticsDashboard from '../components/AnalyticsDashboard';

jest.mock('axios');

const mockAnalyticsData = {
  daily: [
    { date: '2024-03-20', present: 25, absent: 5, late: 3 },
    { date: '2024-03-19', present: 23, absent: 7, late: 2 }
  ],
  weekly: [
    { week: '2024-W11', present: 120, absent: 30, late: 15 },
    { week: '2024-W10', present: 115, absent: 35, late: 12 }
  ],
  monthly: [
    { month: '2024-03', present: 480, absent: 120, late: 60 },
    { month: '2024-02', present: 460, absent: 140, late: 48 }
  ]
};

describe('AnalyticsDashboard Component', () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({ data: mockAnalyticsData });
  });

  test('renders analytics dashboard', async () => {
    render(<AnalyticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Total Attendance')).toBeInTheDocument();
      expect(screen.getByText('Present')).toBeInTheDocument();
      expect(screen.getByText('Absent')).toBeInTheDocument();
      expect(screen.getByText('Late Arrivals')).toBeInTheDocument();
    });
  });

  test('displays correct attendance statistics', async () => {
    render(<AnalyticsDashboard />);
    
    await waitFor(() => {
      const total = mockAnalyticsData.daily.reduce((acc, curr) => 
        acc + curr.present + curr.absent + curr.late, 0
      );
      expect(screen.getByText(total.toString())).toBeInTheDocument();
    });
  });

  test('handles time range changes', async () => {
    render(<AnalyticsDashboard />);
    
    const timeRangeSelect = screen.getByLabelText('Time Range');
    fireEvent.change(timeRangeSelect, { target: { value: 'weekly' } });
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/analytics'),
        expect.objectContaining({
          params: expect.objectContaining({
            range: 'weekly'
          })
        })
      );
    });
  });

  test('displays attendance trend chart', async () => {
    render(<AnalyticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Attendance Trend')).toBeInTheDocument();
      expect(screen.getByText('Attendance Distribution')).toBeInTheDocument();
    });
  });

  test('handles loading state', async () => {
    axios.get.mockImplementationOnce(() => new Promise(() => {}));
    
    render(<AnalyticsDashboard />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('handles error state', async () => {
    axios.get.mockRejectedValueOnce(new Error('Failed to fetch analytics'));
    
    render(<AnalyticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Error loading analytics data')).toBeInTheDocument();
    });
  });
}); 