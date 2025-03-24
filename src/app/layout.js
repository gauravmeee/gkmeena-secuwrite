"use client";
import { Geist, Geist_Mono } from "next/font/google";
import { Homemade_Apple } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '../context/AuthContext';
import AuthModal from './components/AuthModal';
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const homemadeApple = Homemade_Apple({
  weight: '400',
  variable: "--font-homemade-apple", 
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${homemadeApple.variable} antialiased`}
      >
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow bg-gray-950 text-gray-100">
              {children}
            </main>
            <Footer />
          </div>
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}