import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wahab | Software Engineering — Full-Stack & AI Workflow Development",
  description:
    "Full-stack developer building practical applications that connect data, automate repetitive work and turn complex business processes into clear, reviewable software. Featuring PermitImpact AI, an independent engineering demonstration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-background text-foreground selection:bg-cyan-500/25 selection:text-foreground">
        {children}
      </body>
    </html>
  );
}
