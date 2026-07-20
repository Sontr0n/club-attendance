import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Club Attendance",
  description: "Attendance tracking for the club",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
