'use client'

import { useTranslations } from 'next-intl'
import connectMd from '~/images/dossier-facile-connect-md.svg'
import connectSm from '~/images/dossier-facile-connect-sm.svg'
import connectXl from '~/images/dossier-facile-connect-xl.svg'
import styles from './dossier-facile-connect-button.module.css'

/**
 * CTA officiel « Connexion DossierFacile ».
 *
 * L'asset vient de la charte partenaire : il porte son propre libellé et son propre fond, d'où un
 * `<button>` nu plutôt qu'un `<Button>` DSFR, et aucune mise en pleine largeur — le ratio est imposé.
 *
 * Les trois déclinaisons ne sont pas de simples mises à l'échelle : leurs ratios diffèrent
 * (240×32, 260×40, 320×56). D'où un `<picture>`, qui sert la bonne et ne télécharge qu'elle.
 *
 * En `<img>` et non en `background-image` : une image de fond disparaît en mode contraste élevé,
 * ce qui laisserait un bouton vide. Ici l'asset est du contenu, et son `alt` reprend mot pour mot
 * le libellé visible dans l'image (WCAG 2.5.3).
 */
export const DossierFacileConnectButton = ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) => {
  const t = useTranslations('accomodation.sidebar.buttons')

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={styles.button}>
      <picture>
        <source media="(min-width: 78em)" srcSet={connectXl.src} width={320} height={56} />
        <source media="(min-width: 48em)" srcSet={connectMd.src} width={260} height={40} />
        <img src={connectSm.src} alt={t('dossierFacileConnect')} width={240} height={32} className={styles.image} />
      </picture>
    </button>
  )
}
