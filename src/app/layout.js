
import { Geist, Geist_Mono } from "next/font/google";
import { Homemade_Apple } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '../context/AuthContext';
import { LockProvider } from '../context/LockContext';
import { ThemeProvider } from '../context/ThemeContext';
import AuthModal from '../components/AuthModal';
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

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

export const metadata = {
  title: "Secuwrite - Think. Write. Protect",
  description:
    "Secuwrite is a privacy-first journaling app with end-to-end encryption, password lock. Keep your thoughts safe and private.",
  keywords:
    "private writing, private journal, secure diary, encrypted journal, encrypted diary, secure notes, online journal, notes app",
  manifest: "/manifest.json", // android icons + more
  themeColor: "#059669",
  icons: {
    icon: "/favicon.png", // favicon for browsers
    apple: "/assets/icons/sw-icon-180x180.png", //  iOS icon
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Secuwrite - Think. Write. Protect",
  },
};

{/*
  
Titles
1. Safe, Private, Yours.
2. Think. Write. Protect.
3. Your thoughts stay yours.
4. Write Freely, Stay Private
5. Private Writing Made Simple
6. A Secure Space for Your Thoughts
7. Secure Writing App with End-to-End Encryption
8. Privacy-First Writing Platform
9. Safe and Secure Writing Online

Taglines for Page
1. A Private and Encrypted Space for Your Writing
2. Think Freely. Write Securely.
3. Your Thoughts. Your Words. Protected.

*/}


export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${homemadeApple.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
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