'use client'

import { type ReactNode, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Remonte une modale DSFR dans `document.body`.
 *
 * L'overlay des modales est en `position: fixed`, mais il reste peint dans le contexte
 * d'empilement de son parent. Rendue à l'intérieur d'une colonne `position: sticky` (qui crée un
 * tel contexte), la modale passe donc sous les éléments d'entête à z-index positif
 * (`.fr-header__brand`, `.fr-header__navbar`) : l'entête reste en blanc au lieu d'être assombri.
 * Sortir la modale du sous-arbre rétablit l'empilement attendu.
 */
export const ModalPortal = ({ children }: { children: ReactNode }) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return null
  return createPortal(children, document.body)
}
