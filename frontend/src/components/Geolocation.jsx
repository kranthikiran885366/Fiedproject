import React, { useState } from "react";

function Geolocation() {
  const [location, setLocation] = useState(null);
  const [timestamp, setTimestamp] = useState(null);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const currentTime = new Date().toLocaleString();

        setLocation({ latitude, longitude });
        setTimestamp(currentTime);
      },
      (error) => {
        alert("Error getting location: " + error.message);
      }
    );
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>GPS Location Tracking</h2>
      <button onClick={getCurrentLocation}>Check Current Location</button>

      {location && (
        <div>
          <h3>Location Details:</h3>
          <p><strong>Latitude:</strong> {location.latitude}</p>
          <p><strong>Longitude:</strong> {location.longitude}</p>
          <p><strong>Date & Time:</strong> {timestamp}</p>

          {/* Google Maps Link */}
          <h3>View on Google Maps:</h3>
          <a
            href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "blue", textDecoration: "underline" }}
          >
            Open in Google Maps
          </a>
        </div>
      )}
    </div>
  );
}

export default Geolocation;
