import { withSentryConfig } from '@sentry/nextjs'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    ENABLE_PROXY_LOGS: process.env.ENABLE_PROXY_LOGS,
  },
  images: {
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
      // L'espace « Candidatures » du gestionnaire est devenu l'espace « Contacts ».
      {
        source: '/bailleur/candidatures',
        destination: '/bailleur/contacts',
        permanent: true,
      },
      {
        source: '/bailleur/candidatures/:path*',
        destination: '/bailleur/contacts',
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
