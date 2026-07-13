'use client'

import { useEffect, useRef } from 'react'
import { useSaveHousingAidSimulation } from '~/hooks/use-housing-aid-simulation'
import { clearPendingAidSimulation, readPendingAidSimulation } from '~/utils/pending-aid-simulation'

/**
 * Sauvegarde automatiquement, à la première arrivée dans l'espace connecté, la simulation
 * qu'un utilisateur non connecté avait mémorisée avant de créer son compte, puis nettoie
 * le localStorage. Ne rend rien.
 */
export const PendingSimulationSaver = () => {
  const { mutateAsync: saveSimulation } = useSaveHousingAidSimulation({ silent: true })
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const pending = readPendingAidSimulation()
    if (!pending) return

    saveSimulation(pending)
      .then(() => clearPendingAidSimulation())
      .catch(() => {
        // Échec de sauvegarde : on conserve la simulation en localStorage pour un prochain essai.
      })
  }, [saveSimulation])

  return null
}
