import type { TRgaaFinding } from '../../types'

export const findings: TRgaaFinding[] = [
  {
    criterion: '7.3',
    status: 'NT',
    location: 'src/components/find-student-accomodation/card/find-student-accomodation-card.tsx',
    observation:
      "La carte de résultat utilise désormais le motif « lien étiré » du DSFR : le titre est un vrai lien vers la fiche et sa zone de clic couvre la carte. Le bouton favori et le tag de ville de la zone start repassent au-dessus du recouvrement par z-index. À confirmer au clavier : l'ordre de tabulation carte / favori et l'absence de piège.",
    tests: ['7.3.1'],
  },
  {
    criterion: '10.13',
    status: 'NT',
    location: 'src/components/tooltip-hover-only.tsx ; find-student-accessible-accomodation-switch.tsx',
    observation:
      'Les deux infobulles de la page sont corrigées : le déclencheur maison passe de <i> non focusable à <button> doté d\'un aria-label, et l\'infobulle du filtre « logements accessibles » passe de Tooltip kind="hover" à kind="click", que le DSFR rend en <button>. Reste à vérifier au rendu l\'affichage au focus et la fermeture par Échap.',
    tests: ['10.13.1'],
  },
  {
    criterion: '1.3',
    status: 'C',
    location: 'src/components/find-student-accomodation/card/find-student-accommodation-image-card.tsx',
    observation:
      "La photo de chaque carte recevait le nom de la résidence en alternative, alors que le titre de la carte le porte déjà juste en dessous : un lecteur d'écran annonçait deux fois le même nom par carte. Elle est désormais décorative, comme l'était déjà le visuel de remplacement du même fichier, et le prop name devenu inutile a été retiré du composant et de ses trois appels pour que la duplication ne puisse pas revenir. Les alternatives restantes de la page — marqueurs de carte portant le nom de la résidence pointée — décrivent bien ce qu'elles désignent.",
    tests: ['1.3.1'],
  },
]
