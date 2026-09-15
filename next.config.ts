import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Allow Cloud Agent / Cloudflare preview hosts to load the Next.js dev server.
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "*.loca.lt",
    "*.ngrok-free.app",
    "*.ngrok.app",
  ],
  turbopack: {
    root: path.join(__dirname),
  },
  async redirects() {
    return [
      {
        source: "/products",
        destination: "/",
        permanent: false,
      },
      {
        source: "/about",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
