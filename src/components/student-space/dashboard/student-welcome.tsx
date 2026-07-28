import { useTranslations } from 'next-intl'
import { TUser } from '~/lib/types'

export const StudentWelcome = ({ user }: { user: TUser }) => {
  const t = useTranslations('student.welcome')

  return (
    <div className="fr-border-right fr-border-top fr-border-bottom fr-px-6w fr-py-5w">
      <h1>
        {t('greeting', { firstname: user.firstname })} <span aria-hidden="true">👋</span>
      </h1>
      <span className="fr-text--xl fr-text-mention--grey">{t('subtitle')}</span>
    </div>
  )
}
