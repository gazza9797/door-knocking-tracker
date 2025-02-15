"use client";

import React, { useState, useEffect } from "react";
import { GoogleMap, LoadScript, OverlayView } from "@react-google-maps/api";
import { collection, doc, setDoc, getDocs, addDoc, deleteDoc } from "firebase/firestore";
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

  const handleMapClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const timestamp = new Date().toLocaleString();

    if (window.google && window.google.maps) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        let address = status === "OK" && results[0] ? results[0].formatted_address : `(${lat.toFixed(4)}, ${lng.toFixed(4)})`;

        const existingHome = homes.find(home => home.address === address);
        if (existingHome) {
          handleEmojiClick(existingHome);
        } else {
          setSelectedHome({
            id: null,
            lat,
            lng,
            address,
            status: "",
            homeownerName: "",
            phoneNumber: "",
            email: "",
            notes: [],
            timestamp,
          });
        }
      });
    }
  };

  const handleEmojiClick = (home) => {
    setSelectedHome({
      ...home,
      notes: Array.isArray(home.notes) ? home.notes : [],
      status: home.status || "",
      homeownerName: home.homeownerName || "",
      phoneNumber: home.phoneNumber || "",
      email: home.email || "",
    });
  };

  const handleSaveAndClose = async () => {
    await handleSaveHomeInfo();
    setSelectedHome(null); // Close the popup after saving
  };

  const handleSaveHomeInfo = async () => {
    if (!selectedHome) return;

    try {
      let updatedHome = { ...selectedHome };

      if (selectedHome.id) {
        const homeRef = doc(db, "homes", selectedHome.id);
        await setDoc(homeRef, updatedHome, { merge: true });
      } else {
        const docRef = await addDoc(collection(db, "homes"), updatedHome);
        updatedHome.id = docRef.id;
      }

      setHomes((prevHomes) =>
        prevHomes.some(home => home.id === updatedHome.id)
          ? prevHomes.map(home => (home.id === updatedHome.id ? updatedHome : home))
          : [...prevHomes, updatedHome]
      );

      setSelectedHome(updatedHome);
    } catch (error) {
      console.error("Error saving homeowner info:", error);
    }
  };

  const handleDeleteHomeEntry = async () => {
    if (!selectedHome?.id) return;

    try {
      await deleteDoc(doc(db, "homes", selectedHome.id));
      setHomes(homes.filter(home => home.id !== selectedHome.id));
      setSelectedHome(null);
    } catch (error) {
      console.error("Error deleting home entry:", error);
    }
  };

  const handleAddNote = async () => {
    if (!selectedHome || !newNote.trim()) return;

    try {
      const timestamp = new Date().toLocaleString();
      const updatedNotes = [...(selectedHome.notes || []), { text: newNote, timestamp }];

      let updatedHome = { ...selectedHome, notes: updatedNotes };

      if (selectedHome.id) {
        const homeRef = doc(db, "homes", selectedHome.id);
        await setDoc(homeRef, updatedHome, { merge: true });
      }

      setHomes((prevHomes) =>
        prevHomes.map((home) =>
          home.id === updatedHome.id ? updatedHome : home
        )
      );

      setSelectedHome(updatedHome);
      setNewNote("");
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
        <GoogleMap 
          mapContainerStyle={mapContainerStyle} 
          zoom={12} 
          center={center}
          onClick={handleMapClick}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEmojiClick(home);
                  }}
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

          <label>Status:</label>
          <select value={selectedHome.status} onChange={(e) => setSelectedHome({ ...selectedHome, status: e.target.value })} style={{ width: "100%", color: "black", marginBottom: "10px" }}>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <button onClick={handleSaveAndClose} style={{ backgroundColor: "green", color: "white", width: "100%", padding: "10px" }}>💾 Save & Close</button>

          <button onClick={handleDeleteHomeEntry} style={{ backgroundColor: "red", color: "white", width: "100%", padding: "10px", marginTop: "5px" }}>🗑 Delete Entry</button>
        </div>
      )}
    </div>
  );
};

export default TrackerPage;
