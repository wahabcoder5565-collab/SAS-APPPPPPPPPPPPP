import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "PermitImpact AI | Permit-to-Operations AI for Industrial Facilities",
  description:
    "PermitImpact AI helps industrial teams connect permit obligations to real operations. Every Permit Change. Every Equipment Change. Reviewed in Facility Context.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
      <body className="min-h-screen flex flex-col bg-background text-foreground selection:bg-cyan-500/25 selection:text-foreground">
        {children}
      </body>
    </html>
  );
}
