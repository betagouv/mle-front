'use client'

import Image from 'next/image'
import { tss } from 'tss-react'
import { modal } from './accommodation-images'

export const AccommodationImagesModal = ({ children, images, title }: { children: React.ReactNode; images: string[]; title: string }) => {
  const { classes } = useStyles()
  return (
    <>
      {children}
      <modal.Component title={title}>
        <div className={classes.container}>
          {images.map((image, index) => (
            <Image key={index} src={image} alt="Accommodation" width={400} height={400} />
          ))}
        </div>
      </modal.Component>
    </>
  )
}

const useStyles = tss.create({
  container: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
})
