/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['undici'],
  async headers() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: '.*\\.vercel\\.app' }],
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ]
  },
}

module.exports = nextConfig
