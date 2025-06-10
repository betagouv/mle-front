import { DsfrHead } from '@codegouvfr/react-dsfr/next-appdir/DsfrHead'
import { DsfrProvider } from '@codegouvfr/react-dsfr/next-appdir/DsfrProvider'
import { getHtmlAttributes } from '@codegouvfr/react-dsfr/next-appdir/getHtmlAttributes'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import Link from 'next/link'

import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { defaultColorScheme } from '~/app/default-color-scheme'
import { StartDsfr } from '~/app/start-dsfr'
import { FooterComponent } from '~/components/ui/footer/footer'
import { HeaderComponent } from '~/components/ui/header/header'
import { TanstackQueryClientProvider } from '~/providers/tanstack-client'
import styles from './layout.module.css'
import '~/globals.css'
import '~/text.css'
import { NextAppDirEmotionCacheProvider } from 'tss-react/next'
import Matomo from '~/app/matomo'
import Toaster from '~/components/ui/toaster'

export const generateMetadata = async () => {
  const t = await getTranslations('metadata')
  return {
    description: t('description'),
    title: t('title'),
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html {...getHtmlAttributes({ defaultColorScheme, lang: locale })} style={{ overflowX: 'hidden' }}>
      <head>
        <StartDsfr />
        <DsfrHead Link={Link} preloadFonts={['Marianne-Regular', 'Marianne-Medium', 'Marianne-Bold']} />
        <Matomo />
      </head>
      <body>
        <NextAppDirEmotionCacheProvider options={{ key: 'css' }}>
          <NextIntlClientProvider messages={messages}>
            <DsfrProvider lang={locale}>
              <TanstackQueryClientProvider>
                <NuqsAdapter>
                  <HeaderComponent />
                  <main className={styles.container}>{children}</main>
                  <Toaster />
                  <FooterComponent />
                </NuqsAdapter>
              </TanstackQueryClientProvider>
            </DsfrProvider>
          </NextIntlClientProvider>
        </NextAppDirEmotionCacheProvider>
      </body>
    </html>
  )
}
