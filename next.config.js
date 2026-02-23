/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] },
  },
  eslint: {
    // ESLint 9 flat config has compatibility issues with next build.
    // Type checking still runs via TypeScript compiler.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};
module.exports = nextConfig;
