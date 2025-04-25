import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

class NotificationService {
  constructor() {
    this.socket = io(process.env.REACT_APP_API_URL);
    this.setupSocketListeners();
  }

  setupSocketListeners() {
    this.socket.on('attendance_marked', (data) => {
      this.showAttendanceNotification(data);
    });

    this.socket.on('late_arrival', (data) => {
      this.showLateArrivalNotification(data);
    });

    this.socket.on('absent_student', (data) => {
      this.showAbsentNotification(data);
    });

    this.socket.on('system_alert', (data) => {
      this.showSystemAlert(data);
    });
  }

  showAttendanceNotification(data) {
    toast.success(`Attendance marked for ${data.studentName}`, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  }

  showLateArrivalNotification(data) {
    toast.warning(`${data.studentName} arrived late at ${data.time}`, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  }

  showAbsentNotification(data) {
    toast.error(`${data.studentName} is absent today`, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  }

  showSystemAlert(data) {
    toast.info(data.message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  }

  disconnect() {
    this.socket.disconnect();
  }
}

export default new NotificationService();
  