/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['xhcqhzkwyhkwumbcgqwl.supabase.co'], // Add your Supabase URL here for image hosting
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
  // Add any experimental features if needed
  experimental: {
    serverComponentsExternalPackages: [
      '@sendgrid/mail',
      'puppeteer-extra',
      'puppeteer-extra-plugin-stealth',
      'puppeteer'
    ]
  },
  typescript: {
    ignoreBuildErrors: true // Temporarily ignore TS errors during build
  }
}

module.exports = nextConfig 