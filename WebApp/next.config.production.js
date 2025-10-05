const { createSecureHeaders } = require('next-secure-headers');

/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: false,
    },
    typescript: {
        ignoreBuildErrors: false,
    },
    images: {
        unoptimized: true,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'api.open-meteo.com',
            },
            {
                protocol: 'https',
                hostname: 'air-quality-api.open-meteo.com',
            },
            {
                protocol: 'https',
                hostname: 'geocoding-api.open-meteo.com',
            }
        ]
    },
    output: 'standalone',
    poweredByHeader: false,
    compress: true,
    trailingSlash: false,
    swcMinify: true,
    experimental: {
        optimizePackageImports: [
            'lucide-react',
            '@radix-ui/react-icons',
            'framer-motion'
        ],
        serverComponentsExternalPackages: ['sharp']
    },
    env: {
        CUSTOM_KEY: process.env.CUSTOM_KEY,
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: createSecureHeaders({
                    contentSecurityPolicy: {
                        directives: {
                            defaultSrc: "'self'",
                            styleSrc: ["'self'", "'unsafe-inline'"],
                            scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
                            imgSrc: ["'self'", "data:", "https:"],
                            connectSrc: ["'self'", "https://api.open-meteo.com", "https://air-quality-api.open-meteo.com", "https://geocoding-api.open-meteo.com", "https://*.openai.azure.com"],
                            fontSrc: ["'self'", "data:"],
                            manifestSrc: ["'self'"],
                            frameSrc: ["'self'"]
                        }
                    },
                    frameGuard: 'deny',
                    contentTypeOptions: 'nosniff',
                    referrerPolicy: 'strict-origin-when-cross-origin'
                })
            },
            {
                source: '/api/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, s-maxage=300, stale-while-revalidate=600'
                    }
                ]
            }
        ];
    },
    async rewrites() {
        return [
            {
                source: '/health',
                destination: '/api/health'
            }
        ];
    }
};

module.exports = nextConfig;