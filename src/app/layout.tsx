import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JEE & NEET AI Testing Platform",
  description: "Enterprise examination platform with deterministic scoring and AI diagnostic analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
