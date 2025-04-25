import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import attendanceService from '../services/attendanceService';
import { useAuth } from './AuthContext';

const AttendanceContext = createContext(null);

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};

export const AttendanceProvider = ({ children }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [stats, setStats] = useState(null);

  const fetchAttendanceHistory = useCallback(async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      const history = await attendanceService.getAttendanceHistory(user._id);
      setAttendanceHistory(history);
    } catch (error) {
      console.error('Failed to fetch attendance history:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  const fetchAttendanceStats = useCallback(async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      const statistics = await attendanceService.getAttendanceStats(user._id);
      setStats(statistics);
    } catch (error) {
      console.error('Failed to fetch attendance stats:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    const loadData = async () => {
      if (user?._id) {
        try {
          await Promise.all([
            fetchAttendanceHistory(),
            fetchAttendanceStats()
          ]);
        } catch (error) {
          console.error('Failed to load attendance data:', error);
          setError('Failed to load attendance data');
        }
      }
    };
    loadData();
  }, [user?._id, fetchAttendanceHistory, fetchAttendanceStats]);

  const markAttendance = async (sessionId, data) => {
    try {
      setLoading(true);
      setError(null);

      // Verify face and location
      await verifyAttendanceRequirements(sessionId, data);

      // Mark attendance
      const result = await attendanceService.markAttendance({
        userId: user._id,
        sessionId,
        ...data
      });

      // Update local state
      setAttendanceHistory(prev => [result, ...prev]);
      updateStats(result);

      toast.success('Attendance marked successfully!');
      return result;
    } catch (error) {
      console.error('Attendance marking failed:', error);
      setError(error.message);
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyAttendanceRequirements = async (sessionId, data) => {
    const session = await attendanceService.getSessionDetails(sessionId);

    // Check if attendance marking is allowed
    if (session.status !== 'active') {
      throw new Error('Attendance session is not active');
    }

    // Verify face if required
    if (session.settings.requireFaceVerification && data.faceData) {
      const faceVerification = await attendanceService.verifyFace(data.faceData);
      if (!faceVerification.verified) {
        throw new Error('Face verification failed');
      }
    }

    // Verify location if required
    if (session.settings.requireLocation && data.location) {
      const locationValid = await attendanceService.verifyLocation(
        data.location,
        session.location
      );
      if (!locationValid) {
        throw new Error('You are not in the required location');
      }
    }
  };

  const startAttendanceSession = async (classId, settings) => {
    try {
      setLoading(true);
      setError(null);

      const session = await attendanceService.startSession(classId, settings);
      setCurrentSession(session);

      toast.success('Attendance session started successfully!');
      return session;
    } catch (error) {
      console.error('Session start failed:', error);
      setError(error.message);
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const endAttendanceSession = async (sessionId) => {
    try {
      setLoading(true);
      setError(null);

      await attendanceService.endSession(sessionId);
      setCurrentSession(null);

      toast.success('Attendance session ended successfully!');
    } catch (error) {
      console.error('Session end failed:', error);
      setError(error.message);
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (newAttendance) => {
    if (!stats) return;

    setStats(prev => ({
      ...prev,
      totalClasses: prev.totalClasses + 1,
      presentCount: newAttendance.status === 'present' ? prev.presentCount + 1 : prev.presentCount,
      attendancePercentage: ((prev.presentCount + (newAttendance.status === 'present' ? 1 : 0)) / (prev.totalClasses + 1)) * 100
    }));
  };

  const verifyBlockchainRecord = async (attendanceId) => {
    try {
      setLoading(true);
      setError(null);

      const verification = await attendanceService.verifyBlockchainRecord(attendanceId);
      
      if (verification.verified) {
        toast.success('Attendance record verified on blockchain!');
      } else {
        toast.error('Attendance record verification failed!');
      }

      return verification;
    } catch (error) {
      console.error('Blockchain verification failed:', error);
      setError(error.message);
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    loading,
    error,
    currentSession,
    attendanceHistory,
    stats,
    markAttendance,
    startAttendanceSession,
    endAttendanceSession,
    fetchAttendanceHistory,
    fetchAttendanceStats,
    verifyBlockchainRecord
  };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
};

export default AttendanceContext;
