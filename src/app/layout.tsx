import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

import { ToastProvider } from "@/components/toast-provider";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { OfflineIndicator } from "@/components/offline-indicator";
import { RealtimeProvider } from "@/components/realtime-provider";
import { PublicPageWrapper } from "@/components/public-page-wrapper";
import { JsonLd } from "@/components/json-ld";

export const metadata: Metadata = {
  title: {
    default: "Maerika 2K26 - കലായുഗ ഭാവുകം",
    template: "%s | Maerika 2K26",
  },
  description:
    "പുതിയൊരു കാലത്തിന്റേയും മാറ്റത്തിന്റേയും തുടക്കത്തിൽ നൽകുന്ന നല്ല പ്രതീക്ഷകൾ. കലയുടെയും സംസ്കാരത്തിന്റെയും രംഗത്ത് പുതിയൊരു വസന്തമോ അല്ലെങ്കിൽ ക്രിയാത്മകമായ മാറ്റമോ ഉണ്ടാകണമെന്ന ആശ.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://funoonfiesta.noorululama.org"),
  keywords: ["Maerika 2k26", "Islamic Art", "Culture", "Student Festival", "Live Scoreboard", "Arts Competition"],
  authors: [{ name: "JDSA Media" }],
  creator: "JDSA Media",
  publisher: "JDSA Media",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Maerika 2K26",
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png?v=2", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png?v=2", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png?v=2", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Maerika 2K26 - കലായുഗ ഭാവുകം",
    description: "പുതിയൊരു കാലത്തിന്റേയും മാറ്റത്തിന്റേയും തുടക്കത്തിൽ നൽകുന്ന നല്ല പ്രതീക്ഷകൾ. കലയുടെയും സംസ്കാരത്തിന്റെയും രംഗത്ത് പുതിയൊരു വസന്തമോ അല്ലെങ്കിൽ ക്രിയാത്മകമായ മാറ്റമോ ഉണ്ടാകണമെന്ന ആശ.",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://funoonfiesta.noorululama.org",
    siteName: "Maerika 2K26",
    images: [
      {
        url: "/img/hero/Fest-logo.webp?v=2",
        width: 800,
        height: 600,
        alt: "Maerika 2k26 Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Maerika 2k26",
    description: "പുതിയൊരു കാലത്തിന്റേയും മാറ്റത്തിന്റേയും തുടക്കത്തിൽ നൽകുന്ന നല്ല പ്രതീക്ഷകൾ. കലയുടെയും സംസ്കാരത്തിന്റെയും രംഗത്ത് പുതിയൊരു വസന്തമോ അല്ലെങ്കിൽ ക്രിയാത്മകമായ മാറ്റമോ ഉണ്ടാകണമെന്ന ആശ.",
    images: ["/img/hero/Fest-logo.webp?v=2"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "KVXemRNq5bBTJadrMPQXLbSxFtPnazEmvfX6uguvd5U",
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

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
        <meta name="apple-mobile-web-app-title" content="Funoon Fiesta" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#3b0764" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >

        <RealtimeProvider>
          <OfflineIndicator />
          <ToastProvider>
            <PublicPageWrapper>
              {children}
            </PublicPageWrapper>
          </ToastProvider>
          <PWAInstallPrompt />
        </RealtimeProvider>
        <JsonLd />
      </body>
    </html>
  );
}
