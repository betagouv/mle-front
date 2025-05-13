'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import clsx from 'clsx'
import Image from 'next/image'
import { useState } from 'react'
import { tss } from 'tss-react'
import { modal } from './accommodation-images'

export const AccommodationImagesModal = ({ children, images, title }: { children: React.ReactNode; images: string[]; title: string }) => {
  const { classes } = useStyles()
  const [currentImage, setCurrentImage] = useState(0)
  return (
    <>
      {children}
      <modal.Component title={title} size="large">
        <div className={classes.container}>
          <div style={{ position: 'relative', width: '100%', height: '50vh' }}>
            <Image src={images[currentImage]} alt="Accommodation" fill style={{ objectFit: 'contain' }} />
          </div>
        </div>
        <div className={classes.buttonsContainer}>
          <div className={clsx(classes.buttons, fr.cx('fr-mt-4w'))}>
            <Button
              iconId="ri-arrow-left-line"
              priority="secondary"
              title="Image précédente"
              onClick={() => setCurrentImage(currentImage - 1)}
            />
            <Button
              iconId="ri-arrow-right-line"
              priority="secondary"
              title="Image suivante"
              onClick={() => setCurrentImage(currentImage + 1)}
            />
          </div>
        </div>
      </modal.Component>
    </>
  )
}

const useStyles = tss.create({
  buttonsContainer: {
    display: 'flex',
    borderTop: '1px solid var(--border-default-grey)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1rem',
  },
  buttons: {
    display: 'flex',
    gap: '1rem',
  },
  container: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
})
