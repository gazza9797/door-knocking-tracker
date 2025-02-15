"use client";  // Required for client-side rendering in Next.js

import React, { useState, useEffect } from "react";
import { GoogleMap, LoadScript, OverlayView } from "@react-google-maps/api";
import { collection, doc, setDoc, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

// Helper function to generate a sanitized document ID from the address.
const getDocIdFromAddress = (address) => {
  return address.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
};

const mapContainerStyle = {
  width: "100%",
  height: "80vh",
};

const defaultCenter = {
  lat: 43.6532, // Default to Toronto
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

const DoorKnockingTracker = () => {
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
      const homeData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setHomes(homeData);
    };

    fetchHomes();
  }, []);

  // When a marker is clicked, load the existing entry.
  const handleEmojiClick = (home) => {
    setSelectedHome({
      ...home,
      address: home.address || `New Entry: (${home.lat.toFixed(4)}, ${home.lng.toFixed(4)})`,
      status: home.status || "",
      homeownerName: home.homeownerName || "",
      phoneNumber: home.phoneNumber || "",
      email: home.email || "",
      notes: Array.isArray(home.notes) ? home.notes : [],
    });
  };

  // When clicking on the map background, create a new entry form if one doesn't already exist for that address.
  const handleMapClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    if (window.google && window.google.maps) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        let address = "";
        if (status === "OK" && results[0]) {
          address = results[0].formatted_address;
        } else {
          address = `(${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        }
        // Check if an entry with the same address already exists
        const existingHome = homes.find(home => home.address === address);
        if (existingHome) {
          setSelectedHome({
            ...existingHome,
            address: existingHome.address,
            status: existingHome.status || "",
            homeownerName: existingHome.homeownerName || "",
            phoneNumber: existingHome.phoneNumber || "",
            email: existingHome.email || "",
            notes: Array.isArray(existingHome.notes) ? existingHome.notes : [],
          });
        } else {
          setSelectedHome({
            id: null, // new entry
            lat,
            lng,
            address,
            status: "",
            homeownerName: "",
            phoneNumber: "",
            email: "",
            notes: [],
          });
        }
      });
    } else {
      // Fallback if geocoder isn't available
      const address = `(${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      const existingHome = homes.find(home => home.address === address);
      if (existingHome) {
        setSelectedHome({
          ...existingHome,
          address: existingHome.address,
          status: existingHome.status || "",
          homeownerName: existingHome.homeownerName || "",
          phoneNumber: existingHome.phoneNumber || "",
          email: existingHome.email || "",
          notes: Array.isArray(existingHome.notes) ? existingHome.notes : [],
        });
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
        });
      }
    }
  };

  // Save Homeowner Info & Status.
  // If it's a new entry (selectedHome.id is null), use the sanitized address as the document ID.
  const handleSaveHomeInfo = async () => {
    if (!selectedHome) return;
    try {
      let updatedHome = { ...selectedHome };
      if (selectedHome.id) {
        // Update existing document
        const homeRef = doc(db, "homes", selectedHome.id);
        await setDoc(homeRef, selectedHome, { merge: true });
      } else {
        // Use the address as the document ID.
        const docId = getDocIdFromAddress(selectedHome.address);
        await setDoc(doc(db, "homes", docId), selectedHome, { merge: true });
        updatedHome.id = docId;
      }
      // Update local state
      setHomes((prevHomes) => {
        const exists = prevHomes.some(home => home.id === updatedHome.id);
        return exists
          ? prevHomes.map(home => (home.id === updatedHome.id ? updatedHome : home))
          : [...prevHomes, updatedHome];
      });
      setSelectedHome(updatedHome);
    } catch (error) {
      console.error("Error saving homeowner info:", error);
    }
  };

  // Save & close: Save changes then close the popup.
  const handleSaveAndClose = async () => {
    await handleSaveHomeInfo();
    setSelectedHome(null);
  };

  // Save Notes
  const handleSaveNotes = async () => {
    if (!selectedHome || !newNote.trim()) return;
    try {
      const timestamp = new Date().toLocaleString();
      const updatedNotes = [...(selectedHome.notes || [])];
      updatedNotes.unshift({ text: newNote, timestamp });
      if (selectedHome.id) {
        const homeRef = doc(db, "homes", selectedHome.id);
        await setDoc(homeRef, { ...selectedHome, notes: updatedNotes }, { merge: true });
      }
      setHomes((prevHomes) =>
        prevHomes.map((home) =>
          home.id === selectedHome.id ? { ...home, notes: updatedNotes } : home
        )
      );
      setSelectedHome((prev) => ({ ...prev, notes: updatedNotes }));
      setNewNote("");
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  // Delete an individual note
  const handleDeleteNote = async (noteIndex) => {
    if (!selectedHome) return;
    try {
      const updatedNotes = selectedHome.notes.filter((_, i) => i !== noteIndex);
      if (selectedHome.id) {
        const homeRef = doc(db, "homes", selectedHome.id);
        await setDoc(homeRef, { ...selectedHome, notes: updatedNotes }, { merge: true });
      }
      setHomes((prevHomes) =>
        prevHomes.map((home) =>
          home.id === selectedHome.id ? { ...home, notes: updatedNotes } : home
        )
      );
      setSelectedHome((prev) => ({ ...prev, notes: updatedNotes }));
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  // Delete the entire home entry
  const handleDeleteHome = async () => {
    if (!selectedHome || !selectedHome.id) return;
    try {
      const homeRef = doc(db, "homes", selectedHome.id);
      await deleteDoc(homeRef);
      setHomes((prevHomes) =>
        prevHomes.filter((home) => home.id !== selectedHome.id)
      );
      setSelectedHome(null);
    } catch (error) {
      console.error("Error deleting home entry:", error);
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
                    e?.domEvent?.stopPropagation?.();
                    e?.stopPropagation?.();
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={() => setSelectedHome(null)}>✖</button>
            <div style={{ display: "flex", gap: "5px" }}>
              <button 
                onClick={handleSaveAndClose} 
                style={{
                  background: "green", 
                  color: "#fff", 
                  border: "none", 
                  padding: "5px 10px", 
                  borderRadius: "5px"
                }}
              >
                💾 Save & Close
              </button>
              {selectedHome.id && (
                <button 
                  onClick={handleDeleteHome} 
                  style={{
                    background: "red", 
                    color: "#fff", 
                    border: "none", 
                    padding: "3px 7px", 
                    borderRadius: "5px",
                    fontSize: "0.8rem"
                  }}
                >
                  Delete Entry
                </button>
              )}
            </div>
          </div>

          <label>Address:</label>
          <input 
            value={selectedHome.address || ""} 
            onChange={(e) => setSelectedHome({ ...selectedHome, address: e.target.value })}
            style={{ color: "black", width: "100%", marginBottom: "10px" }}
          />

          <label>Status:</label>
          <select 
            value={selectedHome.status}
            onChange={(e) => setSelectedHome({ ...selectedHome, status: e.target.value })}
            style={{ width: "100%", color: "black" }}
          >
            {selectedHome.status && (
              <option value={selectedHome.status} disabled>
                {statusOptions.find(option => option.value === selectedHome.status)?.emoji || ""} {selectedHome.status} (Current)
              </option>
            )}
            <option value="">Select a status...</option>
            {statusOptions
              .filter(option => option.value !== selectedHome.status)
              .map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
            ))}
          </select>

          <label>Homeowner Name:</label>
          <input 
            value={selectedHome.homeownerName}
            onChange={(e) => setSelectedHome({ ...selectedHome, homeownerName: e.target.value })}
            style={{ color: "black", width: "100%" }}
          />

          <label>Phone Number:</label>
          <input 
            value={selectedHome.phoneNumber}
            onChange={(e) => setSelectedHome({ ...selectedHome, phoneNumber: e.target.value })}
            style={{ color: "black", width: "100%" }}
          />

          <label>Email Address:</label>
          <input 
            value={selectedHome.email}
            onChange={(e) => setSelectedHome({ ...selectedHome, email: e.target.value })}
            style={{ color: "black", width: "100%" }}
          />

          <button onClick={handleSaveHomeInfo} style={{ width: "100%", marginBottom: "10px" }}>
            💾 Save Info
          </button>

          <hr style={{ background: "#fff", border: "none", height: "1px" }} />

          <h3>Notes</h3>
          <div style={{ maxHeight: "150px", overflowY: "auto", marginBottom: "10px" }}>
            {selectedHome.notes && selectedHome.notes.length > 0 ? (
              selectedHome.notes.map((note, i) => (
                <div key={i} style={{ marginBottom: "5px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <small>{note.timestamp}:</small> {note.text}
                  </div>
                  <button 
                    onClick={() => handleDeleteNote(i)}
                    style={{ background: "red", color: "#fff", border: "none", borderRadius: "3px", padding: "2px 5px" }}
                  >
                    Delete
                  </button>
                </div>
              ))
            ) : (
              <p>No notes yet.</p>
            )}
          </div>
          <textarea 
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a new note..."
            style={{ width: "100%", color: "black", marginBottom: "5px" }}
          />
          <button onClick={handleSaveNotes} style={{ width: "100%" }}>
            💾 Save Note
          </button>
        </div>
      )}
    </div>
  );
};

export default DoorKnockingTracker;
