const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    regNumber: { 
      type: String, 
      trim: true,
      validate: {
        validator: async function(value) {
          if (!value && (this.role === 'student' || this.role === 'faculty')) {
            return false;
          }
          if (!value) return true;
          
          const count = await mongoose.models.User.countDocuments({
            _id: { $ne: this._id },
            regNumber: value
          });
          return count === 0;
        },
        message: props => 
          !props.value ? 'Registration number is required for students and faculty' : 
          'Registration number must be unique'
      }
    },
    fullName: { type: String, required: true, trim: true },
    phoneNumber: { 
      type: String, 
      required: true, 
      trim: true,
      match: [/^[0-9]{10}$/, 'Phone number must be 10 digits']
    },
    dob: { type: Date, required: true },
    role: { 
      type: String, 
      required: true, 
      enum: {
        values: ['student', 'faculty', 'admin'],
        message: '{VALUE} is not a valid role'
      },
      default: 'student'
    },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: { type: String, required: true },
    photo: { type: String }, // Base64 or Image URL
    department: { type: String, required: true, trim: true },
    
    // Student-specific fields
    section: { 
      type: String, 
      required: function() { return this.role === 'student'; }, 
      trim: true 
    },
    branch: { 
      type: String, 
      required: function() { return this.role === 'student'; }, 
      trim: true 
    },
    course: { 
      type: String, 
      required: function() { return this.role === 'student'; }, 
      trim: true 
    },
    parentName: { 
      type: String, 
      required: function() { return this.role === 'student'; }, 
      trim: true 
    },
    parentPhone: { 
      type: String, 
      required: function() { return this.role === 'student'; }, 
      trim: true,
      match: [/^[0-9]{10}$/, 'Parent phone number must be 10 digits']
    },
    counselor: { 
      type: String, 
      required: function() { return this.role === 'student'; }, 
      trim: true 
    },
    
    // Faculty-specific fields
    designation: { 
      type: String, 
      required: function() { return this.role === 'faculty'; }, 
      trim: true 
    },
    specialization: { type: String, trim: true },
    qualifications: [{ type: String, trim: true }],
    
    // Common metadata
    status: { 
      type: String, 
      enum: ['active', 'inactive', 'suspended'], 
      default: 'active' 
    },
    lastLogin: { type: Date },
    metadata: { type: Map, of: String } // For any additional role-specific data
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ regNumber: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });

// Virtual for full name with title (Mr./Ms./Dr.)
userSchema.virtual('fullNameWithTitle').get(function() {
  const title = this.role === 'faculty' ? 
    (this.qualifications && this.qualifications.includes('Ph.D') ? 'Dr.' : 'Prof.') :
    (this.gender === 'male' ? 'Mr.' : 'Ms.');
  return `${title} ${this.fullName}`;
});

// Virtual for age
userSchema.virtual('age').get(function() {
  if (!this.dob) return null;
  const today = new Date();
  const birthDate = new Date(this.dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

module.exports = mongoose.model("User", userSchema);
