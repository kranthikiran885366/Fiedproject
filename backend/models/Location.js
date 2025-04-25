const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  timestamp: { type: Date, default: Date.now },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  accuracy: { type: Number }, // Accuracy in meters
  altitude: { type: Number }, // Altitude in meters
  speed: { type: Number }, // Speed in meters per second
  heading: { type: Number }, // Heading in degrees
  metadata: {
    provider: String, // GPS, network, etc.
    deviceId: String,
    batteryLevel: Number,
    networkType: String,
    ipAddress: String
  },
  validationStatus: {
    type: String,
    enum: ['pending', 'valid', 'invalid', 'suspicious'],
    default: 'pending'
  },
  validationDetails: {
    distance: Number, // Distance from expected location in meters
    timestamp: Date,
    validator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String
  },
  flags: {
    isManual: { type: Boolean, default: false },
    isMocked: { type: Boolean, default: false },
    isOutOfBounds: { type: Boolean, default: false },
    requiresReview: { type: Boolean, default: false }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
locationSchema.index({ userId: 1, sessionId: 1, timestamp: -1 });
locationSchema.index({ location: '2dsphere' });
locationSchema.index({ validationStatus: 1 });

// Virtual for age of location data
locationSchema.virtual('age').get(function() {
  return Date.now() - this.timestamp;
});

// Method to validate location
locationSchema.methods.validate = async function(expectedLocation, validator) {
  // Calculate distance from expected location
  const distance = this.calculateDistance(expectedLocation);
  
  this.validationDetails = {
    distance,
    timestamp: new Date(),
    validator,
    notes: `Distance from expected location: ${distance}m`
  };

  // Update validation status based on distance
  if (distance <= 50) { // Within 50 meters
    this.validationStatus = 'valid';
  } else if (distance <= 100) { // Within 100 meters
    this.validationStatus = 'suspicious';
    this.flags.requiresReview = true;
  } else {
    this.validationStatus = 'invalid';
    this.flags.isOutOfBounds = true;
    this.flags.requiresReview = true;
  }

  await this.save();
  return this.validationStatus;
};

// Method to calculate distance between two points
locationSchema.methods.calculateDistance = function(point) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = this.location.coordinates[1] * Math.PI/180;
  const φ2 = point.coordinates[1] * Math.PI/180;
  const Δφ = (point.coordinates[1] - this.location.coordinates[1]) * Math.PI/180;
  const Δλ = (point.coordinates[0] - this.location.coordinates[0]) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};

// Static method to get user's location history
locationSchema.statics.getUserHistory = function(userId, startTime, endTime) {
  return this.find({
    userId,
    timestamp: {
      $gte: startTime,
      $lte: endTime
    }
  }).sort({ timestamp: 1 });
};

// Static method to get nearby users
locationSchema.statics.getNearbyUsers = function(coordinates, maxDistance) {
  return this.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: coordinates
        },
        distanceField: 'distance',
        maxDistance: maxDistance,
        spherical: true
      }
    },
    {
      $group: {
        _id: '$userId',
        lastLocation: { $last: '$$ROOT' },
        distance: { $first: '$distance' }
      }
    }
  ]);
};

// Static method to detect suspicious patterns
locationSchema.statics.detectSuspiciousPatterns = async function(userId, timeWindow) {
  const locations = await this.find({
    userId,
    timestamp: { $gte: new Date(Date.now() - timeWindow) }
  }).sort({ timestamp: 1 });

  let suspicious = false;
  let reason = '';

  // Check for impossible speed between consecutive points
  for (let i = 1; i < locations.length; i++) {
    const timeDiff = locations[i].timestamp - locations[i-1].timestamp;
    const distance = locations[i].calculateDistance(locations[i-1].location);
    const speed = distance / (timeDiff / 1000); // Speed in meters per second

    if (speed > 30) { // More than 30 m/s (108 km/h) is suspicious
      suspicious = true;
      reason = `Suspicious speed detected: ${speed.toFixed(2)} m/s`;
      break;
    }
  }

  return { suspicious, reason };
};

module.exports = mongoose.model('Location', locationSchema);
