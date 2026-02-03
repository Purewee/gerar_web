/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    },
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "cdn.emartmall.mn",
        },
        {
          protocol: "https",
          hostname: "api.gerar.mn",
        },
        {
          protocol: "http",
          hostname: "localhost",
        },
        {
          protocol: "http",
          hostname: "127.0.0.1",
        },
        {
          protocol: "http",
          hostname: "192.168.1.3",
        },
        {
          protocol: "http",
          hostname: "192.168.1.3",
        },
      ],
      // Disable optimization for development to avoid localhost private IP resolution issues
      unoptimized: process.env.NODE_ENV === 'development',
    },
    // Optimize build size
    compress: true,
    // Reduce bundle size
    experimental: {
      optimizePackageImports: [
        "@radix-ui/react-dialog",
        "@radix-ui/react-dropdown-menu",
        "@radix-ui/react-navigation-menu",
        "@radix-ui/react-toast",
        "lucide-react",
      ],
    },
    // Exclude source maps from production build
  };
  
  module.exports = nextConfig;