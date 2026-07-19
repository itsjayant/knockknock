import type { Metadata, Viewport } from "next";
import PWAInitializer from "@/components/PWAInitializer";
import RingtoneListener from "@/components/RingtoneListener";
import "./globals.css";

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
      className="h-full antialiased"
    >
      <head>
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="KnockKnock" />
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'><rect fill='%230f172a' rx='40' width='192' height='192'/><path d='M 96 40 Q 120 50 120 80 L 120 100 Q 96 115 72 100 L 72 80 Q 72 50 96 40 Z M 96 115 L 96 135' stroke='%23ffffff' stroke-width='8' fill='none' stroke-linecap='round'/></svg>" />
        {/* iOS app icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/ios/180.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/ios/167.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/ios/152.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/ios/144.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/ios/120.png" />
        <link rel="apple-touch-icon" href="/icons/ios/180.png" />
        {/* Fallback SVG */}
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
