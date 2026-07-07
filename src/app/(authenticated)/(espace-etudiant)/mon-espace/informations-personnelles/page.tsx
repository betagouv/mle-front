import clsx from 'clsx'
import { notFound } from 'next/navigation'
import { NotificationSettings } from '~/components/student-space/informations/notification-settings'
import { StudentProfileForm } from '~/components/student-space/informations/student-profile-form'
import { getStudentProfile } from '~/server/student/get-profile'
import styles from '../mon-espace.module.css'

export default async function StudentPersonalInformationsPage() {
  const profile = await getStudentProfile()
  if (!profile) return notFound()

  return (
    <>
      <div className="fr-border-right fr-border-top fr-border-bottom fr-px-6w fr-py-5w">
        <h1>Informations personnelles</h1>
        <span className="fr-text--xl fr-text-mention--grey">Suivez vos résidences coup de cœur et tenez à jour vos candidatures</span>
      </div>
      <div className={clsx(styles.summaryContainer, 'fr-px-6w fr-py-5w fr-flex fr-direction-column fr-flex-gap-8v')}>
        <StudentProfileForm
          initialValues={{
            firstname: profile.firstname,
            lastname: profile.lastname,
            email: profile.email,
            phone: profile.phone,
            birthdate: profile.birthdate,
            scholarshipStatus: profile.scholarshipStatus,
          }}
        />
        <div className="fr-border-top fr-pt-5w">
          <h2 className="fr-h4">Paramètres des notifications</h2>
          <NotificationSettings
            initialNotifSimilarAlert={profile.notifSimilarAlert}
            initialNotifFavoriteAlert={profile.notifFavoriteAlert}
          />
        </div>
      </div>
    </>
  )
}
