import nextPwa from "next-pwa";

const withPWA = nextPwa({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  buildExcludes: [/middleware-manifest\.json$/],
  runtimeCaching: [
    {
      // Supabase API: never cache (always fresh data + auth tokens)
      urlPattern: /^https:\/\/[a-z0-9-]+\.supabase\.co\/.*$/i,
      handler: "NetworkOnly",
    },
    {
      // Page navigations (HTML): network-first with cache fallback
      urlPattern: ({ request, sameOrigin }) =>
        sameOrigin && request.mode === "navigate",
      handler: "NetworkFirst",
      options: {
        cacheName: "pages",
        networkTimeoutSeconds: 5,
        expiration: { maxEntries: 64, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    {
      // Static assets, images, fonts
      urlPattern: ({ request, sameOrigin }) =>
        sameOrigin &&
        (request.destination === "style" ||
          request.destination === "script" ||
          request.destination === "image" ||
          request.destination === "font"),
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-assets",
        expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
};

export default withPWA(nextConfig);
