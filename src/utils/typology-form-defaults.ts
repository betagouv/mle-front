import { TTypologiesRecord } from '~/schemas/accommodations/accommodations'
import { TYPOLOGIES } from '~/schemas/accommodations/typology'
import { TUpdateResidence } from '~/schemas/accommodations/update-residence'

export type TTypologyFormValues = NonNullable<TUpdateResidence['typologies']>[number]

/**
 * Convertit l'objet `typologies` indexé par type (modèle de lecture) en tableau de valeurs
 * par défaut pour react-hook-form (modèle de saisie).
 *
 * Invariants — chacun couvert par typology-form-defaults.test.ts :
 * - un NULL en base devient `undefined`, jamais 0 : le champ s'affiche vide et les bornes de
 *   ZTypology ne se déclenchent pas sur une donnée absente ;
 * - un 0 stocké reste 0 (`??` et non `||`) : « renseigné à 0 » ≠ « inconnu » ;
 * - seules les typologies présentes dans l'objet sont retournées, dans l'ordre de TYPOLOGIES.
 */
export function typologyFormDefaults(typologies: TTypologiesRecord): TTypologyFormValues[] {
  return TYPOLOGIES.filter(({ type }) => !!typologies[type]).map(({ type }) => {
    const v = typologies[type]!
    return {
      type,
      priceMin: v.priceMin ?? undefined,
      priceMax: v.priceMax ?? undefined,
      superficieMin: v.superficieMin ?? undefined,
      superficieMax: v.superficieMax ?? undefined,
      nbTotal: v.nbTotal ?? undefined,
      nbAvailable: v.nbAvailable ?? undefined,
      colocation: v.colocation,
    }
  })
}
