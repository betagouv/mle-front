import { fr } from '@codegouvfr/react-dsfr'
import { getTranslations } from 'next-intl/server'
import { DynamicBreadcrumb } from '~/components/ui/breadcrumb'
import { getCityDetails } from '~/server-only/get-city-details'
import PrepareStudentLifeSummary from '~/components/prepare-student-life/summary/prepare-student-life-summary'
import PrepareStudentLifeStats from '~/components/prepare-student-life/stats/prepare-student-life-stats'
import PrepareStudentLifeNearbyAccommodations from '~/components/prepare-student-life/nearby/prepare-student-life-nearby-accommodations'

export default async function PrepareStudentLifeCityPage({ params }: { params: { location: string } }) {
  const t = await getTranslations('prepareStudentLife')
  const { location } = params
  const cityDetails = await getCityDetails(location)
  const { average_rent, bbox, name, nb_apartments } = cityDetails

  return (
    <div>
      <div className={fr.cx('fr-container')}>
        <DynamicBreadcrumb title={location} />
        <h1>{t('title', { title: name })}</h1>
      </div>
      <PrepareStudentLifeSummary {...cityDetails} location={location} />
      <PrepareStudentLifeStats average_rent={average_rent} location={location} nb_apartments={nb_apartments} />
      <PrepareStudentLifeNearbyAccommodations location={location} bbox={bbox} name={name} />
    </div>
  )
}
