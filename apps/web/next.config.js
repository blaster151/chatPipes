/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  transpilePackages: ['@chatpipes/ai-conductor', '@chatpipes/types', '@chatpipes/headless-bridges']
}

module.exports = nextConfig 