import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GGA Governance | Local Service Delivery",
  description: "Inclusive Governance and Service Delivery Platform",
  icons: {
    icon: "/GGA-logo-Full-Colour-Pantone.png",
    shortcut: "/GGA-logo-Full-Colour-Pantone.png",
    apple: "/GGA-logo-Full-Colour-Pantone.png",
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
