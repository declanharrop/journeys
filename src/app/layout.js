// journeys/app/src/app/layout.js

import { Lexend } from 'next/font/google';
import Providers from './Providers';
import './globals.css';

// 1. Initialize the font
const lexend = Lexend({
  subsets: ['latin'],
  weight: ['300', '400', '600'], // Add weights you need
  variable: '--font-lexend',     // 2. Define the CSS variable
});

// src/app/layout.js

export const metadata = {
  title: "Journeys",
  description: "Find your flow with personalized yoga journeys.",
  manifest: "/manifest.json", // Link to your manifest
  themeColor: "#ffffff", // Match your brand color
  viewport: "minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport = {
  themeColor: "#ffffff",
};

// ... rest of your layout component

export default function RootLayout({ children }) {
  return (
    // 3. Apply the font variable to your <html> tag
    <html lang="en" className={lexend.variable}>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}