"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";

export default function EntriesPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "homes"));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEntries(data);
      } catch (error) {
        console.error("Error fetching entries:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Home Entries</h1>
      {loading ? (
        <p>Loading entries...</p>
      ) : entries.length === 0 ? (
        <p>No entries found.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {entries.map((entry) => (
            <li key={entry.id} style={{ marginBottom: "1rem", border: "1px solid #ddd", padding: "1rem", borderRadius: "5px" }}>
              <h2>{entry.address}</h2>
              <p><strong>Status:</strong> {entry.status || "N/A"}</p>
              <p><strong>Homeowner:</strong> {entry.homeownerName || "N/A"}</p>
              <p><strong>Phone:</strong> {entry.phoneNumber || "N/A"}</p>
              <p><strong>Email:</strong> {entry.email || "N/A"}</p>
              <div>
                <strong>Notes:</strong>
                {entry.notes && entry.notes.length > 0 ? (
                  <ul style={{ margin: "0.5rem 0", paddingLeft: "1rem" }}>
                    {entry.notes.map((note, index) => (
                      <li key={index}>
                        <small>{note.timestamp}:</small> {note.text}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No notes available.</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
