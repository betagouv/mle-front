import * as Sentry from '@sentry/nextjs'

// Initialisation de Sentry à la demande dans la CLI.
let initialized = false

function ensureInit() {
  if (initialized) return
  Sentry.init({
    dsn: 'https://b92507bef9f540985af4fb41e2b4d42a@sentry.incubateur.net/269',
    tracesSampleRate: 0,
  })
  initialized = true
}

/**
 * Capture une exception depuis une commande CLI puis vide le buffer Sentry : le process se
 * termine aussitôt après, donc sans `flush` l'événement serait perdu. N'émet jamais d'erreur
 * propre (on ne masque pas l'erreur d'origine à cause d'un souci de reporting).
 */
export async function captureCliException(error: unknown): Promise<void> {
  try {
    ensureInit()
    Sentry.captureException(error)
    await Sentry.flush(2000)
  } catch {
    // ignore
  }
}
