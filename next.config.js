/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['xhcqhzkwyhkwumbcgqwl.supabase.co'],
  },
  webpack: (config, { isServer }) => {
    // Add these modules to the server-side bundle
    if (isServer) {
      config.externals = [...(config.externals || []), 
        '@sendgrid/mail',
        'puppeteer-extra',
        'puppeteer-extra-plugin-stealth'
      ];
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: [
      '@sendgrid/mail',
      'puppeteer-extra',
      'puppeteer-extra-plugin-stealth',
      'puppeteer'
    ]
  },
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  }
}

module.exports = nextConfig 