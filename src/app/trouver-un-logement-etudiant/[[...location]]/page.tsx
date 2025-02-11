export const dynamic = 'force-dynamic'

import { fr } from '@codegouvfr/react-dsfr'
import { getTranslations } from 'next-intl/server'
import { FindStudentAccomodationSortView } from '~/components/find-student-accomodation/sort-view/find-student-accomodation-sort-view'
import styles from './find-student-accomodation-page.module.css'
import { FindStudentAccomodationResults } from '~/components/find-student-accomodation/results/find-student-accomodation-results'
import { Accordion } from '@codegouvfr/react-dsfr/Accordion'
import { getAccommodations } from '~/server-only/get-accommodations'
import Button from '@codegouvfr/react-dsfr/Button'
import { getTerritories } from '~/server-only/get-territories'
import { TTerritories } from '~/schemas/territories'
import { DynamicBreadcrumb } from '~/components/ui/breadcrumb'
import { FindStudentAccomodationHeader } from '~/components/find-student-accomodation/header/find-student-accomodation-header'
import { redirect } from 'next/navigation'
import { getTerritoryQuestionsAnswers } from '~/server-only/get-territory-questions-answers'
import clsx from 'clsx'

const getTerritoriesCategoryKey = (categoryKey: 'ville' | 'academie' | 'departement') => {
  const keys = {
    academie: 'academies',
    departement: 'departments',
    ville: 'cities',
  }
  return keys[categoryKey] as keyof TTerritories
}

const getQACategoryKey = (categoryKey: 'ville' | 'academie' | 'departement') => {
  const keys = {
    academie: 'academy',
    departement: 'department',
    ville: 'city',
  }
  return keys[categoryKey]
}

export default async function FindStudentAccommodationPage({
  params,
  searchParams,
}: {
  params: { location: string }
  searchParams: { accessible: string; bbox?: string; content_type?: string; hasColiving?: string; object_id?: string; page?: string }
}) {
  const t = await getTranslations('findAccomodation')
  const routeCategoryKey = params?.location?.[0] || ''
  const routeLocation = params?.location?.[1] || ''

  if (params && (params?.location?.length < 2 || params?.location?.length > 2)) {
    redirect(`/trouver-un-logement-etudiant?vue=carte`)
  }

  const territories = await getTerritories(routeLocation)
  const territory = (territories[getTerritoriesCategoryKey(routeCategoryKey as 'ville' | 'academie' | 'departement')] || []).find(
    (territory) => territory.name === routeLocation,
  )
  if (routeCategoryKey && routeLocation && !territory) {
    redirect(`/trouver-un-logement-etudiant?vue=carte`)
  }

  const territoryBbox = territory?.bbox
    ? `${territory.bbox.xmin},${territory.bbox.ymin},${territory.bbox.xmax},${territory.bbox.ymax}`
    : undefined
  const accommodations = await getAccommodations({ ...searchParams, bbox: territoryBbox })
  const qa = await getTerritoryQuestionsAnswers({
    content_type: getQACategoryKey(routeCategoryKey as 'ville' | 'academie' | 'departement'),
    object_id: territory?.id,
  })

  const title = territory?.name ? t('titleWithLocation', { location: territory?.name }) : t('title')
  return (
    <>
      <div className={fr.cx('fr-container')}>
        <DynamicBreadcrumb />

        <h1>{title}</h1>
        <FindStudentAccomodationHeader />
        <FindStudentAccomodationSortView data={accommodations} territory={territory} />
        <FindStudentAccomodationResults data={accommodations} territory={territory} />
        <div className={clsx(styles.mainQaFaqContainer, 'primaryBackgroundColor')}>
          <div className={fr.cx('fr-container')}>
            <div className={styles.faqQaContainer}>
              <div className={styles.faqTitleCtaContainer}>
                <h2 className={styles.whiteColor}>{t('faq.title')}</h2>
                <Button iconId="ri-question-line" className={styles.whiteButton} priority="secondary">
                  {t('faq.cta')}
                </Button>
              </div>
              <div className={styles.qaContainer}>
                <div style={{ background: 'white', padding: '2rem' }} className={fr.cx('fr-accordions-group')}>
                  {qa.map((qa, index) => (
                    <Accordion key={index} label={qa.title_fr}>
                      <div dangerouslySetInnerHTML={{ __html: qa.content_fr }} />
                    </Accordion>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
