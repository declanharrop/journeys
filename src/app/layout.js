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

export const metadata = {
  title: 'Journeys',
  description: 'Find Your Flow Yoga',
};

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