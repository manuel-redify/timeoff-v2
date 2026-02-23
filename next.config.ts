import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select', '@radix-ui/react-tooltip', '@radix-ui/react-alert-dialog', '@radix-ui/react-checkbox', '@radix-ui/react-navigation-menu', '@radix-ui/react-popover', '@radix-ui/react-radio-group', '@radix-ui/react-scroll-area', '@radix-ui/react-separator', '@radix-ui/react-switch', '@radix-ui/react-tabs', '@radix-ui/react-collapsible', '@radix-ui/react-label', '@radix-ui/react-avatar', '@radix-ui/react-slot'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
      {
        source: '/:path*.(js|css|woff|woff2|ttf|eot|svg|png|jpg|jpeg|gif|webp|avif|ico)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
