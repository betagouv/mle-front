import { fr, FrIconClassName, RiIconClassName } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import { Tag } from '@codegouvfr/react-dsfr/Tag'
import { getTranslations } from 'next-intl/server'
import dynamic from 'next/dynamic'
import { MapSkeleton } from '~/components/map/map-skeleton'
import { DynamicBreadcrumb } from '~/components/ui/breadcrumb'
import { getAccommodationById } from '~/server-only/get-accommodation-by-id'
import styles from './logement.module.css'
import { getAccommodations } from '~/server-only/get-accommodations'
import { NearbyAccommodations } from '~/components/accommodation/nearby-accommodations'
import { AccommodationImages } from '~/components/accommodation/accommodation-images'

const AccomodationMap = dynamic(() => import('~/components/map/accomodation-map').then((mod) => mod.AccomodationMap), {
  loading: () => <MapSkeleton height={400} />,
  ssr: false,
})

export default async function LogementPage({ params }: { params: { slug: string } }) {
  const t = await getTranslations('accomodation')
  const accommodation = await getAccommodationById(params.slug)
  const { address, city, geom, images_base64, name, nb_total_apartments, owner_name, postal_code } = accommodation
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
        <div
          style={{
            backgroundColor: 'white',
            border: '1px solid var(--border-default-grey)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
          className={fr.cx('fr-col-sm-8')}
        >
          {images_base64 && images_base64.length > 0 && <AccommodationImages images={images_base64} title={name} />}
          <div className={styles.headerSection}>
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
          <div className={styles.headerSection}>
            <h4>{t('availableAccommodations')}</h4>
          </div>
          <div>
            <div className={styles.locationContent}>
              <div className={styles.locationInfo}>
                <h4>{t('location.title')}</h4>
                <span>{address}</span>
                <span>
                  {postal_code} {city}
                </span>
                <Button iconId="fr-icon-accessibility-line" priority="tertiary" size="small">
                  {t('location.accessibility')}
                </Button>
              </div>
              <div style={{ width: '50%' }} className={fr.cx('fr-hidden', 'fr-unhidden-sm')}>
                <AccomodationMap center={[latitude, longitude]} />
              </div>
            </div>
          </div>
          <div className={fr.cx('fr-hidden-sm')}>{<AccomodationMap center={[latitude, longitude]} />}</div>
        </div>
        <div style={{ flexDirection: 'column' }} className={fr.cx('fr-col-sm-4')}>
          <div className={styles.sidebarCard}>
            <h3 className={styles.sidebarTitle}>
              {owner_name ? `${owner_name} - ` : ''} {t('sidebar.accommodationsCount', { count: nb_total_apartments })}
            </h3>
            <p className={styles.sidebarText}>{t('sidebar.share')}</p>
            <div className={styles.buttonGroup}>
              <Button size="small" iconId="ri-links-line" priority="tertiary" title={t('sidebar.buttons.link')} />
              <Button size="small" iconId="ri-mail-line" priority="tertiary" title={t('sidebar.buttons.email')} />
              <Button size="small" iconId="ri-printer-line" priority="tertiary" title={t('sidebar.buttons.print')} />
            </div>
          </div>
          <NearbyAccommodations nearbyAccommodations={nearbyAccommodations} />
        </div>
      </div>
    </div>
  )
}
