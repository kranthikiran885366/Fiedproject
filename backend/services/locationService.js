const geolib = require('geolib');
const Attendance = require('../models/Attendance');
const Class = require('../models/Class');

class LocationService {
    constructor() {
        this.geofenceRadius = 100; // meters
    }

    // Verify if location is within class geofence
    async verifyLocation(classId, userLocation) {
        try {
            const classInfo = await Class.findById(classId);
            if (!classInfo || !classInfo.location) {
                throw new Error('Class location not set');
            }

            const distance = geolib.getDistance(
                { latitude: userLocation.latitude, longitude: userLocation.longitude },
                { latitude: classInfo.location.latitude, longitude: classInfo.location.longitude }
            );

            return {
                isWithinGeofence: distance <= this.geofenceRadius,
                distance: distance,
                accuracy: userLocation.accuracy || 0
            };
        } catch (error) {
            console.error('Location verification failed:', error);
            throw error;
        }
    }

    // Track user location during class
    async trackLocation(classId, userId, location) {
        try {
            const verification = await this.verifyLocation(classId, location);
            
            // Store location data
            await Attendance.findOneAndUpdate(
                { classId, userId, date: new Date().toISOString().split('T')[0] },
                {
                    $push: {
                        locationHistory: {
                            coordinates: {
                                latitude: location.latitude,
                                longitude: location.longitude
                            },
                            timestamp: new Date(),
                            accuracy: location.accuracy,
                            isWithinGeofence: verification.isWithinGeofence
                        }
                    }
                },
                { upsert: true, new: true }
            );

            return verification;
        } catch (error) {
            console.error('Location tracking failed:', error);
            throw error;
        }
    }

    // Get location history for a class
    async getLocationHistory(classId, date) {
        try {
            const attendance = await Attendance.find({
                classId,
                date,
                'locationHistory.0': { $exists: true }
            }).select('userId locationHistory');

            return attendance.map(record => ({
                userId: record.userId,
                locations: record.locationHistory.map(loc => ({
                    coordinates: loc.coordinates,
                    timestamp: loc.timestamp,
                    accuracy: loc.accuracy,
                    isWithinGeofence: loc.isWithinGeofence
                }))
            }));
        } catch (error) {
            console.error('Failed to get location history:', error);
            throw error;
        }
    }

    // Analyze location patterns
    async analyzeLocationPatterns(classId, startDate, endDate) {
        try {
            const attendance = await Attendance.find({
                classId,
                date: { $gte: startDate, $lte: endDate },
                'locationHistory.0': { $exists: true }
            });

            const patterns = {
                averageDistance: 0,
                accuracyStats: {
                    high: 0,
                    medium: 0,
                    low: 0
                },
                timeInGeofence: {},
                anomalies: []
            };

            let totalDistance = 0;
            let count = 0;

            attendance.forEach(record => {
                record.locationHistory.forEach(loc => {
                    const distance = geolib.getDistance(
                        { latitude: loc.coordinates.latitude, longitude: loc.coordinates.longitude },
                        { latitude: record.classLocation.latitude, longitude: record.classLocation.longitude }
                    );

                    totalDistance += distance;
                    count++;

                    // Track accuracy
                    if (loc.accuracy <= 10) patterns.accuracyStats.high++;
                    else if (loc.accuracy <= 30) patterns.accuracyStats.medium++;
                    else patterns.accuracyStats.low++;

                    // Track time in geofence
                    const hour = new Date(loc.timestamp).getHours();
                    patterns.timeInGeofence[hour] = (patterns.timeInGeofence[hour] || 0) + (loc.isWithinGeofence ? 1 : 0);

                    // Detect anomalies
                    if (distance > this.geofenceRadius * 2) {
                        patterns.anomalies.push({
                            userId: record.userId,
                            timestamp: loc.timestamp,
                            distance: distance,
                            coordinates: loc.coordinates
                        });
                    }
                });
            });

            patterns.averageDistance = count > 0 ? totalDistance / count : 0;

            return patterns;
        } catch (error) {
            console.error('Location pattern analysis failed:', error);
            throw error;
        }
    }

    // Generate location-based insights
    async generateLocationInsights(classId) {
        try {
            const patterns = await this.analyzeLocationPatterns(
                classId,
                new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                new Date()
            );

            const insights = {
                attendanceAccuracy: (patterns.accuracyStats.high / (patterns.accuracyStats.high + patterns.accuracyStats.medium + patterns.accuracyStats.low)) * 100,
                averageProximity: patterns.averageDistance,
                peakAttendanceHours: Object.entries(patterns.timeInGeofence)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([hour, count]) => ({ hour: parseInt(hour), count })),
                locationAnomalies: patterns.anomalies.length,
                recommendations: this.generateLocationRecommendations(patterns)
            };

            return insights;
        } catch (error) {
            console.error('Failed to generate location insights:', error);
            throw error;
        }
    }

    // Generate recommendations based on location data
    generateLocationRecommendations(patterns) {
        const recommendations = [];

        if (patterns.averageDistance > this.geofenceRadius) {
            recommendations.push({
                type: 'geofence_adjustment',
                priority: 'medium',
                action: 'Consider adjusting the geofence radius',
                details: `Current average distance: ${patterns.averageDistance.toFixed(2)}m`
            });
        }

        if (patterns.accuracyStats.low > patterns.accuracyStats.high) {
            recommendations.push({
                type: 'location_accuracy',
                priority: 'high',
                action: 'Improve location accuracy requirements',
                details: 'High number of low-accuracy readings detected'
            });
        }

        if (patterns.anomalies.length > 0) {
            recommendations.push({
                type: 'anomaly_investigation',
                priority: 'high',
                action: 'Investigate location anomalies',
                details: `${patterns.anomalies.length} anomalies detected`
            });
        }

        return recommendations;
    }
}

module.exports = new LocationService(); 