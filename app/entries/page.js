"use client";

import React, { useState, useEffect, useMemo } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import styles from "./EntriesPage.module.css";

export default function EntriesPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("address"); // Default sort

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

  // Filter entries based on the search term
  const filteredEntries = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return entries.filter((entry) => {
      return (
        (entry.address && entry.address.toLowerCase().includes(term)) ||
        (entry.homeownerName && entry.homeownerName.toLowerCase().includes(term))
      );
    });
  }, [entries, searchTerm]);

  // Sort the filtered entries based on the sort option
  const sortedEntries = useMemo(() => {
    const entriesCopy = [...filteredEntries];
    return entriesCopy.sort((a, b) => {
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
              <li key={entry.id} className={styles.entryCard}>
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
                <div className={styles.entryNotes}>
                  <strong>Notes:</strong>
                  {entry.notes && entry.notes.length > 0 ? (
                    <ul>
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
    </div>
  );
}
