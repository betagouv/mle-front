import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { withSentryConfig } from '@sentry/nextjs'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

const rootDir = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    ENABLE_PROXY_LOGS: process.env.ENABLE_PROXY_LOGS,
  },
  // Cache incrémental : les images optimisées vont dans S3 au lieu du disque éphémère du
  // container, le reste garde le comportement par défaut de Next — cf. cache-handler.mjs.
  cacheHandler: path.join(rootDir, 'cache-handler.mjs'),
  images: {
    // Sans ce drapeau, `cacheHandler` ne couvre que le cache incrémental et les images
    // continuent d'atterrir dans `.next/cache/images`.
    customCacheHandler: true,
    qualities: [50, 75, 100],
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
  async headers() {
    return [
      {
        source: '/widget/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          { key: 'Content-Security-Policy', value: 'frame-ancestors *' },
        ],
      },
    ]
  },
  async redirects() {
    return [
      // Assets statiques WordPress (Bedrock : `app` = `wp-content` renommé). Ils sont déjà
      // référencés en absolu depuis `info.` ; on renvoie le navigateur en direct plutôt que
      // de relayer les octets à travers le container. Les pages éditoriales, elles, passent
      // par des Route Handlers cachés — cf. src/utils/wp-proxy.ts.
      {
        source: '/wp-content/:path*',
        destination: 'https://info.monlogementetudiant.beta.gouv.fr/wp-content/:path*',
        permanent: true,
      },
      {
        source: '/app/:path*',
        destination: 'https://info.monlogementetudiant.beta.gouv.fr/app/:path*',
        permanent: true,
      },
    ]
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.woff2$/,
      type: 'asset/resource',
    })
    return config
  },
}

export default withSentryConfig(withNextIntl(nextConfig), {
  org: 'betagouv',
  project: 'monlogementetudiant',
  sentryUrl: 'https://sentry.incubateur.net/',
  silent: !process.env.CI,
  widenClientFileUpload: true,
})
