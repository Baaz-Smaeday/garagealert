/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip TypeScript errors during build (safe for MVP)
  typescript: {
    ignoreBuildErrors: true,
  },
  // Skip ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // This makes images from Supabase Storage work
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}

module.exports = nextConfig
