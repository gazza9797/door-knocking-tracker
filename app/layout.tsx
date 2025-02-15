"use client";

import "./globals.css";
import ProtectedRoute from "../components/ProtectedRoute";

export const metadata = {
  title: "Door Knocking Tracker",
  description: "Your all-in-one door knocking tracking solution",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ProtectedRoute>{children}</ProtectedRoute>
      </body>
    </html>
  );
}
