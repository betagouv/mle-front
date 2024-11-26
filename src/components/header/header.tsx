import { fr } from '@codegouvfr/react-dsfr'
import Header from '@codegouvfr/react-dsfr/Header'
import { getTranslations } from 'next-intl/server'
import { FC } from 'react'

import { LanguageSelect } from '~/components/header/langage-selection/language-select'
import { HeaderNavigation } from '~/components/header/navigation'

export const HeaderComponent: FC = async () => {
  const t = await getTranslations('metadata')
  return (
    <Header
      homeLinkProps={{
        href: '/',
        title: t('homeLinkTitle'),
      }}
      quickAccessItems={[<LanguageSelect key="language-select" />]}
      brandTop="République Française"
      serviceTagline={t('description')}
      serviceTitle={t('title')}
      navigation={<HeaderNavigation />}
      className={fr.cx('fr-header')}
    />
  )
}
