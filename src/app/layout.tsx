/**
 * Root Layout Component
 *
 * This is the root layout for our Next.js app. It wraps around ALL pages
 * in our application, providing common HTML structure and styling.
 *
 * In Next.js App Router, layout.tsx files create nested layouts.
 * This root layout applies to every page in the app.
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css"; // Import global Tailwind CSS styles
import AuthWrapper from "../components/AuthWrapper";

// Load the Geist font family from Google Fonts
// Geist is Vercel's custom font designed for optimal readability
const geistSans = Geist({
  variable: "--font-geist-sans", // CSS custom property name
  subsets: ["latin"],           // Only load Latin characters to reduce bundle size
});

// Load the Geist Mono font for code/monospace text
const geistMono = Geist_Mono({
  variable: "--font-geist-mono", // CSS custom property name
  subsets: ["latin"],
});

// Metadata for SEO and browser tabs
// This appears in the browser tab title and search engine results
export const metadata: Metadata = {
  title: "Kimi Chat on Netlify",                    // Updated title
  description: "Chat with Kimi AI using Next.js",  // Updated description
};

/**
 * Root Layout Component
 *
 * This component wraps every page in the app, providing:
 * - HTML document structure
 * - Font loading and CSS variables
 * - Global styling classes
 */
export default function RootLayout({
  children, // This will be replaced with the actual page content
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/*
          The AuthWrapper provides authentication protection for the entire app.
          The {children} gets replaced with the actual page content only after authentication.
          For our app, this will be the Chat component from page.tsx
        */}
        <AuthWrapper>
          {children}
        </AuthWrapper>
      </body>
    </html>
  );
}
