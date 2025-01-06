import Image from 'next/image'
import image from '~/images/preparer-sa-vie-etudiante.svg'
import { fr, FrIconClassName } from '@codegouvfr/react-dsfr'
import { Select } from '@codegouvfr/react-dsfr/Select'
import { Tile } from '@codegouvfr/react-dsfr/Tile'
import { getTranslations } from 'next-intl/server'
import { DynamicBreadcrumb } from '~/components/ui/breadcrumb'
import styles from './preparer-sa-vie-etudiante.module.css'
import { getDepartments } from '~/server-only/get-departments'
import { CitiesAutocompleteInput } from '~/components/prepare-student-life/autocomplete/cities-autocomplete-input'

export default async function PrepareYourStudentLife() {
  const t = await getTranslations('prepareStudentLife')
  const departments = await getDepartments()
  const tilesData = [
    {
      city: 'Paris',
      description: '9 802 logements étudiants',
      detail: 'Budget minimum 600€',
    },
    {
      city: 'Lyon',
      description: '9 802 logements étudiants',
      detail: 'Budget minimum 600€',
    },
    {
      city: 'Toulouse',
      description: '9 802 logements étudiants',
      detail: 'Budget minimum 600€',
    },
    {
      city: 'Montpellier',
      description: '9 802 logements étudiants',
      detail: 'Budget minimum 600€',
    },
    {
      city: 'Lille',
      description: '9 802 logements étudiants',
      detail: 'Budget minimum 600€',
    },
    {
      city: 'Bordeaux',
      description: '9 802 logements étudiants',
      detail: 'Budget minimum 600€',
    },
    {
      city: 'Grenoble',
      description: '9 802 logements étudiants',
      detail: 'Budget minimum 600€',
    },
    {
      city: 'Nantes',
      description: '9 802 logements étudiants',
      detail: 'Budget minimum 600€',
    },
    {
      city: 'Strasbourg',
      description: '9 802 logements étudiants',
      detail: 'Budget minimum 600€',
    },
    {
      city: 'Rennes',
      description: '9 802 logements étudiants',
      detail: 'Budget minimum 600€',
    },
    {
      city: 'Marseille',
      description: '9 802 logements étudiants',
      detail: 'Budget minimum 600€',
    },
    {
      city: 'Nice',
      description: '9 802 logements étudiants',
      detail: 'Budget minimum 600€',
    },
  ]
  const informations = [
    { iconId: 'ri-community-line' as FrIconClassName, title: 'Informations pratiques' },
    { iconId: 'ri-line-chart-line' as FrIconClassName, title: 'Tendance du marché locatif' },
    { iconId: 'ri-money-euro-box-line' as FrIconClassName, title: 'Prix moyen des loyers' },
    { iconId: 'ri-shopping-bag-line' as FrIconClassName, title: 'Coût de la vie étudiante' },
  ]
  return (
    <>
      <div className={styles.heroSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }} className={fr.cx('fr-container')}>
          <div className={styles.breadcrumbWrapper}>
            <DynamicBreadcrumb color="white" />
          </div>
          <div className={styles.heroContent}>
            <div>
              <h1 className={styles.heroCustomFont}>
                <span className={styles.heroTitle}>{t('titlePart1')}</span>
                <br />
                <span className={styles.heroTitle}>{t('titlePart2')}</span>
                <br />
                <span className={styles.heroTitleHighlight}>{t('titlePart3')}</span>
              </h1>
              <div className={styles.informationGrid}>
                {informations.map((information, index) => (
                  <div key={index} className={styles.informationItem}>
                    <span className={fr.cx(information.iconId)}>{information.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <Image src={image} priority alt="Préparer sa vie étudiante" />
        </div>
      </div>
      <div style={{ marginTop: '-4rem', position: 'relative', zIndex: 1 }} className={fr.cx('fr-container')}>
        <div className={styles.searchCard}>
          <div className={styles.searchCardContent}>
            <div style={{ alignItems: 'center', display: 'flex' }} className={fr.cx('fr-col-md-6')}>
              <h3 className={styles.searchTitle}>
                {t('searchTitlePart1')}
                <br />
                {t('searchTitlePart2')}
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }} className={fr.cx('fr-col-md-6')}>
              <Select style={{ flex: '1', margin: 0 }} label={t('department')} nativeSelectProps={{}}>
                <option value="Tous">Tous</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </Select>
              <CitiesAutocompleteInput />
            </div>
          </div>
        </div>
      </div>
      <div className={fr.cx('fr-container', 'fr-py-6w')}>
        <div className={styles.popularCitiesSection}>
          <div className={styles.popularCitiesTitle}>
            <h3>{t('popularCities')}</h3>
          </div>
          <div className={styles.tilesGrid}>
            {tilesData.map((tile) => (
              <Tile
                noIcon
                key={tile.city}
                desc={tile.description}
                detail={tile.detail}
                linkProps={{
                  href: `/preparer-sa-vie-etudiante/${tile.city}`,
                }}
                orientation="vertical"
                title={tile.city}
                titleAs="h3"
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
