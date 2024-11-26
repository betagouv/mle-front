import Button from '@codegouvfr/react-dsfr/Button'
import Select from '@codegouvfr/react-dsfr/Select'
import { useTranslations } from 'next-intl'
import { FC } from 'react'
import styles from './find-student-accomodation-sort-view.module.css'

export const FindStudentAccomodationSortView: FC = () => {
  const t = useTranslations('findAccomodation.filters')
  return (
    <div className={styles.container}>
      <Select label="" nativeSelectProps={{}}>
        <option disabled hidden selected>
          {t('sortByPrice')}
        </option>
      </Select>
      <div>
        <Button iconId="ri-layout-grid-2-line" priority="secondary" style={{ borderRadius: '0.25rem' }}>
          {t('grid')}
        </Button>
        <Button iconId="ri-road-map-fill" priority="tertiary" style={{ borderRadius: '0.25rem' }}>
          {t('map')}
        </Button>
      </div>
    </div>
  )
}
