'use client'

import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useUpdateNotificationPreferences } from '~/hooks/use-update-notification-preferences'

type StudentAlertsNotificationToggleProps = {
  email: string
  initialChecked: boolean
}

export const StudentAlertsNotificationToggle = ({ email, initialChecked }: StudentAlertsNotificationToggleProps) => {
  const t = useTranslations('student.alerts')
  const [checked, setChecked] = useState(initialChecked)
  const { mutate } = useUpdateNotificationPreferences()

  const handleChange = (newValue: boolean) => {
    setChecked(newValue)
    mutate({ similarAccommodationAlertsEnabled: newValue })
  }

  return (
    <div className="fr-flex fr-direction-column fr-flex-gap-0.5v fr-mt-8v">
      <ToggleSwitch
        label={t('notificationToggle')}
        inputTitle="notif-similar-alert"
        checked={checked}
        onChange={handleChange}
        showCheckedHint={false}
        labelPosition="left"
      />
      <span className="fr-text--sm fr-text-mention--grey">
        {t('notificationEmailPrefix')} <strong>{email}</strong>
      </span>
    </div>
  )
}
