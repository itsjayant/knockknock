import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import PWAInitializer from "@/components/PWAInitializer";
import RingtoneListener from "@/components/RingtoneListener";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KnockKnock",
  description: "Smart doorbell — know who's at your door",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KnockKnock",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#0f172a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="KnockKnock" />
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'><rect fill='%230f172a' rx='40' width='192' height='192'/><path d='M 96 40 Q 120 50 120 80 L 120 100 Q 96 115 72 100 L 72 80 Q 72 50 96 40 Z M 96 115 L 96 135' stroke='%23ffffff' stroke-width='8' fill='none' stroke-linecap='round'/></svg>" />
        <link rel="apple-touch-icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'><rect fill='%230f172a' rx='40' width='192' height='192'/><path d='M 96 40 Q 120 50 120 80 L 120 100 Q 96 115 72 100 L 72 80 Q 72 50 96 40 Z M 96 115 L 96 135' stroke='%23ffffff' stroke-width='8' fill='none' stroke-linecap='round'/></svg>" />
      </head>
      <body className="min-h-full flex flex-col bg-white" suppressHydrationWarning>
        <PWAInitializer />
        <RingtoneListener />
        {children}
      </body>
    </html>
  );
}
