import 'server-only'
import { cache } from 'react'
import type { TNearbyEtablissement } from '~/schemas/ramsese/etablissement-superieur'
import { NATURES_ETABLISSEMENTS } from '~/schemas/ramsese/natures'
import { getEtablissementsSuperieurByCodePostal } from '~/server/services/ramsese'
import { haversineMeters, parseRamseseCoordonnees } from '~/utils/geo'

type TGetNearbyEtablissementsParams = {
  codePostal: string
  lat: number
  lng: number
}

/**
 * Établissements d'enseignement supérieur (périmètre métier `NATURES_ETABLISSEMENTS`)
 * proches d'une résidence, triés par distance croissante. Retourne la liste **complète**
 * (le composant affiche les 5 premiers et déplie le reste). Renvoie `[]` si le code postal
 * est inconnu, si RAMSESE est muet, ou si aucun établissement n'est géolocalisé.
 *
 * Source : service RAMSESE (par code postal). Les coordonnées RAMSESE sont normalisées
 * en WGS84 puis la distance à la résidence est calculée par haversine.
 */
export const getNearbyEtablissements = cache(
  async ({ codePostal, lat, lng }: TGetNearbyEtablissementsParams): Promise<TNearbyEtablissement[]> => {
    if (!codePostal) return []

    const etablissements = await getEtablissementsSuperieurByCodePostal(codePostal, {
      natures: [...NATURES_ETABLISSEMENTS],
    })

    const residence = { lat, lng }

    return etablissements
      .flatMap((etab) => {
        if (!etab.coordonnees) return []
        const point = parseRamseseCoordonnees(etab.coordonnees)
        if (!point) return []

        const distanceMeters = haversineMeters(residence, point)
        return [
          {
            numeroUai: etab.numeroUai,
            denomination: etab.denomination,
            sigle: etab.sigle,
            distanceMeters,
            distanceKm: distanceMeters / 1000,
          } satisfies TNearbyEtablissement,
        ]
      })
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
  },
)
