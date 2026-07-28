'use client'

import { SkipLinks } from '@codegouvfr/react-dsfr/SkipLinks'
import { useTranslations } from 'next-intl'
import { FC } from 'react'

/** Cible du lien d'évitement « Contenu » : posée sur le <main> de chaque layout. */
export const MAIN_CONTENT_ID = 'contenu'
/** Cible du lien d'évitement « Menu » : posée sur la navigation principale de l'en-tête. */
export const MAIN_NAVIGATION_ID = 'navigation-principale'
/** Identifiant généré par le composant Footer du DSFR. */
const FOOTER_ID = 'fr-footer'

type CommonSkipLinksProps = {
  /** Faux sur les gabarits sans navigation principale (espace étudiant). */
  withNavigation?: boolean
}

/**
 * Liens d'évitement (RGAA 12.7). Ils doivent être les premiers éléments focusables
 * de la page : à placer avant l'en-tête dans chaque layout.
 */
export const CommonSkipLinks: FC<CommonSkipLinksProps> = ({ withNavigation = true }) => {
  const t = useTranslations('accessibility.skipLinks')

  return (
    <SkipLinks
      links={[
        { anchor: `#${MAIN_CONTENT_ID}`, label: t('content') },
        ...(withNavigation ? [{ anchor: `#${MAIN_NAVIGATION_ID}`, label: t('navigation') }] : []),
        { anchor: `#${FOOTER_ID}`, label: t('footer') },
      ]}
    />
  )
}
