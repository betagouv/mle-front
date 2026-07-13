'use client'

import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useUpdateNotificationPreferences } from '~/hooks/use-update-notification-preferences'

type NotificationSettingsProps = {
  initialSimilarAlert: boolean
  initialFavoriteAlert: boolean
}

export const NotificationSettings = ({ initialSimilarAlert, initialFavoriteAlert }: NotificationSettingsProps) => {
  const t = useTranslations('student.personalInformations.notifications')
  const [similarAlert, setSimilarAlert] = useState(initialSimilarAlert)
  const [favoriteAlert, setFavoriteAlert] = useState(initialFavoriteAlert)
  const { mutate } = useUpdateNotificationPreferences()

  const handleSimilarAlertChange = (checked: boolean) => {
    setSimilarAlert(checked)
    mutate({ similarAccommodationAlertsEnabled: checked })
  }

  const handleFavoriteAlertChange = (checked: boolean) => {
    setFavoriteAlert(checked)
    mutate({ favoriteAlertsEnabled: checked })
  }

  return (
    <div className="fr-flex fr-direction-column fr-flex-gap-6v">
      <ToggleSwitch
        label={t('similarAlert')}
        inputTitle="notif-similar-alert"
        checked={similarAlert}
        onChange={handleSimilarAlertChange}
        showCheckedHint={false}
        labelPosition="left"
      />
      <ToggleSwitch
        label={t('favoriteAlert')}
        inputTitle="notif-favorite-alert"
        checked={favoriteAlert}
        onChange={handleFavoriteAlertChange}
        showCheckedHint={false}
        labelPosition="left"
      />
    </div>
  )
}
