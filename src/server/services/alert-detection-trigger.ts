import * as Sentry from '@sentry/nextjs'
import { detectAlertJobs } from './alert-detector'

// best effort
export async function triggerAlertDetection(accommodationIds: number[]): Promise<void> {
  if (accommodationIds.length === 0) return
  try {
    await detectAlertJobs({ accommodationIds })
  } catch (error) {
    console.error('[alert-detection] échec de la détection inline:', error)
    Sentry.captureException(error)
  }
}
