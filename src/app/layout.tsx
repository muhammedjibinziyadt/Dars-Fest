import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ToastProvider } from "@/components/toast-provider";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { OfflineIndicator } from "@/components/offline-indicator";
import { RealtimeProvider } from "@/components/realtime-provider";
import { PublicPageWrapper } from "@/components/public-page-wrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const moga = localFont({
  src: "../../public/font/moga.otf",
  variable: "--font-moga",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Maerika 2k26 - കലായുഗ ഭാവുകം",
  description:
    "ലഹരിയുടെ കാർമേഘങ്ങൾ നാടിനെ മൂടുന്ന വർത്തമാനകാലത്ത്, സർഗാത്മകതയുടെ വെളിച്ചം കൊണ്ട് പ്രതിരോധം തീർക്കുകയാണ് ഞങ്ങളുടെ ദർസ് ഫെസ്റ്റ്.",
  metadataBase: new URL("https://dars-fest.vercel.app/"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Maerika 2k26",
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#3b0764",
};

import { Suspense } from "react";
import { NavigationProgress } from "@/components/navigation-progress";

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b0764" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Maerika 2k26" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#3b0764" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${moga.variable} antialiased`}
      >
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <SpeedInsights />
        <RealtimeProvider>
          <OfflineIndicator />
          <ToastProvider>
            <PublicPageWrapper>
              {children}
            </PublicPageWrapper>
          </ToastProvider>
          <PWAInstallPrompt />
        </RealtimeProvider>
      </body>
    </html>
  );
}
