import { FrIconClassName, RiIconClassName, fr } from '@codegouvfr/react-dsfr'
import { Tag } from '@codegouvfr/react-dsfr/Tag'
import clsx from 'clsx'
import { getTranslations } from 'next-intl/server'
import dynamic from 'next/dynamic'
import { AccommodationEquipments } from '~/app/logement/[slug]/accommodation-equipments'
import { AccommodationLocalisation } from '~/app/logement/[slug]/accommodation-localisation'
import { OwnerDetails } from '~/app/logement/[slug]/owner-details'
import { AccommodationImages } from '~/components/accommodation/accommodation-images'
import { NearbyAccommodations } from '~/components/accommodation/nearby-accommodations'
import { MapSkeleton } from '~/components/map/map-skeleton'
import { DynamicBreadcrumb } from '~/components/ui/breadcrumb'
import { getAccommodationById } from '~/server-only/get-accommodation-by-id'
import { getAccommodations } from '~/server-only/get-accommodations'
import styles from './logement.module.css'

const AccomodationMap = dynamic(() => import('~/components/map/accomodation-map').then((mod) => mod.AccomodationMap), {
  loading: () => <MapSkeleton height={400} />,
  ssr: false,
})

export default async function LogementPage({ params }: { params: { slug: string } }) {
  const t = await getTranslations('accomodation')
  const accommodation = await getAccommodationById(params.slug)
  const { address, city, geom, images_base64, name, nb_total_apartments, owner, postal_code } = accommodation
  const { coordinates } = geom
  const [longitude, latitude] = coordinates
  const nearbyAccommodations = await getAccommodations({ center: `${longitude},${latitude}` })

  const tags: Array<{ iconId?: FrIconClassName | RiIconClassName; label: string }> = [
    { iconId: 'ri-user-line', label: t('tags.studio') },
    { iconId: 'ri-group-line', label: t('tags.shared') },
    { iconId: 'ri-wheelchair-line', label: t('tags.accessible') },
  ]

  return (
    <div className={fr.cx('fr-container')}>
      <DynamicBreadcrumb title={name} />
      <h2>{t('title', { city, title: name })}</h2>
      <div className={styles.container}>
        <div className={clsx(fr.cx('fr-col-sm-8'), styles.infosContainer)}>
          {images_base64 && images_base64.length > 0 && <AccommodationImages images={images_base64} title={name} />}
          <div className={styles.section}>
            <h1>{name}</h1>
            <div className={styles.tagContainer}>
              {tags.map((t) =>
                t.iconId ? (
                  <Tag iconId={t.iconId} key={t.label}>
                    {t.label}
                  </Tag>
                ) : (
                  <Tag key={t.label}>{t.label}</Tag>
                ),
              )}
            </div>
          </div>
          <div className={styles.section}>
            <h4>{t('availableAccommodations')}</h4>
          </div>
          <AccommodationEquipments accommodation={accommodation} />
          <AccommodationLocalisation address={address} city={city} latitude={latitude} longitude={longitude} postalCode={postal_code} />
        </div>
        <div className={fr.cx('fr-hidden-sm')}>{<AccomodationMap center={[latitude, longitude]} />}</div>
        <div style={{ flexDirection: 'column' }} className={fr.cx('fr-col-sm-4')}>
          <OwnerDetails owner={owner} nbTotalApartments={nb_total_apartments} />
          <NearbyAccommodations nearbyAccommodations={nearbyAccommodations} />
        </div>
      </div>
    </div>
  )
}
