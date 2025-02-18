import Image from 'next/image'
import image from '~/images/preparer-sa-vie-etudiante.webp'
import { fr, FrIconClassName } from '@codegouvfr/react-dsfr'
import { getTranslations } from 'next-intl/server'
import { DynamicBreadcrumb } from '~/components/ui/breadcrumb'
import styles from './preparer-sa-vie-etudiante.module.css'
import { getDepartments } from '~/server-only/get-departments'
import { CitiesAutocompleteInput } from '~/components/prepare-student-life/autocomplete/cities-autocomplete-input'
import { PrepareStudentLifeSelectDepartment } from '~/components/prepare-student-life/select-department'
import { PopularCities } from '~/components/prepare-student-life/popular-cities'
import { getPopularCities } from '~/server-only/get-popular-cities'
import clsx from 'clsx'

export default async function PrepareYourStudentLife() {
  const t = await getTranslations('prepareStudentLife')
  const departments = await getDepartments()
  const popularCities = await getPopularCities()

  const informations = [
    { iconId: 'ri-community-line' as FrIconClassName, title: 'Informations pratiques' },
    { iconId: 'ri-line-chart-line' as FrIconClassName, title: 'Tendance du marché locatif' },
    { iconId: 'ri-money-euro-box-line' as FrIconClassName, title: 'Prix moyen des loyers' },
    { iconId: 'ri-shopping-bag-line' as FrIconClassName, title: 'Coût de la vie étudiante' },
  ]
  return (
    <>
      <div className="primaryBackgroundColor">
        <div className={clsx(fr.cx('fr-container'), styles.mainContainer)}>
          <div>
            <DynamicBreadcrumb color="white" />
            <div className={styles.headerContainer}>
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
          <Image className={fr.cx('fr-hidden', 'fr-unhidden-md')} src={image} quality={100} priority alt="Préparer sa vie étudiante" />
        </div>
      </div>
      <div className={styles.mobileImageContainer}>
        <Image
          className={clsx(fr.cx('fr-hidden-sm'), styles.mobileImage)}
          src={image}
          quality={100}
          priority
          alt="Préparer sa vie étudiante"
        />
      </div>
      <div className={clsx(fr.cx('fr-container'), styles.searchContainer)}>
        <div className={styles.searchCard}>
          <div className={styles.searchCardContent}>
            <div className={fr.cx('fr-col-md-6')}>
              <h3 className={styles.searchTitle}>{t('searchTitlePart')}</h3>
            </div>
            <div className={clsx(fr.cx('fr-col-md-6'), styles.searchCardInputsContainer)}>
              <PrepareStudentLifeSelectDepartment departments={departments} />
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

          <PopularCities cities={popularCities} />
        </div>
      </div>
    </>
  )
}
