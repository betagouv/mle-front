import { visible } from '../dom'
import { conforming, notApplicable, type TAnalyzer } from './contract'

/**
 * Familles de critères qui ne s'appliquent qu'en présence d'un type d'objet.
 * Quand l'objet est absent du DOM, « Non applicable » est une conclusion complète et
 * vérifiable. Quand il est présent, l'analyseur ne conclut pas : il renseigne le constat
 * et laisse le critère « À vérifier manuellement ».
 *
 * Ces règles ne s'appliquent jamais à un critère verrouillé par un angle mort
 * (widget rendu côté client) : la fusion s'en charge en amont.
 */
type TObjectFamily = {
  criteria: string[]
  selector: string
  singular: string
  plural: string
}

const MEDIA_SELECTOR =
  'video, audio, object[type^="video"], object[type^="audio"], embed, ' +
  'iframe[src*="youtube"], iframe[src*="youtu.be"], iframe[src*="vimeo"], iframe[src*="dailymotion"], iframe[src*="soundcloud"]'

const FIELD_SELECTOR = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), select, textarea'

const IMAGE_SELECTOR = 'img, svg, area, input[type="image"], [role="img"], object[type^="image"]'

const OFFICE_DOCUMENT_SELECTOR =
  'a[href$=".pdf"], a[href$=".doc"], a[href$=".docx"], a[href$=".xls"], a[href$=".xlsx"], a[href$=".ppt"], a[href$=".pptx"], a[href$=".odt"], a[href$=".ods"]'

const FAMILIES: TObjectFamily[] = [
  {
    // Toute la thématique 4 dépend de la présence d'un média temporel.
    criteria: ['4.1', '4.2', '4.3', '4.4', '4.5', '4.6', '4.7', '4.8', '4.9', '4.10', '4.11', '4.12', '4.13'],
    selector: MEDIA_SELECTOR,
    singular: 'média temporel (vidéo, son, média embarqué)',
    plural: 'médias temporels',
  },
  {
    // 5.4 à 5.8 ont leurs propres analyseurs ; ces quatre-là relèvent du jugement.
    criteria: ['5.1', '5.2', '5.3', '5.5'],
    selector: 'table',
    singular: 'tableau',
    plural: 'tableaux',
  },
  {
    criteria: ['11.2', '11.3', '11.4', '11.11', '11.12'],
    selector: FIELD_SELECTOR,
    singular: 'champ de formulaire',
    plural: 'champs de formulaire',
  },
  {
    // 11.7 porte sur la pertinence des légendes : sans regroupement, il ne s'applique pas.
    criteria: ['11.7'],
    selector: 'fieldset',
    singular: 'regroupement de champs (<fieldset>)',
    plural: 'regroupements de champs',
  },
  {
    // 11.9 porte sur l'intitulé des boutons, pas sur les champs de saisie.
    criteria: ['11.9'],
    selector: 'button, input[type="submit"], input[type="button"], input[type="reset"], [role="button"]',
    singular: 'bouton',
    plural: 'boutons',
  },
  {
    criteria: ['1.3', '1.4', '1.5', '1.6', '1.7', '1.8', '1.9'],
    selector: IMAGE_SELECTOR,
    singular: 'image',
    plural: 'images',
  },
  {
    criteria: ['13.4'],
    selector: OFFICE_DOCUMENT_SELECTOR,
    singular: 'document bureautique en téléchargement',
    plural: 'documents bureautiques en téléchargement',
  },
]

export const NOT_APPLICABLE_ANALYZERS: TAnalyzer[] = FAMILIES.flatMap((family) =>
  family.criteria.map<TAnalyzer>((criterion) => ({
    criterion,
    // Ces règles ne peuvent que constater une absence : elles n'absolvent jamais.
    coversAllTests: false,
    analyze: ({ $ }) => {
      const objects = visible($, family.selector)
      if (objects.length === 0) return notApplicable(`Aucun ${family.singular} dans le DOM de la page`)
      return conforming(`${objects.length} ${family.plural} présent(s) : ce critère doit être contrôlé manuellement`)
    },
  })),
)
