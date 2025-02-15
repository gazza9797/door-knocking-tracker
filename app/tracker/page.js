"use client";

import Link from "next/link";
import MyComponent from "@/components/MyComponent"; // ✅ Corrected Import Path

export default function TrackerPage() {
  return (
    <div className="container">
      <div className="hero">
        <h1>Door Knocking Tracker</h1>
        <p>Track your door knocking progress and manage your leads efficiently.</p>
        <div className="links">
          <Link href="/" className="btn">🏡 Home</Link>
          <Link href="/entries" className="btn secondary">📋 View Entries</Link>
        </div>
        {/* MyComponent inserted */}
        <MyComponent showCount={true} />
      </div>

      <style jsx>{`
        .container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #74abe2, #5563de);
          padding: 2rem;
          color: #fff;
        }
        .hero {
          text-align: center;
          max-width: 600px;
        }
        .hero h1 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          font-weight: bold;
        }
        .hero p {
          font-size: 1.5rem;
          margin-bottom: 2rem;
        }
        .links {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .btn {
          display: inline-block;
          padding: 0.75rem 1.5rem;
          background-color: #ff4081;
          color: #fff;
          border: none;
          border-radius: 5px;
          font-size: 1.25rem;
          cursor: pointer;
          text-decoration: none;
          transition: background-color 0.3s ease;
        }
        .btn:hover {
          background-color: #e73370;
        }
        .secondary {
          background-color: #0070f3;
        }
        .secondary:hover {
          background-color: #005bb5;
        }
      `}</style>
    </div>
  );
}
