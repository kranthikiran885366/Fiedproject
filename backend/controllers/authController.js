 const User = require("../models/User");
 const bcrypt = require("bcrypt");
 const jwt = require("jsonwebtoken");
 
 const registerUser = async (req, res) => {
   try {
     const { role = 'student', ...userData } = req.body;

     // Check if the user already exists
     const existingUser = await User.findOne({ email: userData.email });
     if (existingUser) return res.status(400).json({ message: "User already exists" });

     // Hash the password
     const hashedPassword = await bcrypt.hash(userData.password, 10);

     // Create user object based on role
     const userObj = {
       ...userData,
       role,
       password: hashedPassword
     };

     // Add photo if provided
     if (req.file) {
       userObj.photo = req.file.buffer.toString("base64");
     }

     // Create and save the new user
     const newUser = new User(userObj);
     await newUser.save();

     res.status(201).json({ message: "User registered successfully" });
   } catch (error) {
     console.error('Registration error:', error);
     res.status(500).json({ message: "Error during sign-up", error });
   }
 };
 
 const loginUser = async (req, res) => {
   try {
     const { email, password } = req.body;
 
     // Check if the user exists
     const user = await User.findOne({ email });
     if (!user) return res.status(400).json({ message: "Invalid email or password" });
 
     // Compare the provided password with the stored hashed password
     const isMatch = await bcrypt.compare(password, user.password);
     if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

     // Update last login time
     user.lastLogin = new Date();
     await user.save();
 
     // Generate a JWT token
     const token = jwt.sign(
       { 
         userId: user._id, 
         email: user.email,
         role: user.role,
         department: user.department
       }, 
       process.env.JWT_SECRET, 
       { expiresIn: "1h" }
     );
 
     res.status(200).json({
       message: "Login successful",
       token,
       user: {
         id: user._id,
         email: user.email,
         fullName: user.fullName,
         role: user.role,
         department: user.department
       }
     });
   } catch (error) {
     console.error('Login error:', error);
     res.status(500).json({ message: "Error during login", error });
   }
 };
 
 module.exports = { registerUser, loginUser };
 