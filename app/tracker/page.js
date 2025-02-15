"use client";

import React, { useState, useEffect } from "react";
import { GoogleMap, LoadScript, OverlayView } from "@react-google-maps/api";
import { collection, doc, setDoc, getDocs, addDoc } from "firebase/firestore"; // 🔥 Removed deleteDoc
import { db } from "@/firebaseConfig";

const mapContainerStyle = {
  width: "100%",
  height: "80vh",
};

const defaultCenter = {
  lat: 43.6532,
  lng: -79.3832,
};

// Define statuses and corresponding emojis
const statusOptions = [
  { label: "✅ Answered", value: "Answered", emoji: "✅" },
  { label: "📞 Call Back", value: "Call Back", emoji: "📞" },
  { label: "❌ Not Interested", value: "Not Interested", emoji: "❌" },
  { label: "🏠 Not Home", value: "Not Home", emoji: "🏠" },
  { label: "🚧 Inaccessible", value: "Inaccessible", emoji: "🚧" }
];

const TrackerPage = () => {
  const [selectedHome, setSelectedHome] = useState(null);
  const [homes, setHomes] = useState([]);
  const [center, setCenter] = useState(defaultCenter);
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        () => console.warn("User denied location access. Using default location.")
      );
    }

    const fetchHomes = async () => {
      const querySnapshot = await getDocs(collection(db, "homes"));
      const homeData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHomes(homeData);
    };

    fetchHomes();
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
        <GoogleMap 
          mapContainerStyle={mapContainerStyle} 
          zoom={12} 
          center={center}
        >
          {homes.map((home, index) => {
            if (!home.lat || !home.lng) return null;
            const statusObj = statusOptions.find(option => option.value === home.status);
            const emoji = statusObj ? statusObj.emoji : "❓";
            return (
              <OverlayView
                key={`${home.id}-${index}`}
                position={{ lat: home.lat, lng: home.lng }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <div
                  style={{
                    fontSize: "24px",
                    cursor: "pointer",
                    userSelect: "none",
                    position: "absolute",
                    transform: "translate(-50%, -50%)",
                  }}
                  onClick={() => setSelectedHome(home)}
                >
                  {emoji}
                </div>
              </OverlayView>
            );
          })}
        </GoogleMap>
      </LoadScript>

      {selectedHome && (
        <div style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translate(-50%, 0)",
          backgroundColor: "#222",
          color: "#fff",
          padding: "20px",
          borderRadius: "10px",
          width: "90%",
          maxWidth: "400px",
          boxShadow: "0px 6px 15px rgba(0,0,0,0.6)",
          zIndex: 1000,
          textAlign: "left",
        }}>
          <button onClick={() => setSelectedHome(null)}>✖</button>

          <h2>🏡 {selectedHome.address}</h2>
          <p><strong>Logged On:</strong> {selectedHome.timestamp}</p>
        </div>
      )}
    </div>
  );
};

export default TrackerPage;
