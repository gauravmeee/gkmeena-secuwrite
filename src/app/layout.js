import { Geist, Geist_Mono } from "next/font/google";
import { Homemade_Apple } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '../context/AuthContext';
import AuthModal from './components/AuthModal';

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

export const metadata = {
  title: "My Journal - Personal Diary & Journal App",
  description: "A modern diary and journal application for your daily thoughts",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${homemadeApple.variable} antialiased`}
      >
        <AuthProvider>
          <div className="bg-gray-950 text-gray-100 min-h-screen flex flex-col">
            {children}
          </div>
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}
