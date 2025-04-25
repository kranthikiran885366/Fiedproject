const geolib = require('geolib');

class GeofenceService {
  constructor() {
    this.campusBoundaries = {
      // Example coordinates for university campus
      mainCampus: {
        latitude: 12.9716,
        longitude: 77.5946,
        radius: 1000 // 1km radius
      },
      // Add more campus locations as needed
    };
  }

  isWithinCampus(latitude, longitude) {
    return Object.values(this.campusBoundaries).some(campus => {
      const distance = geolib.getDistance(
        { latitude, longitude },
        { latitude: campus.latitude, longitude: campus.longitude }
      );
      return distance <= campus.radius;
    });
  }

  async verifyLocation(studentId, latitude, longitude) {
    try {
      const isWithinCampus = this.isWithinCampus(latitude, longitude);
      
      if (!isWithinCampus) {
        throw new Error('Attendance can only be marked within campus boundaries');
      }

      // Log location verification
      console.log(`Location verified for student ${studentId} at (${latitude}, ${longitude})`);
      
      return {
        verified: true,
        campus: this.getNearestCampus(latitude, longitude),
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Location verification failed:', error);
      throw error;
    }
  }

  getNearestCampus(latitude, longitude) {
    let nearestCampus = null;
    let minDistance = Infinity;

    Object.entries(this.campusBoundaries).forEach(([name, campus]) => {
      const distance = geolib.getDistance(
        { latitude, longitude },
        { latitude: campus.latitude, longitude: campus.longitude }
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestCampus = name;
      }
    });

    return nearestCampus;
  }

  // Add new campus location
  addCampusLocation(name, latitude, longitude, radius) {
    this.campusBoundaries[name] = {
      latitude,
      longitude,
      radius
    };
  }

  // Get all campus boundaries
  getCampusBoundaries() {
    return this.campusBoundaries;
  }
}

module.exports = GeofenceService; 