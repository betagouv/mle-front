'use client'

import Input from '@codegouvfr/react-dsfr/Input'
import { RadioButtons } from '@codegouvfr/react-dsfr/RadioButtons'
import Select from '@codegouvfr/react-dsfr/Select'
import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch'
import { useTranslations } from 'next-intl'
import { Controller, useFormContext } from 'react-hook-form'
import { EResidenceType, RESIDENCE_TYPE_LABELS } from '~/enums/residence-type'
import { ETargetAudience } from '~/enums/target-audience'
import { TUpdateResidence } from '~/schemas/accommodations/update-residence'
import styles from './residence-details.module.css'

export const ResidenceDetails = () => {
  const {
    register,
    formState: { errors },
    control,
  } = useFormContext<TUpdateResidence>()
  const t = useTranslations('bailleur.residences.details')
  return (
    <div className="fr-border-bottom">
      <div className="fr-p-2w fr-p-md-6w">
        <h3>{t('title')}</h3>
        <div className="fr-flex fr-direction-column fr-flex-gap-6v">
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-12 fr-col-md-6">
              <Input
                classes={{ message: 'fr-flex-gap-2v' }}
                label={
                  <>
                    {t('accommodationName')} <span className="fr-text-default--error">*</span>{' '}
                  </>
                }
                nativeInputProps={register('name')}
                state={errors.name ? 'error' : 'info'}
                stateRelatedMessage={
                  errors.name?.message ?? "Le terme « Résidence » n'est conservé que s'il est suivi d'un article ; sinon, il est supprimé."
                }
              />
            </div>
            <div className="fr-col-12 fr-col-md-6">
              <Select
                label={
                  <>
                    {t('accommodationType')} <span className="fr-text-default--error">*</span>
                  </>
                }
                nativeSelectProps={{
                  ...register('residence_type'),
                }}
                state={errors.residence_type ? 'error' : 'default'}
                stateRelatedMessage={errors.residence_type?.message}
              >
                <option value="" disabled hidden>
                  Sélectionnez un type
                </option>
                {Object.values(EResidenceType).map((value) => (
                  <option key={value} value={value}>
                    {RESIDENCE_TYPE_LABELS[value]}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className={styles.radioGrid}>
            <RadioButtons
              legend={
                <>
                  {t('targetAudience')} <span className="fr-text-default--error">*</span>
                </>
              }
              name="target_audience"
              state={errors.target_audience ? 'error' : undefined}
              stateRelatedMessage={errors.target_audience?.message}
              className="fr-mb-0"
              classes={{
                inputGroup: 'fr-my-0 fr-border fr-p-1w',
              }}
              options={[
                {
                  label: 'Résidence exclusivement étudiante',
                  hintText: 'Étudiants y compris stagiaires, alternants et étudiants salariés.',
                  nativeInputProps: {
                    ...register('target_audience'),
                    value: ETargetAudience.ETUDIANTS,
                  },
                },
                {
                  label: 'Résidence pour étudiants et jeunes actifs',
                  hintText: 'Étudiants, alternants, stagiaires et jeunes salariés.',
                  nativeInputProps: {
                    ...register('target_audience'),
                    value: ETargetAudience.MIXTE,
                  },
                },
                {
                  label: t('targetAudienceDiffusEtudiantsLabel'),
                  hintText: t('targetAudienceDiffusEtudiantsHint'),
                  nativeInputProps: {
                    ...register('target_audience'),
                    value: ETargetAudience.DIFFUS_ETUDIANTS,
                  },
                },
                {
                  label: t('targetAudienceDiffusMixteLabel'),
                  hintText: t('targetAudienceDiffusMixteHint'),
                  nativeInputProps: {
                    ...register('target_audience'),
                    value: ETargetAudience.DIFFUS_MIXTE,
                  },
                },
              ]}
            />
          </div>

          <div>
            <div className="fr-py-2w fr-flex fr-justify-content-space-between fr-align-items-center fr-border-bottom">
              <span>{t('waitingList')}</span>
              <Controller
                name="accept_waiting_list"
                control={control}
                render={({ field }) => (
                  <ToggleSwitch
                    inputTitle="accept_waiting_list"
                    label=""
                    showCheckedHint={false}
                    checked={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            <div className="fr-py-2w fr-flex fr-justify-content-space-between fr-align-items-center fr-border-bottom">
              <span>{t('scholarship')}</span>
              <Controller
                name="scholarship_holders_priority"
                control={control}
                render={({ field }) => (
                  <ToggleSwitch inputTitle="" label="" showCheckedHint={false} checked={field.value} onChange={field.onChange} />
                )}
              />
            </div>
            <div className="fr-py-2w fr-flex fr-justify-content-space-between fr-align-items-center fr-border-bottom">
              <span>{t('socialHousing')}</span>
              <Controller
                name="social_housing_required"
                control={control}
                render={({ field }) => (
                  <ToggleSwitch inputTitle="" label="" showCheckedHint={false} checked={field.value} onChange={field.onChange} />
                )}
              />
            </div>
            <div className="fr-py-1w fr-flex fr-justify-content-space-between fr-align-items-center fr-border-bottom">
              <span>{t('accessible')}</span>
              <Input
                hideLabel
                label={t('accessible')}
                style={{ width: '74px' }}
                className="fr-mr-4w"
                nativeInputProps={{
                  ...register('nb_accessible_apartments', { valueAsNumber: true }),
                  type: 'number',
                  min: 0,
                }}
              />
            </div>
            <div className="fr-py-1w fr-flex fr-justify-content-space-between fr-align-items-center">
              <span>{t('coliving')}</span>
              <Input
                hideLabel
                label={t('coliving')}
                style={{ width: '74px' }}
                className="fr-mr-4w"
                nativeInputProps={{
                  ...register('nb_coliving_apartments', { valueAsNumber: true }),
                  type: 'number',
                  min: 0,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
