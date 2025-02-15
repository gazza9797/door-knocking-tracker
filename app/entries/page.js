"use client";

import React, { useState, useEffect, useMemo } from "react";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import Link from "next/link";
import styles from "./EntriesPage.module.css";

// Status options array (as used on the tracker page)
const statusOptions = [
  { label: "✅ Answered", value: "Answered" },
  { label: "📞 Call Back", value: "Call Back" },
  { label: "❌ Not Interested", value: "Not Interested" },
  { label: "🏠 Not Home", value: "Not Home" },
  { label: "🚧 Inaccessible", value: "Inaccessible" },
];

function EntryCard({ entry, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedEntry, setEditedEntry] = useState(entry);
  const [newNote, setNewNote] = useState("");

  // Keep local state in sync if entry prop changes.
  useEffect(() => {
    setEditedEntry(entry);
  }, [entry]);

  const handleSave = async () => {
    await onUpdate(editedEntry);
    setIsEditing(false);
  };

  // Add a note with a timestamp to the entry.
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    const timestamp = new Date().toLocaleString();
    const updatedNotes = [...(entry.notes || []), { text: newNote, timestamp }];
    const updatedEntry = { ...entry, notes: updatedNotes };
    await onUpdate(updatedEntry);
    setNewNote("");
  };

  // Delete a note from the entry.
  const handleDeleteNote = async (noteIndex) => {
    const updatedNotes = entry.notes.filter((_, i) => i !== noteIndex);
    const updatedEntry = { ...entry, notes: updatedNotes };
    await onUpdate(updatedEntry);
  };

  return (
    <li className={styles.entryCard}>
      {isEditing ? (
        <div>
          <label>
            Address:
            <input
              type="text"
              value={editedEntry.address}
              onChange={(e) =>
                setEditedEntry({ ...editedEntry, address: e.target.value })
              }
              style={{ width: "100%" }}
            />
          </label>
          <label>
            Status:
            <select
              value={editedEntry.status}
              onChange={(e) =>
                setEditedEntry({ ...editedEntry, status: e.target.value })
              }
              style={{ width: "100%" }}
            >
              <option value="">Select a status...</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Homeowner:
            <input
              type="text"
              value={editedEntry.homeownerName}
              onChange={(e) =>
                setEditedEntry({ ...editedEntry, homeownerName: e.target.value })
              }
              style={{ width: "100%" }}
            />
          </label>
          <label>
            Phone:
            <input
              type="text"
              value={editedEntry.phoneNumber}
              onChange={(e) =>
                setEditedEntry({ ...editedEntry, phoneNumber: e.target.value })
              }
              style={{ width: "100%" }}
            />
          </label>
          <label>
            Email:
            <input
              type="text"
              value={editedEntry.email}
              onChange={(e) =>
                setEditedEntry({ ...editedEntry, email: e.target.value })
              }
              style={{ width: "100%" }}
            />
          </label>
          <p>
            <strong>Created At:</strong>{" "}
            {editedEntry.createdAt
              ? new Date(editedEntry.createdAt).toLocaleString()
              : "Not set"}
          </p>
          <div style={{ marginTop: "0.5rem" }}>
            <button onClick={handleSave} className={styles.btn}>
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className={styles.btnSecondary}
              style={{ marginLeft: "0.5rem" }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <h2>{entry.address}</h2>
          <p>
            <strong>Status:</strong> {entry.status || "N/A"}
          </p>
          <p>
            <strong>Homeowner:</strong> {entry.homeownerName || "N/A"}
          </p>
          <p>
            <strong>Phone:</strong> {entry.phoneNumber || "N/A"}
          </p>
          <p>
            <strong>Email:</strong> {entry.email || "N/A"}
          </p>
          <p>
            <strong>Created At:</strong>{" "}
            {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "N/A"}
          </p>
          <div>
            <strong>Notes:</strong>
            {entry.notes && entry.notes.length > 0 ? (
              <ul>
                {entry.notes.map((note, index) => (
                  <li key={index}>
                    <small>{note.timestamp}:</small> {note.text}{" "}
                    <button
                      onClick={() => handleDeleteNote(index)}
                      className={styles.btnSecondary}
                      style={{ marginLeft: "0.5rem", fontSize: "0.8rem" }}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No notes available.</p>
            )}
          </div>
          <div style={{ marginTop: "0.5rem" }}>
            <input
              type="text"
              placeholder="Add a note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              style={{ width: "100%" }}
            />
            <button
              onClick={handleAddNote}
              className={styles.btn}
              style={{ marginTop: "0.5rem" }}
            >
              Add Note
            </button>
          </div>
          <div style={{ marginTop: "0.5rem" }}>
            <button
              onClick={() => setIsEditing(true)}
              className={styles.btn}
              style={{ marginRight: "0.5rem" }}
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(entry.id)}
              className={styles.btnSecondary}
              style={{ marginRight: "0.5rem" }}
            >
              Delete
            </button>
            <Link href={`/tracker?lat=${entry.lat}&lng=${entry.lng}&zoom=16`}>
              <a className={styles.btn}>Map It</a>
            </Link>
          </div>
        </div>
      )}
    </li>
  );
}

export default function EntriesPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("address");

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "homes"));
        const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setEntries(data);
      } catch (error) {
        console.error("Error fetching entries:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, []);

  const handleUpdateEntry = async (updatedEntry) => {
    try {
      const homeRef = doc(db, "homes", updatedEntry.id);
      await setDoc(homeRef, updatedEntry, { merge: true });
      setEntries((prev) =>
        prev.map((entry) => (entry.id === updatedEntry.id ? updatedEntry : entry))
      );
    } catch (error) {
      console.error("Error updating entry:", error);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    try {
      const entryRef = doc(db, "homes", entryId);
      await deleteDoc(entryRef);
      setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
    } catch (error) {
      console.error("Error deleting entry:", error);
    }
  };

  const filteredEntries = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return entries.filter((entry) => {
      return (
        (entry.address && entry.address.toLowerCase().includes(term)) ||
        (entry.homeownerName && entry.homeownerName.toLowerCase().includes(term))
      );
    });
  }, [entries, searchTerm]);

  const sortedEntries = useMemo(() => {
    const copy = [...filteredEntries];
    return copy.sort((a, b) => {
      if (sortOption === "address") {
        return a.address?.localeCompare(b.address) || 0;
      } else if (sortOption === "status") {
        return a.status?.localeCompare(b.status) || 0;
      } else if (sortOption === "homeownerName") {
        return a.homeownerName?.localeCompare(b.homeownerName) || 0;
      }
      return 0;
    });
  }, [filteredEntries, sortOption]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Home Entries</h1>
        <div className={styles.controls}>
          <input
            type="text"
            placeholder="Search by address or homeowner name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className={styles.sortSelect}
          >
            <option value="address">Sort by Address</option>
            <option value="status">Sort by Status</option>
            <option value="homeownerName">Sort by Homeowner Name</option>
          </select>
        </div>
        {loading ? (
          <p>Loading entries...</p>
        ) : sortedEntries.length === 0 ? (
          <p>No entries found.</p>
        ) : (
          <ul className={styles.entriesList}>
            {sortedEntries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onDelete={handleDeleteEntry}
                onUpdate={handleUpdateEntry}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
