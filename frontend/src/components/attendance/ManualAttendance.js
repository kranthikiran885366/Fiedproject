import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Save,
  Edit,
  History,
  CheckCircle,
  Cancel,
  Warning,
  Info
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import { attendanceAPI } from '../../services/api';

const ManualAttendance = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSession, setSelectedSession] = useState('');
  const [attendanceData, setAttendanceData] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modificationReason, setModificationReason] = useState('');
  const queryClient = useQueryClient();

  // Fetch class list
  const { data: classes } = useQuery(
    'facultyClasses',
    () => attendanceAPI.getFacultyClasses()
  );

  // Fetch sessions for selected class
  const { data: sessions } = useQuery(
    ['classSessions', selectedClass],
    () => attendanceAPI.getClassSessions(selectedClass),
    { enabled: !!selectedClass }
  );

  // Fetch student list with existing attendance
  const { data: students, isLoading } = useQuery(
    ['studentList', selectedClass, selectedDate, selectedSession],
    () => attendanceAPI.getStudentListWithAttendance(selectedClass, selectedDate, selectedSession),
    { enabled: !!(selectedClass && selectedDate && selectedSession) }
  );

  // Mutation for saving attendance
  const saveMutation = useMutation(
    (data) => attendanceAPI.saveManualAttendance(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['studentList', selectedClass, selectedDate, selectedSession]);
      }
    }
  );

  const handleAttendanceChange = (studentId, value) => {
    if (students.find(s => s.id === studentId)?.automaticAttendance) {
      setSelectedStudent(students.find(s => s.id === studentId));
      setOpenDialog(true);
    } else {
      setAttendanceData(prev => ({
        ...prev,
        [studentId]: value
      }));
    }
  };

  const handleModificationConfirm = () => {
    setAttendanceData(prev => ({
      ...prev,
      [selectedStudent.id]: !selectedStudent.present
    }));
    setOpenDialog(false);
    setSelectedStudent(null);
    setModificationReason('');
  };

  const handleSubmit = async () => {
    const attendanceRecords = Object.entries(attendanceData).map(([studentId, present]) => ({
      studentId,
      present,
      date: selectedDate,
      sessionId: selectedSession,
      classId: selectedClass,
      modifiedBy: 'faculty',
      modificationReason: students.find(s => s.id === studentId)?.automaticAttendance ? modificationReason : null
    }));

    await saveMutation.mutateAsync(attendanceRecords);
  };

  const getAttendanceStatus = (student) => {
    if (student.automaticAttendance) {
      return (
        <Tooltip title={`Marked by ${student.attendanceMethod} at ${student.attendanceTime}`}>
          <Chip
            icon={<CheckCircle />}
            label="Auto"
            color="primary"
            size="small"
          />
        </Tooltip>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Manual Attendance
        </Typography>

        {/* Class Selection Controls */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Select Class</InputLabel>
              <Select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                label="Select Class"
              >
                {classes?.map((cls) => (
                  <MenuItem key={cls.id} value={cls.id}>
                    {cls.name} ({cls.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              type="date"
              label="Date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Session</InputLabel>
              <Select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                label="Session"
              >
                {sessions?.map((session) => (
                  <MenuItem key={session.id} value={session.id}>
                    {session.name} ({session.timing})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Student List */}
        {students && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Roll No</TableCell>
                  <TableCell>Photo</TableCell>
                  <TableCell>Student Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Present</TableCell>
                  <TableCell align="center">Absent</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.rollNo}</TableCell>
                    <TableCell>
                      <Avatar src={student.photoUrl} alt={student.name}>
                        {student.name.charAt(0)}
                      </Avatar>
                    </TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>
                      {getAttendanceStatus(student)}
                    </TableCell>
                    <TableCell align="center">
                      <Checkbox
                        checked={attendanceData[student.id] === true || 
                          (student.automaticAttendance && student.present && !attendanceData[student.id] === false)}
                        onChange={() => handleAttendanceChange(student.id, true)}
                        color="success"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Checkbox
                        checked={attendanceData[student.id] === false ||
                          (student.automaticAttendance && !student.present && !attendanceData[student.id] === true)}
                        onChange={() => handleAttendanceChange(student.id, false)}
                        color="error"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Submit Button */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSubmit}
            disabled={saveMutation.isLoading || !selectedClass || !selectedDate || !selectedSession}
          >
            Save Attendance
          </Button>
        </Box>

        {/* Modification Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>
            Modify Automatic Attendance
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 2, mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Student: {selectedStudent?.name}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Current Status: {selectedStudent?.present ? 'Present' : 'Absent'}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Marked by: {selectedStudent?.attendanceMethod}
              </Typography>
            </Box>
            <TextField
              fullWidth
              label="Reason for Modification"
              multiline
              rows={4}
              value={modificationReason}
              onChange={(e) => setModificationReason(e.target.value)}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleModificationConfirm}
              disabled={!modificationReason.trim()}
            >
              Confirm Change
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ManualAttendance;
