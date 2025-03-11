'use client'

import Image from 'next/image'
import { modal } from './accommodation-images'

export const AccommodationImagesModal = ({ children, images, title }: { children: React.ReactNode; images: string[]; title: string }) => {
  return (
    <>
      {children}
      <modal.Component title={title}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {images.map((image, index) => (
            <Image key={index} src={image} alt="Accommodation" width={400} height={400} />
          ))}
        </div>
      </modal.Component>
    </>
  )
}
