/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['xhcqhzkwyhkwumbcgqwl.supabase.co'], // Add your Supabase URL here for image hosting
  },
}

module.exports = nextConfig 