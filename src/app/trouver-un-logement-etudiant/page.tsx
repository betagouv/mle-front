import { fr } from '@codegouvfr/react-dsfr'
import { Breadcrumb } from '@codegouvfr/react-dsfr/Breadcrumb'
import { getTranslations } from 'next-intl/server'
import { AccomodationCard } from '~/components/find-student-accomodation/card/find-student-accomodation-card'
import { Pagination } from '@codegouvfr/react-dsfr/Pagination'
import { FindStudentAccomodationHeader } from '~/components/find-student-accomodation/header/find-student-accomodation-header'
import { FindStudentAccomodationSortView } from '~/components/find-student-accomodation/sort-view/find-student-accomodation-sort-view'
import styles from './find-student-accomodation-page.module.css'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockAccomodationCards = Array.from({ length: 10 }, (_) => ({
  imageUri: 'https://www.systeme-de-design.gouv.fr/img/placeholder.16x9.png',
  localisation: 'Paris, 75000',
  nbAccomodations: 10,
  price: '1000€',
  surface: '20m²',
  title: 'Les estudines',
  type: 'Individuel',
}))

export default async function FindStudentAccommodationPage() {
  const t = await getTranslations('findAccomodation')
  return (
    <div className={fr.cx('fr-container')}>
      <Breadcrumb
        className={styles.breadcrumb}
        currentPageLabel={t('currentPageLabel')}
        homeLinkProps={{
          href: '/',
        }}
        segments={[]}
      />
      <h1>{t('currentPageLabel')}</h1>
      <FindStudentAccomodationHeader />
      <div className={styles.headerContainer}>
        <h4>{mockAccomodationCards.length} logements</h4>
        <FindStudentAccomodationSortView />
      </div>
      <div className={styles.accommodationGrid}>
        {mockAccomodationCards.map((card) => (
          <AccomodationCard key={card.title} {...card} />
        ))}
      </div>

      <div className={styles.paginationContainer}>
        <Pagination showFirstLast={false} count={10} defaultPage={1} getPageLinkProps={() => ({ href: '/' })} />
      </div>
    </div>
  )
}
