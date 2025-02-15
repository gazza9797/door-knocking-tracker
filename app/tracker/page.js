"use client";

import React, { useState, useEffect } from "react";
import { GoogleMap, LoadScript } from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  height: "80vh",
};

const defaultCenter = {
  lat: 43.6532, // Default to Toronto
  lng: -79.3832,
};

const TrackerPage = () => {
  const [center, setCenter] = useState(defaultCenter);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => console.warn("User denied location access. Using default location.")
      );
    }
  }, []);

  return (
    <div className="container">
      <h1>📍 Door Knocking Tracker</h1>
      <p>Track your door-knocking locations efficiently.</p>

      <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
        <GoogleMap mapContainerStyle={mapContainerStyle} zoom={12} center={center} />
      </LoadScript>

      <style jsx>{`
        .container {
          text-align: center;
          padding: 2rem;
        }
        h1 {
          font-size: 2rem;
          margin-bottom: 1rem;
        }
        p {
          font-size: 1.2rem;
          color: #333;
        }
      `}</style>
    </div>
  );
};

export default TrackerPage;
