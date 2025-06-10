import { fr } from '@codegouvfr/react-dsfr'
import { Table } from '@codegouvfr/react-dsfr/Table'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

export default async function PrepareBudgetAidsTable() {
  const t = await getTranslations('prepareBudget.content.item5.table')
  const data = ['row1', 'row2', 'row3', 'row4', 'row5', 'row6'].map((row) => [
    t(`${row}.column1`),
    t(`${row}.column2`),
    row !== 'row6' ? (
      <Link href="/" className={fr.cx('fr-link')} target="_blank">
        {t(`${row}.column3`)}
      </Link>
    ) : (
      t(`${row}.column3`)
    ),
  ])

  return (
    <Table
      noCaption
      data={data}
      fixed
      headers={[t('header.column1'), t('header.column2'), t('header.column3')]}
      style={{ border: '1px solid' }}
    />
  )
}
