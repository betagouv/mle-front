'use client'

import { FC, useEffect } from 'react'
import { useMap } from 'react-leaflet'

/**
 * Donne un nom accessible au conteneur de la carte (RGAA 1.1).
 *
 * MapContainer ne transmet pas les attributs ARIA au <div> qu'il rend : on les pose donc sur
 * le conteneur Leaflet lui-même, une fois la carte initialisée.
 */
export const MapAccessibleName: FC<{ label: string }> = ({ label }) => {
  const map = useMap()

  useEffect(() => {
    const container = map.getContainer()
    container.setAttribute('role', 'region')
    container.setAttribute('aria-label', label)
  }, [map, label])

  return null
}
