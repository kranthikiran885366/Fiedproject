# API Routes Documentation

Base URL: `http://localhost:5000/api`

## Authentication Routes

### Register User
- **POST** `/auth/register`
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student",
  "rollNumber": "ST123" // Required for students
}
```

### Login
- **POST** `/auth/login`
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

## Student Routes

### Get Student Profile
- **GET** `/students/profile`
- Headers: `Authorization: Bearer {token}`

### Get Student Attendance
- **GET** `/students/attendance`
- Headers: `Authorization: Bearer {token}`

### Get Attendance Stats
- **GET** `/students/attendance/stats`
- Headers: `Authorization: Bearer {token}`

### Mark Attendance
- **POST** `/students/attendance/mark`
- Headers: 
  - `Authorization: Bearer {token}`
  - `Content-Type: multipart/form-data`
```json
{
  "image": "(binary file)", // Face image for verification
  "classId": "class123",
  "verificationMethod": "face_recognition"
}
```

### Submit Correction Request
- **POST** `/students/attendance/correction`
- Headers: `Authorization: Bearer {token}`
```json
{
  "attendanceId": "att123",
  "reason": "I was present but marked absent",
  "evidence": "(optional file attachment)"
}
```

### Get Correction Requests
- **GET** `/students/corrections`
- Headers: `Authorization: Bearer {token}`

## Faculty Routes

### Get Faculty Profile
- **GET** `/faculty/profile`
- Headers: `Authorization: Bearer {token}`

### Get Classes
- **GET** `/faculty/classes`
- Headers: `Authorization: Bearer {token}`

### Create Class
- **POST** `/faculty/classes`
- Headers: `Authorization: Bearer {token}`
```json
{
  "name": "Computer Science 101",
  "subject": "Introduction to Programming",
  "schedule": {
    "days": ["Monday", "Wednesday"],
    "startTime": "09:00",
    "endTime": "10:30"
  }
}
```

### Start Attendance Session
- **POST** `/faculty/classes/{classId}/attendance/start`
- Headers: `Authorization: Bearer {token}`
```json
{
  "duration": 30, // Session duration in minutes
  "verificationMethod": "face_recognition"
}
```

### End Attendance Session
- **POST** `/faculty/classes/{classId}/attendance/end`
- Headers: `Authorization: Bearer {token}`

### Get Class Attendance
- **GET** `/faculty/classes/{classId}/attendance`
- Headers: `Authorization: Bearer {token}`
- Query Parameters:
  - `date`: "YYYY-MM-DD" (optional)
  - `status`: "present" | "absent" | "all" (optional)

### Get Correction Requests
- **GET** `/faculty/corrections`
- Headers: `Authorization: Bearer {token}`
- Query Parameters:
  - `status`: "pending" | "approved" | "rejected" | "all"
  - `classId`: (optional)

### Handle Correction Request
- **PUT** `/faculty/corrections/{requestId}`
- Headers: `Authorization: Bearer {token}`
```json
{
  "status": "approved" | "rejected",
  "comment": "Optional comment for rejection"
}
```

## Admin Routes

### Get All Users
- **GET** `/admin/users`
- Headers: `Authorization: Bearer {token}`
- Query Parameters:
  - `role`: "student" | "faculty" | "admin"
  - `page`: number
  - `limit`: number

### Update User
- **PUT** `/admin/users/{userId}`
- Headers: `Authorization: Bearer {token}`
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "role": "student",
  "status": "active" | "inactive"
}
```

### Get System Stats
- **GET** `/admin/stats`
- Headers: `Authorization: Bearer {token}`

### Get Audit Logs
- **GET** `/admin/logs`
- Headers: `Authorization: Bearer {token}`
- Query Parameters:
  - `type`: "attendance" | "correction" | "auth"
  - `startDate`: "YYYY-MM-DD"
  - `endDate`: "YYYY-MM-DD"
  - `page`: number
  - `limit`: number

## Common Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

## Common Error Codes
- `AUTH_001`: Authentication failed
- `AUTH_002`: Token expired
- `AUTH_003`: Invalid token
- `PERM_001`: Permission denied
- `VAL_001`: Validation error
- `ATT_001`: Attendance session not active
- `ATT_002`: Already marked attendance
- `ATT_003`: Face verification failed
- `COR_001`: Invalid correction request
- `SYS_001`: System error
