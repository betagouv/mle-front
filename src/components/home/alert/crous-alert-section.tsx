import Alert from '@codegouvfr/react-dsfr/Alert'
import { getTranslations } from 'next-intl/server'
import { NewWindowHint } from '~/components/ui/new-window'

const CROUS_HOUSING_URL = 'https://trouverunlogement.lescrous.fr/'

export const CrousAlertSection = async () => {
  const tHome = await getTranslations('home')

  const linkRenderer = (chunks: React.ReactNode) => (
    <a href={CROUS_HOUSING_URL} target="_blank" rel="noopener noreferrer" className="fr-link fr-text--xl">
      {chunks}
      <NewWindowHint />
    </a>
  )

  return (
    <section className="fr-container fr-mb-md-4w">
      <Alert
        severity="info"
        as="h2"
        title={tHome.rich('crousAlert.title', { link: linkRenderer }) as string}
        description={tHome.rich('crousAlert.description', { link: linkRenderer }) as string}
        classes={{ root: 'fr-background-default--grey' }}
      />
    </section>
  )
}
