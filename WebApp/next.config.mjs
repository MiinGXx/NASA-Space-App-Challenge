/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        unoptimized: true,
    },
    output: 'standalone',
    poweredByHeader: false,
    compress: true,
    trailingSlash: false,
    swcMinify: true,
    experimental: {
        optimizePackageImports: [
            'lucide-react',
            '@radix-ui/react-icons'
        ]
    },
    env: {
        CUSTOM_KEY: process.env.CUSTOM_KEY,
    }
};

export default nextConfig;
