'use client'

import Image from 'next/image'
import { accommodationPicturesModal } from '~/components/accommodation/accommodation-images'
import styles from './accommodation-image.module.css'

export const AccommodationImage = ({
  width,
  height,
  className,
  src,
  alt,
  openModalLabel,
  withModal,
}: {
  width: number
  height: number
  className?: string
  src: string
  /** Alternative propre à cette photo : deux vignettes ne doivent pas se ressembler (RGAA 1.1). */
  alt: string
  /** Nom accessible du bouton d'agrandissement, quand la vignette ouvre la visionneuse. */
  openModalLabel?: string
  withModal: boolean
}) => {
  const image = <Image src={src} alt={alt} width={width} height={height} className={className} />

  if (!withModal) return image

  // La vignette ouvrait la visionneuse via un onClick posé sur l'image : inatteignable au clavier
  // (RGAA 7.3). Le <button> rétablit le focus, l'activation par Entrée/Espace et un nom accessible.
  return (
    <button type="button" className={styles.trigger} onClick={() => accommodationPicturesModal.open()} aria-label={openModalLabel}>
      {image}
    </button>
  )
}
