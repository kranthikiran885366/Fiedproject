# Smart Attendance System

A modern, AI-powered attendance management system with facial recognition and advanced security features.

## Features

### Core Features
- User Authentication with Role-based Access
- Interactive Dashboards
- Facial Recognition Attendance
- Geolocation Tracking
- Real-time Notifications
- Dynamic Reporting

### Advanced Features
- CCTV Integration
- Liveness Detection
- Blockchain-based Record Storage
- Predictive Analytics

## Tech Stack

### Frontend
- React.js
- TailwindCSS
- Face-api.js (facial recognition)
- Socket.io-client (real-time updates)
- Redux Toolkit (state management)

### Backend
- Node.js with Express
- MongoDB (main database)
- Redis (caching)
- Socket.io (real-time communication)
- JWT (authentication)
- TensorFlow.js (AI/ML processing)

## Prerequisites

- Node.js >= 16.x
- MongoDB >= 5.x
- Redis >= 6.x
- Webcam access
- GPS capabilities

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. Set up environment variables:
   Create `.env` files in both frontend and backend directories.

4. Start the development servers:
   ```bash
   # Start backend
   cd backend
   npm run dev

   # Start frontend
   cd frontend
   npm start
   ```

## Environment Variables

### Backend
```
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
REDIS_URL=your_redis_url
```

### Frontend
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

## Project Structure

```
.
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   └── utils/
│   └── public/
└── backend/
    ├── src/
    │   ├── controllers/
    │   ├── models/
    │   ├── routes/
    │   ├── services/
    │   └── utils/
    └── config/
```

## Security Features

- Password hashing using bcrypt
- JWT-based authentication
- Rate limiting
- CORS protection
- Liveness detection for face recognition
- Geofencing for location validation
- Blockchain-based attendance records

## License

MIT License
