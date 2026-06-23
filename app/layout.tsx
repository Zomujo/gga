import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sekyere Kumawu District Assembly | Service Delivery Portal",
  description: "Community reporting and case management for Sekyere Kumawu District Assembly.",
  icons: {
    icon: "/skda-logo.jpeg",
    shortcut: "/skda-logo.jpeg",
    apple: "/skda-logo.jpeg",
  },
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
