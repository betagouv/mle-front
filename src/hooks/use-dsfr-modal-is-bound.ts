'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Les modales DSFR doivent être « bindées » par le JS du DSFR avant de pouvoir
 * être pilotées : `modal.open()` fait `window.dsfr(element).modal.disclose()` et
 * plante (« Cannot read properties of null (reading 'modal') ») tant que le
 * binding n'a pas eu lieu. Ce binding est asynchrone : au montage du composant,
 * l'élément existe dans le DOM mais n'est pas encore instancié.
 *
 * Ce hook renvoie `true` une fois la modale prête à être ouverte.
 */
export const useDsfrModalIsBound = (dialogId: string) => {
  const [isBound, setIsBound] = useState(false)
  const observerRef = useRef<MutationObserver | null>(null)

  useEffect(() => {
    if (isBound || observerRef.current) return

    const element = document.getElementById(dialogId)
    if (!element) return

    if (element.dataset.frJsModal === 'true') {
      setIsBound(true)
      return
    }

    const observer = new MutationObserver((records) => {
      const dialog = records.pop()?.target as HTMLDialogElement | undefined
      if (dialog?.dataset.frJsModal !== 'true') return

      // Le DSFR pose l'attribut avant que `disclose()` soit réellement
      // opérationnel — on laisse passer un tick avant de signaler le binding.
      setTimeout(() => setIsBound(true), 200)
    })

    observer.observe(element, { attributes: true, attributeFilter: ['data-fr-js-modal'] })
    observerRef.current = observer

    return () => {
      observerRef.current?.disconnect()
      observerRef.current = null
    }
  }, [isBound, dialogId])

  return isBound
}
