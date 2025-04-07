'use client'
import { Select } from '@codegouvfr/react-dsfr/Select'
import { useTranslations } from 'next-intl'
import { parseAsString, useQueryState } from 'nuqs'
import { FC } from 'react'
import { TDepartment } from '~/schemas/departments'

export const PrepareStudentLifeSelectDepartment: FC<{ departments: TDepartment[] }> = ({ departments }) => {
  const t = useTranslations('prepareStudentLife')
  const [department, setDepartment] = useQueryState('department', parseAsString)

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === 'Tous') {
      setDepartment(null)
    } else {
      setDepartment(e.target.value)
    }
  }

  return (
    <Select
      style={{ flex: '1', margin: 0 }}
      label={t('department')}
      nativeSelectProps={{
        onChange: handleSelect,
        value: department || '',
      }}
    >
      <option value="Tous">Tous</option>
      {departments.map((department) => (
        <option key={department.id} value={department.code}>
          {department.name}
        </option>
      ))}
    </Select>
  )
}
