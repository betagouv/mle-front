'use client'

import DsfrToggleSwitch, { type ToggleSwitchProps } from '@codegouvfr/react-dsfr/ToggleSwitch'
import clsx from 'clsx'

type AccessibleToggleSwitchProps = ToggleSwitchProps & {
  /** Décrit l'effet de l'interrupteur. Restitué aux technologies d'assistance. */
  description: string
  /** Affiche aussi la description sous l'interrupteur. Par défaut elle n'est que vocalisée. */
  showDescription?: boolean
}

/**
 * Interrupteur DSFR doté d'une description.
 *
 * Le composant `ToggleSwitch` de react-dsfr pose systématiquement `aria-describedby="{id}-hint-text"`
 * sur l'entrée, mais ne rend le paragraphe correspondant que si la prop `helperText` est fournie.
 * Sans texte d'aide, la référence pointe donc vers un identifiant inexistant (RGAA 11.10). Ce
 * composant impose la description, et la masque visuellement par défaut pour ne rien changer au
 * rendu existant.
 */
export const ToggleSwitch = ({ description, showDescription = false, classes, ...props }: AccessibleToggleSwitchProps) => (
  <DsfrToggleSwitch
    {...(props as ToggleSwitchProps)}
    helperText={description}
    classes={{ ...classes, hint: clsx(classes?.hint, !showDescription && 'fr-sr-only') }}
  />
)
