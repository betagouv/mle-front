import { fr } from '@codegouvfr/react-dsfr'
import { Table } from '@codegouvfr/react-dsfr/Table'
import clsx from 'clsx'
import { getTranslations } from 'next-intl/server'
import { DynamicBreadcrumb } from '~/components/ui/breadcrumb'
import styles from './budget.module.css'

export default async function BudgetPage() {
  const t = await getTranslations('budget')
  return (
    <div className={fr.cx('fr-container')}>
      <DynamicBreadcrumb />
      <div className={fr.cx('fr-container')}>
        <h1>{t('title')}</h1>
        <p>
          {t('lastUpdate')} <span className={fr.cx('fr-text--bold')}>19/05/25</span>
        </p>
        <div className={clsx(fr.cx('fr-p-4w'), styles.mainContainer)}>
          <p className={clsx(fr.cx('fr-text--bold'), styles.description)}>{t('description')}</p>
          <p>{t('description2')}</p>
          <hr />
          <h2>{t('repartition')}</h2>
          <div>
            <Table
              fixed
              noCaption
              caption={t('repartition')}
              data={[
                [t('table.coaching'), '16 128€', '33 984 €'],
                [t('table.development'), '0 €', '55 062 €'],
                [t('table.design'), '0 €', '27 463 €'],
                [t('table.deployment'), '0 €', '24 077 €'],
                [t('table.total'), '16 128 €', '140 586 €'],
              ]}
              headers={['', t('investigationDate'), t('constructionDate')]}
              className={styles.boldTable}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
