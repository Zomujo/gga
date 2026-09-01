import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Civic | Community Service Delivery Portal",
  description:
    "Community reporting and case management for participating district assemblies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
