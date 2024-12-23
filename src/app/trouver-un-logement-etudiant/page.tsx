import { fr } from '@codegouvfr/react-dsfr'
import { getTranslations } from 'next-intl/server'
import { FindStudentAccomodationHeader } from '~/components/find-student-accomodation/header/find-student-accomodation-header'
import { FindStudentAccomodationSortView } from '~/components/find-student-accomodation/sort-view/find-student-accomodation-sort-view'
import styles from './find-student-accomodation-page.module.css'
import { FindStudentAccomodationResults } from '~/components/find-student-accomodation/results/find-student-accomodation-results'
import { Accordion } from '@codegouvfr/react-dsfr/Accordion'
import { getAccommodations } from '~/server-only/get-accommodations'
import { DynamicBreadcrumb } from '~/components/ui/breadcrumb'
import Button from '@codegouvfr/react-dsfr/Button'
import { getQuestionsAnswers } from '~/server-only/get-questions-answers'

export default async function FindStudentAccommodationPage({
  searchParams,
}: {
  searchParams: { accessible: string; bbox?: string; page?: string }
}) {
  const t = await getTranslations('findAccomodation')
  const accommodations = await getAccommodations(searchParams)
  const qa = await getQuestionsAnswers()

  return (
    <>
      <div className={fr.cx('fr-container')}>
        <DynamicBreadcrumb />

        <h1>{t('title')}</h1>
        <FindStudentAccomodationHeader />

        <div className={styles.headerContainer}>
          <FindStudentAccomodationSortView initialData={accommodations} />
        </div>
        <FindStudentAccomodationResults initialData={accommodations} />
      </div>
      <div className={styles.mainQaFaqContainer}>
        <div className={fr.cx('fr-container')}>
          <div className={styles.faqQaContainer}>
            <div className={styles.faqTitleCtaContainer}>
              <h2 className={styles.whiteColor}>{t('faq.title')}</h2>
              <Button iconId="ri-question-line" style={{ boxShadow: 'inset 0 0 0 1px white', color: 'white' }} priority="secondary">
                {t('faq.cta')}
              </Button>
            </div>
            <div className={styles.qaContainer}>
              <div style={{ background: 'white', padding: '2rem' }} className={fr.cx('fr-accordions-group')}>
                {qa.map((qa, index) => (
                  <Accordion key={index} label={qa.title_fr}>
                    {qa.content_fr}
                  </Accordion>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
