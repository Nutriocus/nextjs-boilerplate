import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone mode : génère un dossier .next/standalone autonome
  // Requis pour Hostinger Node.js (pas de Vercel)
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
