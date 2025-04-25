const socketIO = require('socket.io');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

class SocketService {
    constructor(server) {
        this.io = socketIO(server, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:3000",
                methods: ["GET", "POST"]
            }
        });
        this.setupSocketHandlers();
    }

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log('New client connected');

            // Join class room
            socket.on('join-class', async ({ classId, userId }) => {
                socket.join(`class-${classId}`);
                const user = await User.findById(userId);
                if (user) {
                    this.io.to(`class-${classId}`).emit('user-joined', {
                        userId: user._id,
                        name: user.name,
                        role: user.role
                    });
                }
            });

            // Real-time attendance updates
            socket.on('attendance-marked', async ({ classId, userId, status }) => {
                const user = await User.findById(userId);
                if (user) {
                    this.io.to(`class-${classId}`).emit('attendance-update', {
                        userId: user._id,
                        name: user.name,
                        status,
                        timestamp: new Date()
                    });
                }
            });

            // Live location tracking
            socket.on('location-update', ({ classId, userId, location }) => {
                this.io.to(`class-${classId}`).emit('user-location', {
                    userId,
                    location,
                    timestamp: new Date()
                });
            });

            // Disconnect handler
            socket.on('disconnect', () => {
                console.log('Client disconnected');
            });
        });
    }

    // Method to broadcast attendance session start
    broadcastSessionStart(classId, sessionData) {
        this.io.to(`class-${classId}`).emit('session-started', sessionData);
    }

    // Method to broadcast attendance session end
    broadcastSessionEnd(classId, sessionData) {
        this.io.to(`class-${classId}`).emit('session-ended', sessionData);
    }

    // Method to send real-time attendance statistics
    async broadcastAttendanceStats(classId) {
        const stats = await Attendance.aggregate([
            { $match: { classId } },
            { $group: {
                _id: '$status',
                count: { $sum: 1 }
            }}
        ]);
        this.io.to(`class-${classId}`).emit('attendance-stats', stats);
    }
}

module.exports = SocketService; 