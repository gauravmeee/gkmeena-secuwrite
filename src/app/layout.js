
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

export function generateViewport() {
  return {
    themeColor: "#059669",
  };
}

export const metadata = {
  title: "Secuwrite - Think. Write. Protect",
  description:
    "Secuwrite is a privacy-first journaling app with end-to-end encryption, password lock. Keep your thoughts safe and private.",
  keywords:
    "private writing, private journal, secure diary, encrypted journal, encrypted diary, secure notes, online journal, notes app",
  manifest: "/manifest.json", // Android Icon / PWA manifest
  icons: {
    icon: "/favicon.png", // Favicon for browsers (desktop / tab icon)
    apple: "/assets/icons/sw-icon-180x180.png", //  Apple touch icon (iOS home screen / PWA install) 
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Secuwrite - Think. Write. Protect",
  },
  openGraph: {
    title: "Secuwrite - Think. Write. Protect",
    description:
      "Secuwrite is a privacy-first journaling app with end-to-end encryption, password lock. Keep your thoughts safe and private.",
    url: "https://secuwrite.vercel.app",
    siteName: "Secuwrite",
    images: [
      {
        url: "https://secuwrite.vercel.app/assets/icons/secuwrite-og.png",
        width: 1200,
        height: 630,
        alt: "Secuwrite Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Secuwrite - Think. Write. Protect",
    description:
      "Secuwrite is a privacy-first journaling app with end-to-end encryption, password lock. Keep your thoughts safe and private.",
    images: ["https://secuwrite.vercel.app/assets/icons/secuwrite-og.png"],
    site: "@YourTwitterHandle", // optional
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'light';
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(theme);
                } catch (e) {
                  // Fallback to light theme if localStorage is not available
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* Prevent theme flashing */
              html { color-scheme: light; }
              html.dark { color-scheme: dark; }
              body { background: var(--background); color: var(--foreground); }
            `,
          }}
        />
      </head>
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