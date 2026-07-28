import Button from '@codegouvfr/react-dsfr/Button'
import { createModal } from '@codegouvfr/react-dsfr/Modal'
import clsx from 'clsx'
import { AccommodationImage } from '~/components/accommodation/accommodation-image'
import { AccommodationImagesModal } from '~/components/accommodation/accommodation-images-modal'
import { sPluriel } from '~/utils/sPluriel'
import styles from './accommodation-images.module.css'

interface AccommodationImagesProps {
  images: string[]
  title?: string
  withModal?: boolean
}

export const accommodationPicturesModal = createModal({
  id: 'accommodation-images-modal',
  isOpenedByDefault: false,
})

interface ImageGridProps {
  images: string[]
  imageWidth: number
  imageHeight: number
  totalImages: number
  withModal: boolean
  title?: string
  /** Rang de la première vignette de la grille dans la galerie complète (la principale est la 1re). */
  offset: number
}

export function photoAlt(index: number, total: number, title?: string): string {
  return title ? `Photo ${index} sur ${total} de la résidence ${title}` : `Photo ${index} sur ${total} du logement`
}

function ImageGrid({ images, imageWidth, imageHeight, totalImages, withModal, title, offset }: ImageGridProps) {
  return (
    <div className={clsx('fr-hidden fr-unhidden-sm', withModal && styles.cursor, styles.gridContainer)} data-images={totalImages}>
      <div className={styles.imageGrid}>
        {images.map((image, index) => (
          <AccommodationImage
            key={index}
            src={image}
            alt={photoAlt(offset + index, totalImages, title)}
            openModalLabel={`Agrandir la photo ${offset + index} sur ${totalImages}`}
            width={imageWidth}
            height={imageHeight}
            withModal={withModal}
          />
        ))}
      </div>
    </div>
  )
}

export const AccommodationImages = ({ images, title, withModal = true }: AccommodationImagesProps) => {
  const [mainImage, ...otherImages] = images
  const displayedImages = otherImages.slice(0, 4)

  let widthStyle = '50%'
  if (images.length === 1) {
    widthStyle = '100%'
  } else if (images.length === 3) {
    widthStyle = '33.33%'
  }

  return (
    <div className={styles.container}>
      <div className={clsx(withModal && styles.cursor, styles.mainImageContainer)} style={{ width: widthStyle }}>
        <AccommodationImage
          src={mainImage}
          alt={photoAlt(1, images.length, title)}
          openModalLabel={`Agrandir la photo 1 sur ${images.length}`}
          className={styles.mainImage}
          width={400}
          height={300}
          withModal={withModal}
        />
        {!!withModal && !!title && (
          <div className={styles.photoCountButton}>
            <AccommodationImagesModal images={images} title={title}>
              <Button priority="tertiary no outline" nativeButtonProps={accommodationPicturesModal.buttonProps}>
                <span className={`ri-image-line ${styles.photoCount}`}>
                  {images.length} photo{sPluriel(images.length)}
                </span>
              </Button>
            </AccommodationImagesModal>
          </div>
        )}
      </div>

      {images.length > 1 && images.length < 4 && (
        <ImageGrid
          images={displayedImages}
          imageWidth={400}
          imageHeight={300}
          totalImages={images.length}
          withModal={withModal}
          title={title}
          offset={2}
        />
      )}
      {images.length >= 4 && (
        <ImageGrid
          images={displayedImages}
          imageWidth={200}
          imageHeight={150}
          totalImages={images.length}
          withModal={withModal}
          title={title}
          offset={2}
        />
      )}
    </div>
  )
}
