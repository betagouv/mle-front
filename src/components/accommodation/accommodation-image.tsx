'use client'

import Image from 'next/image'
import { accommodationPicturesModal } from '~/components/accommodation/accommodation-images'

export const AccommodationImage = ({
  width,
  height,
  className,
  src,
}: { width: number; height: number; className?: string; src: string }) => {
  return (
    <Image
      src={src}
      alt="Photo du logement"
      width={width}
      height={height}
      onClick={() => accommodationPicturesModal.open()}
      className={className}
    />
  )
}
