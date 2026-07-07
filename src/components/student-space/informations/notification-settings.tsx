'use client'

import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch'
import { useState } from 'react'
import { useUpdateNotificationPreferences } from '~/hooks/use-update-notification-preferences'

type NotificationSettingsProps = {
  initialNotifSimilarAlert: boolean
  initialNotifFavoriteAlert: boolean
}

export const NotificationSettings = ({ initialNotifSimilarAlert, initialNotifFavoriteAlert }: NotificationSettingsProps) => {
  const [notifSimilarAlert, setNotifSimilarAlert] = useState(initialNotifSimilarAlert)
  const [notifFavoriteAlert, setNotifFavoriteAlert] = useState(initialNotifFavoriteAlert)
  const { mutate } = useUpdateNotificationPreferences()

  const handleSimilarAlertChange = (checked: boolean) => {
    setNotifSimilarAlert(checked)
    mutate({ notifSimilarAlert: checked })
  }

  const handleFavoriteAlertChange = (checked: boolean) => {
    setNotifFavoriteAlert(checked)
    mutate({ notifFavoriteAlert: checked })
  }

  return (
    <div className="fr-flex fr-direction-column fr-flex-gap-6v">
      <ToggleSwitch
        label="Je souhaite recevoir des offres de logement similaires à mes alertes"
        inputTitle="notif-similar-alert"
        checked={notifSimilarAlert}
        onChange={handleSimilarAlertChange}
        showCheckedHint={false}
        labelPosition="left"
      />
      <ToggleSwitch
        label="Je souhaite des alertes de disponibilité dans une résidence ajoutée à mes favoris"
        inputTitle="notif-favorite-alert"
        checked={notifFavoriteAlert}
        onChange={handleFavoriteAlertChange}
        showCheckedHint={false}
        labelPosition="left"
      />
    </div>
  )
}
