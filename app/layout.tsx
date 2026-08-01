import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lumnicore - Daily Discipline & Accountability Tracker",
  description: "Track your daily routine, measure your consistency, and build a stronger record of following through in the Asia/Kolkata timezone.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
