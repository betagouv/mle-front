import { fr } from '@codegouvfr/react-dsfr'
import { Header } from '@codegouvfr/react-dsfr/Header'
import { getTranslations } from 'next-intl/server'
import { FC } from 'react'
import { Button } from '@codegouvfr/react-dsfr/Button'
import { BrandTop } from '~/components/brand-top'
import logo from '~/images/logo.svg'
import { HeaderNavigation } from '~/components/ui/header/navigation'

export const HeaderComponent: FC = async () => {
  const t = await getTranslations()
  return (
    <Header
      homeLinkProps={{
        href: '/',
        title: t('metadata.homeLinkTitle'),
      }}
      quickAccessItems={[
        <Button key="faq-cta" priority="tertiary no outline" iconId="ri-question-line">
          {t('navigation.faq')}
        </Button>,
        <Button priority="tertiary" key="alerts-cta" iconId="ri-notification-3-line">
          {t('header.alerts')}
        </Button>,
      ]}
      brandTop={<BrandTop />}
      serviceTagline={t('header.description')}
      serviceTitle={t('header.title')}
      navigation={<HeaderNavigation />}
      className={fr.cx('fr-header')}
      operatorLogo={{
        alt: 'Mon logement étudiant - logo',
        imgUrl: logo.src,
        orientation: 'horizontal',
      }}
    />
  )
}
