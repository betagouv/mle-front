import { DsfrHead } from '@codegouvfr/react-dsfr/next-appdir/DsfrHead'
import { DsfrProvider } from '@codegouvfr/react-dsfr/next-appdir/DsfrProvider'
import { getHtmlAttributes } from '@codegouvfr/react-dsfr/next-appdir/getHtmlAttributes'
import { Footer } from '@codegouvfr/react-dsfr/Footer'
import Link from 'next/link'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'

import { defaultColorScheme, StartDsfr } from '~/app/start-dsfr'
import { HeaderComponent } from '~/components/header/header'

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
  const t = await getTranslations('header')

  return (
    <html {...getHtmlAttributes({ defaultColorScheme, lang: locale })}>
      <head>
        <StartDsfr />
        <DsfrHead Link={Link} preloadFonts={['Marianne-Regular', 'Marianne-Medium', 'Marianne-Bold']} />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <DsfrProvider lang={locale}>
            <HeaderComponent />
            {children}
            <Footer
              accessibility="fully compliant"
              homeLinkProps={{
                href: '/',
                title: t('home'),
              }}
              brandTop="République Française"
            />
          </DsfrProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
