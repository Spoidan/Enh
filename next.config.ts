import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Allow serving images from the local /uploads directory
    remotePatterns: [],
    localPatterns: [{ pathname: '/uploads/**' }, { pathname: '/icons/**' }],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
}

export default nextConfig
