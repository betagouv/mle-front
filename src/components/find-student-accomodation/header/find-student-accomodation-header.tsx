import { Range } from '@codegouvfr/react-dsfr/Range'
import { FC } from 'react'
import { Button } from '@codegouvfr/react-dsfr/Button'
import styles from './find-student-accomodation-header.module.css'
import { FindStudentAccomodationAutocompleteInput } from '~/components/find-student-accomodation/autocomplete/find-student-accomodation-autocomplete-input'
import { getTranslations } from 'next-intl/server'
import { FindStudentAccessibleAccomodationSwitch } from '~/components/find-student-accomodation/header/find-student-accessible-accomodation-switch'
import { fr } from '@codegouvfr/react-dsfr'
import { FindStudentColivingAccomodationSwitch } from '~/components/find-student-accomodation/header/find-student-coliving-accomodation'

export const FindStudentAccomodationHeader: FC = async () => {
  const t = await getTranslations('findAccomodation')

  return (
    <>
      <div className={fr.cx('fr-hidden', 'fr-unhidden-sm')}>
        <div className={styles.container}>
          <FindStudentAccomodationAutocompleteInput />

          <Range label={t('header.rangeLabel')} max={1000} min={350} hideMinMax step={50} />
          <FindStudentColivingAccomodationSwitch />
          <FindStudentAccessibleAccomodationSwitch />
          <Button priority="secondary" iconId="ri-equalizer-line">
            {t('header.filtersCta')}
          </Button>
        </div>
      </div>
      <div className={fr.cx('fr-hidden-sm')}>
        <div className={styles.mobileContainer}>
          <FindStudentAccomodationAutocompleteInput />
          <Button priority="secondary" iconId="ri-equalizer-line" title={t('header.filtersCta')} />
        </div>
      </div>
    </>
  )
}
