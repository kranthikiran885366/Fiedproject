import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import StudentAttendanceHistory from '../components/StudentAttendanceHistory';

jest.mock('axios');

const mockAttendanceData = {
  records: [
    {
      id: '1',
      date: '2024-03-20',
      className: 'Test Class',
      time: '10:00:00',
      status: 'Present',
      remarks: 'On time'
    },
    {
      id: '2',
      date: '2024-03-19',
      className: 'Test Class',
      time: '10:15:00',
      status: 'Late',
      remarks: 'Late arrival'
    }
  ],
  pagination: {
    total: 2,
    page: 1,
    limit: 10,
    totalPages: 1
  }
};

describe('StudentAttendanceHistory Component', () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({ data: mockAttendanceData });
  });

  test('renders attendance history table', async () => {
    render(<StudentAttendanceHistory studentId="123" />);
    
    await waitFor(() => {
      expect(screen.getByText('Attendance History')).toBeInTheDocument();
      expect(screen.getByText('Test Class')).toBeInTheDocument();
      expect(screen.getByText('Present')).toBeInTheDocument();
      expect(screen.getByText('Late')).toBeInTheDocument();
    });
  });

  test('handles search functionality', async () => {
    render(<StudentAttendanceHistory studentId="123" />);
    
    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'Test' } });
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/students/123/attendance'),
        expect.objectContaining({
          params: expect.objectContaining({
            search: 'Test'
          })
        })
      );
    });
  });

  test('handles filter changes', async () => {
    render(<StudentAttendanceHistory studentId="123" />);
    
    const filterButton = screen.getByTestId('filter-button');
    fireEvent.click(filterButton);
    
    const statusFilter = screen.getByLabelText('Status');
    fireEvent.change(statusFilter, { target: { value: 'Present' } });
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/students/123/attendance'),
        expect.objectContaining({
          params: expect.objectContaining({
            status: 'Present'
          })
        })
      );
    });
  });

  test('handles CSV export', async () => {
    const mockBlob = new Blob(['test'], { type: 'text/csv' });
    axios.get.mockResolvedValueOnce({ data: mockBlob });
    
    render(<StudentAttendanceHistory studentId="123" />);
    
    const downloadButton = screen.getByTestId('download-button');
    fireEvent.click(downloadButton);
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/students/123/attendance/export')
      );
    });
  });

  test('handles pagination', async () => {
    render(<StudentAttendanceHistory studentId="123" />);
    
    const nextPageButton = screen.getByTestId('next-page');
    fireEvent.click(nextPageButton);
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/students/123/attendance'),
        expect.objectContaining({
          params: expect.objectContaining({
            page: 2
          })
        })
      );
    });
  });
}); 