import Button from '@codegouvfr/react-dsfr/Button'
import Image from 'next/image'
import { createModal } from '@codegouvfr/react-dsfr/Modal'
import { AccommodationImagesModal } from '~/components/accommodation/accommodation-images-modal'
import styles from './accommodation-images.module.css'

interface AccommodationImagesProps {
  images: string[]
  title: string
}

export const modal = createModal({
  id: 'accommodation-images-modal',
  isOpenedByDefault: false,
})

export const AccommodationImages = ({ images, title }: AccommodationImagesProps) => {
  const [mainImage, ...otherImages] = images
  const displayedImages = otherImages.slice(0, 4)

  return (
    <div className={styles.container}>
      <div className={styles.mainImageContainer}>
        <Image src={mainImage} alt="Accommodation" width={400} height={300} />
        <div className={styles.photoCountButton}>
          <AccommodationImagesModal images={images} title={title}>
            <Button priority="tertiary no outline" nativeButtonProps={modal.buttonProps}>
              <span className={`ri-image-line ${styles.photoCount}`}>{images.length} photos</span>
            </Button>
          </AccommodationImagesModal>
        </div>
      </div>
      <div className={`fr-hidden fr-unhidden-sm ${styles.gridContainer}`}>
        <div className={styles.imageGrid}>
          {displayedImages.map((image, index) => (
            <Image key={index} src={image} alt="Accommodation" width={200} height={150} />
          ))}
        </div>
      </div>
    </div>
  )
}
