import { fr } from '@codegouvfr/react-dsfr'
import { Breadcrumb } from '@codegouvfr/react-dsfr/Breadcrumb'
import { getTranslations } from 'next-intl/server'
import { FindStudentAccomodationHeader } from '~/components/find-student-accomodation/header/find-student-accomodation-header'
import { FindStudentAccomodationSortView } from '~/components/find-student-accomodation/sort-view/find-student-accomodation-sort-view'
import styles from './find-student-accomodation-page.module.css'
import { FindStudentAccomodationResults } from '~/components/find-student-accomodation/results/find-student-accomodation-results'
import { mockAccomodationCards } from '~/app/mocks/mock-accomodations'

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
      <FindStudentAccomodationResults />
    </div>
  )
}
