const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/authConfig');

class AuthService {
  async register(userData) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new Error('User already exists');
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Create new user
      const user = new User({
        ...userData,
        password: hashedPassword
      });

      await user.save();

      // Generate JWT token
      const token = this.generateToken(user);

      return {
        token,
        user: this.sanitizeUser(user)
      };
    } catch (error) {
      throw error;
    }
  }

  async login(email, password) {
    try {
      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new Error('Invalid credentials');
      }

      // Generate JWT token
      const token = this.generateToken(user);

      return {
        token,
        user: this.sanitizeUser(user)
      };
    } catch (error) {
      throw error;
    }
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      return this.sanitizeUser(user);
    } catch (error) {
      throw error;
    }
  }

  async changePassword(userId, oldPassword, newPassword) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify old password
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        throw new Error('Invalid old password');
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password
      user.password = hashedPassword;
      await user.save();

      return true;
    } catch (error) {
      throw error;
    }
  }

  async resetPassword(email) {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('User not found');
      }

      // Generate reset token
      const resetToken = this.generateResetToken(user);

      // TODO: Send reset email
      
      return true;
    } catch (error) {
      throw error;
    }
  }

  async updateProfile(userId, updateData) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      return this.sanitizeUser(user);
    } catch (error) {
      throw error;
    }
  }

  generateToken(user) {
    return jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiration }
    );
  }

  generateResetToken(user) {
    return jwt.sign(
      {
        userId: user._id,
        purpose: 'password_reset'
      },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
  }

  sanitizeUser(user) {
    const sanitized = user.toObject();
    delete sanitized.password;
    return sanitized;
  }
}

module.exports = new AuthService();
