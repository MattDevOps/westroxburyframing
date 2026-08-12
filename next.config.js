/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async redirects() {
    return [
      {
        // /instant-quote feature removed; we only quote in store
        source: "/instant-quote",
        destination: "/book",
        permanent: true,
      },
      {
        // Legacy standalone Calendly embed; /book is the canonical booking page
        source: "/appointment",
        destination: "/book",
        permanent: true,
      },
      // Pages from the pre-Next.js static site. Google still has these in its
      // index and they were 404ing, which throws away their age and links.
      { source: "/about-us.html", destination: "/about", permanent: true },
      { source: "/contact-us.html", destination: "/contact", permanent: true },
      { source: "/framed-art.html", destination: "/framed-art", permanent: true },
      { source: "/restoration.html", destination: "/restoration", permanent: true },
      { source: "/services.html", destination: "/services", permanent: true },
      { source: "/testimonials.html", destination: "/testimonials", permanent: true },
      { source: "/special-offers.html", destination: "/gift-cards", permanent: true },
      { source: "/thank-you.html", destination: "/", permanent: true },
      { source: "/gerald-riveron.html", destination: "/artists", permanent: true },
      // Same pages under the WordPress permalink shape that replaced them.
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/contact-us", destination: "/contact", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
      {
        // Cache static assets aggressively
        source: "/artists/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache static assets aggressively
        source: "/framed-art/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};
module.exports = nextConfig;
