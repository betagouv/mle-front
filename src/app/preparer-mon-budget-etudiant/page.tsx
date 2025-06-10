import { fr } from '@codegouvfr/react-dsfr'
import { getTranslations } from 'next-intl/server'
import { DynamicBreadcrumb } from '~/components/ui/breadcrumb'

import clsx from 'clsx'
import PrepareBudgetContent from '~/app/preparer-mon-budget-etudiant/components/prepare-budget-content'
import { PrepareBudgetSidemenu } from '~/app/preparer-mon-budget-etudiant/components/prepare-budget-sidemenu'
import styles from './preparer-mon-budget-etudiant.module.css'

export default async function PrepareBudgetPage() {
  const t = await getTranslations('prepareBudget')
  return (
    <div className={fr.cx('fr-container')}>
      <div>
        <DynamicBreadcrumb />
        <h1>{t('title')}</h1>
        <div className={clsx(styles.mainContainer, fr.cx('fr-col-12'))}>
          <PrepareBudgetSidemenu />
          <PrepareBudgetContent />
        </div>
      </div>
    </div>
  )
}
