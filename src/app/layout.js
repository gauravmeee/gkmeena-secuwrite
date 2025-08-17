
import { Geist, Geist_Mono } from "next/font/google";
import { Homemade_Apple } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '../context/AuthContext';
import { LockProvider } from '../context/LockContext';
import { ThemeProvider } from '../context/ThemeContext';
import AuthModal from './components/AuthModal';
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import { metadata } from './metadata';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  preload: false, // Only load when needed
});

const homemadeApple = Homemade_Apple({
  weight: '400',
  variable: "--font-homemade-apple", 
  subsets: ["latin"],
  display: 'swap',
  preload: false, // Only load when needed
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#059669" />
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Unseen Stories" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        {/* Preload critical resources */}
        <link rel="preload" href="/manifest.json" as="fetch" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${homemadeApple.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          <AuthProvider>
            <LockProvider>
              <Navbar />
              <main className="flex-grow bg-background text-foreground pt-16">
                {children}
              </main>
              <Footer />
              <AuthModal />
            </LockProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}