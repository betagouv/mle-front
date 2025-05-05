import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'monlogementetudiant-s3-staging.s3.gra.io.cloud.ovh.net',
      },
      {
        protocol: 'https',
        hostname: 'monlogementetudiant-s3.s3.gra.io.cloud.ovh.net',
      },
    ],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.woff2$/,
      type: 'asset/resource',
    })
    return config
  },
}

export default withNextIntl(nextConfig)
