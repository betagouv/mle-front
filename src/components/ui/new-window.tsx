'use client'

import { useTranslations } from 'next-intl'
import { FC } from 'react'

/**
 * RGAA 13.2 — toute ouverture de nouvelle fenêtre doit être signalée à l'utilisateur,
 * soit dans l'intitulé du lien, soit dans son attribut title.
 *
 * Deux façons de le faire, selon ce que le composant permet :
 * - <NewWindowHint /> quand on maîtrise le contenu du lien (mention lue, non affichée) ;
 * - la clé `accessibility.linkNewWindow` quand on ne dispose que d'un title ou d'un
 *   aria-label, par exemple avec les `linkProps` du DSFR :
 *   `t('accessibility.linkNewWindow', { label: 'Consulter l’offre' })`.
 */
export const NewWindowHint: FC = () => {
  const t = useTranslations('accessibility')

  return <span className="fr-sr-only"> ({t('newWindow')})</span>
}
