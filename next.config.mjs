/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Disable static optimization for pages that use dynamic features
  staticPageGenerationTimeout: 180,
  // Skip build-time errors for dynamic routes
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Skip static generation for routes with context dependencies
  outputFileTracingExcludes: {
    '/login': ['**/*'],
    '/signup': ['**/*'],
  },
};

export default nextConfig;
