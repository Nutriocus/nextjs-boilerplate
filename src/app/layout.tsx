import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "NUTRIOCUS — Mission Performance",
  description: "Plateforme de coaching nutritionnel pour athlètes d'endurance",
  keywords: ["nutrition", "trail", "triathlon", "endurance", "coaching"],
  manifest: "/manifest.json",
  applicationName: "NUTRIOCUS",
  appleWebApp: {
    capable: true,
    title: "NUTRIOCUS",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
