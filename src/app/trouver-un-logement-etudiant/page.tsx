import { fr } from '@codegouvfr/react-dsfr'
import { getTranslations } from 'next-intl/server'
import { FindStudentAccomodationHeader } from '~/components/find-student-accomodation/header/find-student-accomodation-header'
import { FindStudentAccomodationSortView } from '~/components/find-student-accomodation/sort-view/find-student-accomodation-sort-view'
import styles from './find-student-accomodation-page.module.css'
import { FindStudentAccomodationResults } from '~/components/find-student-accomodation/results/find-student-accomodation-results'
import { getAccommodations } from '~/server-only/get-accommodations'
import { DynamicBreadcrumb } from '~/components/ui/breadcrumb'

export default async function FindStudentAccommodationPage({ searchParams }: { searchParams: { bbox?: string; page?: string } }) {
  const t = await getTranslations('findAccomodation')
  const accommodations = await getAccommodations(searchParams)

  return (
    <div className={fr.cx('fr-container')}>
      <DynamicBreadcrumb />

      <h1>{t('title')}</h1>
      <FindStudentAccomodationHeader />

      <div className={styles.headerContainer}>
        <FindStudentAccomodationSortView initialData={accommodations} />
      </div>
      <FindStudentAccomodationResults initialData={accommodations} />
    </div>
  )
}
