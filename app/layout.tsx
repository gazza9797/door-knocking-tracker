// app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "Door Knocking Tracker",
  description: "Your all-in-one door knocking tracking solution",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
