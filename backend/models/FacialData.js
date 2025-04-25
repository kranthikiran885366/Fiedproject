const mongoose = require('mongoose');

const facialDataSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  faceDescriptor: {
    type: [Number],
    required: true,
    validate: {
      validator: function(v) {
        return v.length === 128; // Standard face descriptor length
      },
      message: 'Face descriptor must be a 128-dimensional vector'
    }
  },
  imageUrl: { type: String }, // URL to the facial image (if stored)
  imageHash: { type: String }, // Hash of the facial image for verification
  quality: {
    score: { type: Number, min: 0, max: 1 }, // Quality score of the facial data
    factors: {
      lighting: { type: Number, min: 0, max: 1 },
      pose: { type: Number, min: 0, max: 1 },
      resolution: { type: Number, min: 0, max: 1 },
      occlusion: { type: Number, min: 0, max: 1 }
    }
  },
  metadata: {
    captureDevice: String, // Device used to capture the facial data
    captureMethod: {
      type: String,
      enum: ['webcam', 'mobile', 'cctv', 'upload'],
      required: true
    },
    captureLocation: {
      latitude: Number,
      longitude: Number,
      accuracy: Number
    },
    captureEnvironment: {
      lightingCondition: String,
      background: String
    }
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'invalid', 'expired'],
    default: 'pending'
  },
  validationHistory: [{
    date: { type: Date, default: Date.now },
    result: {
      type: String,
      enum: ['pass', 'fail']
    },
    confidence: Number,
    reason: String
  }],
  usageStats: {
    totalMatches: { type: Number, default: 0 },
    successfulMatches: { type: Number, default: 0 },
    lastUsed: Date,
    averageMatchConfidence: { type: Number, default: 0 }
  },
  version: {
    type: String,
    required: true,
    default: '1.0' // Version of the face recognition model used
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
facialDataSchema.index({ userId: 1 });
facialDataSchema.index({ status: 1 });
facialDataSchema.index({ 'quality.score': 1 });

// Virtual for age of facial data
facialDataSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt;
});

// Method to update usage statistics
facialDataSchema.methods.updateUsageStats = async function(matchResult, confidence) {
  this.usageStats.totalMatches += 1;
  if (matchResult === 'pass') {
    this.usageStats.successfulMatches += 1;
  }
  this.usageStats.lastUsed = new Date();
  
  // Update average confidence using rolling average
  const oldAvg = this.usageStats.averageMatchConfidence;
  const totalMatches = this.usageStats.totalMatches;
  this.usageStats.averageMatchConfidence = 
    (oldAvg * (totalMatches - 1) + confidence) / totalMatches;
  
  await this.save();
};

// Method to validate facial data
facialDataSchema.methods.validate = async function(validationResult) {
  this.validationHistory.push({
    date: new Date(),
    result: validationResult.result,
    confidence: validationResult.confidence,
    reason: validationResult.reason
  });

  if (validationResult.result === 'fail') {
    this.status = 'invalid';
  }

  await this.save();
};

// Static method to get active facial data
facialDataSchema.statics.getActive = function(userId) {
  return this.findOne({
    userId,
    status: 'active'
  }).sort({ 'quality.score': -1 });
};

// Static method to get facial data statistics
facialDataSchema.statics.getStatistics = async function(filters) {
  return this.aggregate([
    { $match: filters },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgQuality: { $avg: '$quality.score' },
        avgSuccessRate: {
          $avg: {
            $cond: [
              { $gt: ['$usageStats.totalMatches', 0] },
              { $divide: ['$usageStats.successfulMatches', '$usageStats.totalMatches'] },
              0
            ]
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('FacialData', facialDataSchema);
