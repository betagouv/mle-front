import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { StudentInformations } from '~/components/student-space/dashboard/student-informations'
import { StudentMaximizeChances } from '~/components/student-space/dashboard/student-maximize-chances'
import { StudentSummary } from '~/components/student-space/dashboard/student-summary'
import { StudentWelcome } from '~/components/student-space/dashboard/student-welcome'
import { getServerSession } from '~/services/better-auth'
import styles from '../mon-espace.module.css'

export const generateMetadata = async () => {
  const t = await getTranslations('breadcrumbs.student')
  return { title: t('dashboard.title') }
}

export default async function StudentDashboardPage() {
  const auth = await getServerSession()

  if (!auth || !auth.user) {
    return notFound()
  }

  const { user } = auth

  return (
    <>
      <StudentWelcome user={user} />
      <div className={styles.summaryContainer}>
        <StudentSummary />
        <StudentMaximizeChances />
        <StudentInformations />
      </div>
    </>
  )
}
