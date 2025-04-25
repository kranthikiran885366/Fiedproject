import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CCTVMonitor from '../CCTVMonitor';
import { io } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    emit: jest.fn(),
    on: jest.fn(),
    disconnect: jest.fn()
  }))
}));

// Mock media devices
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }]
    })
  },
  writable: true
});

describe('CCTVMonitor', () => {
  const mockClassId = 'test-class-id';
  const mockSocket = {
    emit: jest.fn(),
    on: jest.fn(),
    disconnect: jest.fn()
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup socket.io mock
    io.mockImplementation(() => mockSocket);
  });

  test('renders initial state correctly', () => {
    render(<CCTVMonitor classId={mockClassId} />);
    
    expect(screen.getByText('CCTV Monitoring')).toBeInTheDocument();
    expect(screen.getByText('Status: Idle')).toBeInTheDocument();
    expect(screen.getByText('Start Monitoring')).toBeInTheDocument();
  });

  test('starts monitoring when button is clicked', async () => {
    render(<CCTVMonitor classId={mockClassId} />);
    
    // Mock successful API response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true
    });

    // Click start button
    fireEvent.click(screen.getByText('Start Monitoring'));

    // Wait for monitoring to start
    await waitFor(() => {
      expect(screen.getByText('Stop Monitoring')).toBeInTheDocument();
      expect(screen.getByText('Status: Monitoring active')).toBeInTheDocument();
    });

    // Verify socket connection
    expect(io).toHaveBeenCalledWith(process.env.REACT_APP_API_URL);
  });

  test('stops monitoring when stop button is clicked', async () => {
    render(<CCTVMonitor classId={mockClassId} />);
    
    // Start monitoring first
    global.fetch = jest.fn().mockResolvedValue({
      ok: true
    });
    fireEvent.click(screen.getByText('Start Monitoring'));
    
    // Wait for monitoring to start
    await waitFor(() => {
      expect(screen.getByText('Stop Monitoring')).toBeInTheDocument();
    });

    // Click stop button
    fireEvent.click(screen.getByText('Stop Monitoring'));

    // Wait for monitoring to stop
    await waitFor(() => {
      expect(screen.getByText('Start Monitoring')).toBeInTheDocument();
      expect(screen.getByText('Status: Monitoring stopped')).toBeInTheDocument();
    });
  });

  test('displays face detections', async () => {
    render(<CCTVMonitor classId={mockClassId} />);
    
    // Simulate face detection event
    const mockDetections = [
      {
        label: 'student-1',
        distance: 0.3,
        recognized: true,
        box: { left: 100, top: 100, width: 50, height: 50 }
      },
      {
        label: 'Unknown',
        distance: 0.8,
        recognized: false,
        box: { left: 200, top: 200, width: 50, height: 50 }
      }
    ];

    // Trigger socket event
    const faceDetectionCallback = mockSocket.on.mock.calls.find(
      call => call[0] === 'face-detections'
    )[1];
    faceDetectionCallback({ detections: mockDetections });

    // Verify detection boxes are rendered
    await waitFor(() => {
      expect(screen.getByText('student-1')).toBeInTheDocument();
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });
  });

  test('displays attendance captures', async () => {
    render(<CCTVMonitor classId={mockClassId} />);
    
    // Simulate attendance marked event
    const mockCapture = {
      studentId: 'student-1',
      timestamp: new Date().toISOString(),
      capturePath: '/captures/face_2024-01-01.jpg'
    };

    // Trigger socket event
    const attendanceCallback = mockSocket.on.mock.calls.find(
      call => call[0] === 'attendance-marked'
    )[1];
    attendanceCallback(mockCapture);

    // Verify capture is displayed
    await waitFor(() => {
      expect(screen.getByText('Student ID: student-1')).toBeInTheDocument();
    });
  });

  test('handles camera access errors', async () => {
    // Mock camera access error
    global.navigator.mediaDevices.getUserMedia.mockRejectedValue(
      new Error('Camera access denied')
    );

    render(<CCTVMonitor classId={mockClassId} />);
    
    // Click start button
    fireEvent.click(screen.getByText('Start Monitoring'));

    // Verify error status is displayed
    await waitFor(() => {
      expect(screen.getByText('Error starting monitoring')).toBeInTheDocument();
    });
  });

  test('cleans up resources on unmount', () => {
    const { unmount } = render(<CCTVMonitor classId={mockClassId} />);
    
    // Start monitoring
    global.fetch = jest.fn().mockResolvedValue({
      ok: true
    });
    fireEvent.click(screen.getByText('Start Monitoring'));

    // Unmount component
    unmount();

    // Verify cleanup
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
}); 