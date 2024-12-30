import { getTranslations } from 'next-intl/server'

export default async function PrepareStudentLifeCityPage() {
  const t = await getTranslations('prepareStudentLife')
  return <div>{t('titlePart1')}</div>
}
