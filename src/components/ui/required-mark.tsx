import type { ReactNode } from 'react'

/** Astérisque rouge signalant un champ obligatoire. */
export const RequiredMark = () => <span className="fr-text--bold fr-text-default--error">&nbsp;*</span>

/** Libellé de champ obligatoire : le texte du label, suivi de l'astérisque. */
export const RequiredLabel = ({ children }: { children: ReactNode }) => (
  <>
    {children}
    <RequiredMark />
  </>
)
