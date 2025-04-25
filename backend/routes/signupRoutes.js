const express = require("express");
const multer = require("multer");
const { registerUser, loginUser } = require("../controllers/authController");

const router = express.Router();

// Multer Configuration
const storage = multer.memoryStorage();
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

// Registration Route (with optional photo upload)
router.post("/register", upload.single("photo"), async (req, res, next) => {
  try {
    req.body.photo = req.file ? req.file.buffer.toString("base64") : null;
    await registerUser(req, res);
  } catch (error) {
    next(error);
  }
});

// Login Route
router.post("/login", loginUser);

// Global Error Handling Middleware
router.use((err, req, res, next) => {
  console.error("🔥 Route Error:", err.message);
  res.status(400).json({ error: err.message || "Something went wrong" });
});

module.exports = router;
