const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const CCTVService = require("./services/cctvService");
const fs = require("fs");
require("dotenv").config();
const nodemon=require('nodemon')

const authRoutes = require("./routes/authRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const signupRoutes = require("./routes/signupRoutes");
const classRoutes = require("./routes/classRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Initialize CCTV Service
const cctvService = new CCTVService(io);

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true })); // Enable form data support
app.use(cors());

// Ensure the uploads directory exists
const UPLOAD_DIR = "./uploads";
fs.mkdir(UPLOAD_DIR, { recursive: true }, (err) => {
  if (err) console.error("❌ Error creating uploads directory:", err);
  else console.log(`📁 Upload directory ready: ${UPLOAD_DIR}`);
});

// ✅ **MongoDB Connection - Fixed**
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/attendance")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Multer Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB file limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
  },
});

// API Routes
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/signup", signupRoutes);
app.use("/api/class", classRoutes);
app.use("/api/session", sessionRoutes);
app.use("/api/admin", adminRoutes);

// File Upload Route
app.post("/upload", upload.single("photo"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.json({ message: "File uploaded successfully", filePath: `/uploads/${req.file.filename}` });
});

// Root Route
app.get("/", (req, res) => {
  res.send("✅ Welcome to the Automated Attendance System API");
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.message);
  res.status(500).json({ error: "Internal Server Error" });
});

// Start Server
const PORT = 40001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
}).on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});
