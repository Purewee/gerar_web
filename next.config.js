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
      ],
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