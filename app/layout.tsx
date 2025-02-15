// app/layout.tsx
import "./globals.css";
import dynamic from "next/dynamic";

const ProtectedRoute = dynamic(() => import("../components/ProtectedRoute"), { ssr: false });

export const metadata = {
  title: "Door Knocking Tracker",
  description: "Your all-in-one door knocking tracking solution",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ProtectedRoute>{children}</ProtectedRoute>
      </body>
    </html>
  );
}
