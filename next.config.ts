import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Allow serving images from the local /uploads directory
    remotePatterns: [],
    localPatterns: [{ pathname: '/uploads/**' }],
  },
}

export default nextConfig
