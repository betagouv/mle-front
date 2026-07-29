import { DAY_MS } from '~/utils/time'

export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const targetDate = typeof date === 'string' ? new Date(date) : date
  const diffInMs = now.getTime() - targetDate.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / DAY_MS)
  const diffInMonths = Math.floor(diffInMs / (DAY_MS * 30))
  const diffInYears = Math.floor(diffInMs / (DAY_MS * 365))

  if (diffInMinutes < 1) {
    return "il y a moins d'une minute"
  } else if (diffInMinutes < 60) {
    return `il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`
  } else if (diffInHours < 24) {
    return `il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`
  } else if (diffInDays < 30) {
    return `il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`
  } else if (diffInMonths < 12) {
    return `il y a ${diffInMonths} mois`
  } else {
    return `il y a ${diffInYears} an${diffInYears > 1 ? 's' : ''}`
  }
}
