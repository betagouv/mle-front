import Alert from '@codegouvfr/react-dsfr/Alert'
import { getTranslations } from 'next-intl/server'
import { NewWindowHint } from '~/components/ui/new-window'

const STUDENT_SERVICES_URL = 'https://messervices.etudiant.gouv.fr'

export const AlertSection = async () => {
  const tHome = await getTranslations('home')
  return (
    <section className="fr-container fr-mb-md-4w">
      <Alert
        severity="info"
        as="h2"
        title={
          tHome.rich('alert.title', {
            underline: (chunks) => (
              <a href={STUDENT_SERVICES_URL} target="_blank" rel="noopener noreferrer" className="fr-link fr-text--xl">
                {chunks}
                <NewWindowHint />
              </a>
            ),
          }) as string
        }
        description={tHome('alert.description')}
        classes={{ root: 'fr-background-default--grey' }}
      />
    </section>
  )
}
