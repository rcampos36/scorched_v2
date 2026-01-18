import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "blob.vercel-storage.com",
      },
    ],
    // Allow local images from uploads directory
    // Next.js will automatically serve files from public/ directory
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    // CSP for SVG images only - allows SVG but restricts scripts
    // Note: This CSP only applies to SVG images, not the entire page
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; style-src 'unsafe-inline' 'self'; sandbox;",
    // Enable loading of local images
    loader: 'default',
  },
  // Ensure static files in public/uploads are served correctly
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Apply CSP headers to all pages to allow Google Fonts and React event handlers
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' https://apps.rokt.com 'unsafe-eval' 'unsafe-inline' 'unsafe-hashes'", // Allow React, Next.js, event handlers, and rokt.com
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // Allow Google Fonts CSS and inline styles
              "font-src 'self' data: https://fonts.gstatic.com", // Allow Google Fonts
              "img-src 'self' data: https: blob:", // Allow images from any HTTPS source
              "connect-src 'self'", // Allow API calls to same origin
            ].join('; ')
          },
        ],
      },
    ];
  },
};

export default nextConfig;
