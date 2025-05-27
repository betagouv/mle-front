import Button, { ButtonProps } from '@codegouvfr/react-dsfr/Button'
import clsx from 'clsx'
import { JSX } from 'react'
import { toast } from 'react-hot-toast'
import styles from './toaster.module.css'

export type ToastPriority = 'info' | 'warning' | 'error' | 'success'

const icons: { [key in ToastPriority]: string } = {
  info: 'fr-icon-info-fill',
  warning: 'fr-icon-warning-fill',
  error: 'fr-icon-error-fill',
  success: 'fr-icon-checkbox-circle-fill',
}

export const createToast = ({
  priority,
  message,
  action,
  duration,
}: {
  priority: ToastPriority
  message: JSX.Element | string | null
  action?: ButtonProps
  duration?: number
}) => {
  toast(
    action ? (
      <div className={clsx(styles.toastContent, 'fr-no-print')}>
        <span>{message}</span>
        <Button className={clsx('fr-ml-1w', styles.action)} priority="tertiary no outline" size="small" {...action} />
      </div>
    ) : (
      <span className={clsx(styles.toastContent, 'fr-no-print')}>{message}</span>
    ),
    {
      duration,
      className: clsx(styles.toast, styles[priority]),
      icon: <span className={clsx(styles.icon, icons[priority])} />,
    },
  )
}
