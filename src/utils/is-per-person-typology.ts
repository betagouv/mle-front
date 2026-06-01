const PER_PERSON_TYPOLOGIES = new Set(['t3', 't4', 't5', 't6', 't7_more'])

export function isPerPersonTypology(typology?: string) {
  return !!typology && PER_PERSON_TYPOLOGIES.has(typology)
}
