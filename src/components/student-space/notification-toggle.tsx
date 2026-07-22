'use client'

import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useUpdateNotificationPreferences } from '~/hooks/use-update-notification-preferences'

type NotificationPreference = 'similarAccommodationAlertsEnabled' | 'favoriteAlertsEnabled'

type NotificationToggleProps = {
  email: string
  initialChecked: boolean
  preference: NotificationPreference
  translationNamespace: 'student.alerts' | 'student.favorites'
  inputTitle: string
}

export const NotificationToggle = ({ email, initialChecked, preference, translationNamespace, inputTitle }: NotificationToggleProps) => {
  const t = useTranslations(translationNamespace)
  const [checked, setChecked] = useState(initialChecked)
  const { mutate } = useUpdateNotificationPreferences()

  const handleChange = (newValue: boolean) => {
    setChecked(newValue)
    mutate({ [preference]: newValue })
  }

  return (
    <div className="fr-flex fr-direction-column fr-flex-gap-0.5v fr-mt-8v">
      <ToggleSwitch
        label={t('notificationToggle')}
        inputTitle={inputTitle}
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
