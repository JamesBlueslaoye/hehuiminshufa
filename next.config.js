/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...(config.watchOptions || {}),
        // Reduce watched files on macOS to avoid EMFILE.
        ignored: ['**/.git/**', '**/.next/**', '**/node_modules/**', '**/out/**'],
        poll: 1000,
      }
    }
    return config
  },
}

module.exports = nextConfig
