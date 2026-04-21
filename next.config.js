/** @type {import('next').NextConfig} */
const isGithubActions = process.env.GITHUB_ACTIONS === 'true'
const repoName = 'hehuiminshufa'

const nextConfig = {
  output: 'export',
  basePath: isGithubActions ? `/${repoName}` : '',
  assetPrefix: isGithubActions ? `/${repoName}/` : '',
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
