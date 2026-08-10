import type { TRgaaFinding } from '../../types'

export const findings: TRgaaFinding[] = [
  {
    criterion: '10.13',
    status: 'NT',
    location: 'src/components/tooltip-hover-only.tsx ; accommodation-residence.tsx',
    observation:
      "L'infobulle du bloc résidence est désormais portée par un <button> focusable doté d'un aria-label. Reste à vérifier au rendu son affichage au focus clavier et sa fermeture par Échap.",
    tests: ['10.13.1'],
  },
  {
    criterion: '4.1',
    status: 'NC',
    priority: 'P2',
    location: 'src/app/(public)/trouver-un-logement-etudiant/ville/[location]/[slug]/accommodation-virtual-tour.tsx',
    observation:
      "Lorsque la visite virtuelle est une vidéo, elle est rendue par <video controls> sans aucune balise <track> : ni sous-titres, ni transcription, ni audiodescription. Aucun champ de la base ne permet aujourd'hui de rattacher un fichier de sous-titres à une résidence : la correction ne peut pas être purement technique.",
    remediation:
      'Ajouter au modèle de données un champ de fichier de sous-titres (WebVTT) alimenté depuis l\'espace gestionnaire, le rendre en <track kind="captions" srclang="fr" default>, et exiger une transcription textuelle ; tant que ces éléments ne sont pas garantis, ne pas publier de vidéo.',
    tests: ['4.1.1'],
  },
  {
    criterion: '1.3',
    status: 'C',
    location: 'src/components/map/accomodation-map.tsx ; messages/fr.json (map.markerLabel)',
    observation:
      "Le marqueur de la carte de localisation héritait de l'alternative par défaut de Leaflet, « Marker » : un mot anglais nommant le composant technique. Il porte désormais un intitulé traduit décrivant ce qu'il désigne. Les autres images de la page ont des alternatives pertinentes — photos numérotées « Photo n sur 10 de la résidence X », logo du gestionnaire nommé, visuels de décoration à alt vide.",
    tests: ['1.3.1'],
  },
]
