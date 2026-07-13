import { type HelpSimulatorFormData, helpSimulatorSchema } from '~/components/helps-simulator/help-simulator-schema'

/**
 * Clé localStorage utilisée pour mémoriser la simulation d'un utilisateur non connecté
 * le temps qu'il crée son compte, puis la sauvegarder automatiquement une fois connecté.
 */
export const PENDING_AID_SIMULATION_KEY = 'mle-pending-aid-simulation'

export function storePendingAidSimulation(inputs: HelpSimulatorFormData): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(PENDING_AID_SIMULATION_KEY, JSON.stringify(inputs))
  } catch {
    // Stockage indisponible (mode privé, quota) — on ignore silencieusement.
  }
}

export function readPendingAidSimulation(): HelpSimulatorFormData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(PENDING_AID_SIMULATION_KEY)
    if (!raw) return null
    const parsed = helpSimulatorSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export function clearPendingAidSimulation(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(PENDING_AID_SIMULATION_KEY)
  } catch {
    // ignore
  }
}
