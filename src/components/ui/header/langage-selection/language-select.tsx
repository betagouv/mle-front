import { fr } from '@codegouvfr/react-dsfr'
import { HeaderQuickAccessItem } from '@codegouvfr/react-dsfr/Header'
import { cookies } from 'next/headers'
import { useTranslations } from 'next-intl'
import { FC } from 'react'

import { AvailableLocales } from '~/i18n/request'
import { LanguageLink } from '~/components/ui/header/langage-selection/language-link'

export const LanguageSelect: FC = () => {
  const lang = cookies().get('NEXT_LOCALE')?.value as AvailableLocales
  const availablesLocales = [AvailableLocales.FR, AvailableLocales.EN]
  const t = useTranslations('languages')

  const fullNameByLang = {
    [AvailableLocales.FR]: t('fr'),
    [AvailableLocales.EN]: t('en'),
  }

  return (
    <HeaderQuickAccessItem
      id="language-select"
      className="language-select"
      quickAccessItem={{
        buttonProps: {
          'aria-controls': 'language-select-menu',
          'aria-expanded': false,
          className: fr.cx('fr-btn--tertiary', 'fr-translate', 'fr-nav'),
          title: t('title'),
        },
        iconId: 'fr-icon-translate-2',
        text: (
          <>
            <div>
              <span className="short-label">{lang.toUpperCase()}</span>
              <span className={fr.cx('fr-hidden-lg')}> -{fullNameByLang[lang as AvailableLocales]}</span>{' '}
            </div>
            <div className={fr.cx('fr-collapse', 'fr-menu')} id="language-select-menu">
              <ul className={fr.cx('fr-menu__list')}>
                {availablesLocales.map((lang_i) => (
                  <li key={lang_i}>
                    <LanguageLink activeLocale={lang} locale={lang_i} fullNameByLang={fullNameByLang[lang_i as AvailableLocales]} />
                  </li>
                ))}
              </ul>
            </div>
          </>
        ),
      }}
    />
  )
}
