import React from "react";
import type { Metadata } from "next";
import { Instrument_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "@/components/auth/auth-provider";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://optimus.ajstudioz.co.in"),
  title: "Optimus — AI-Powered Online Media Discovery & Intelligence",
  description:
    "Autonomous online media discovery, contextual validation killing false alerts, and Anthropic/Perplexity-styled executive intelligence briefings.",
  generator: "Optimus Intelligence",
  applicationName: "Optimus",
  icons: {
    icon: [
      { url: "/favicon.jpeg", type: "image/jpeg" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/favicon.jpeg",
    apple: [
      { url: "/apple-touch-icon.jpeg", sizes: "180x180", type: "image/jpeg" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://optimus.ajstudioz.co.in",
    siteName: "Optimus Intelligence Platform",
    title: "Optimus — Autonomous Online Media Discovery & Intelligence",
    description:
      "Autonomous online media discovery, contextual validation killing false alerts, and Anthropic/Perplexity-styled executive intelligence briefings.",
    images: [
      {
        url: "/og-image.jpeg",
        width: 1200,
        height: 630,
        alt: "Optimus Intelligence Platform — Autonomous Media Discovery",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Optimus — Autonomous Online Media Discovery & Intelligence",
    description:
      "Autonomous online media discovery, contextual validation killing false alerts, and Anthropic/Perplexity-styled executive intelligence briefings.",
    images: ["/og-image.jpeg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.jpeg" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.jpeg" />
        <meta property="og:image" content="https://optimus.ajstudioz.co.in/og-image.jpeg" />
        <meta property="og:image:secure_url" content="https://optimus.ajstudioz.co.in/og-image.jpeg" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
      </head>
      <body className={`${instrumentSans.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
          {process.env.VERCEL && <Analytics />}
        </AuthProvider>
      </body>
    </html>
  );
}
