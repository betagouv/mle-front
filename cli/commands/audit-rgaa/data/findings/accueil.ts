import type { TRgaaFinding } from '../../types'

export const findings: TRgaaFinding[] = [
  {
    criterion: '7.1',
    status: 'NT',
    location: 'src/components/home/hero-section/hero-search-bar.tsx',
    observation:
      "Le champ de recherche n'implémente pas le motif combobox : les suggestions sont désormais rendues en liste de liens, nativement focusables et activables au clavier, et leur nombre est annoncé par une région live. C'est un motif HTML standard, valide, mais l'absence d'aria-expanded sur le champ reste à confronter au rendu réel avec un lecteur d'écran.",
    tests: ['7.1.1', '7.1.2'],
  },
  {
    criterion: '9.1',
    status: 'NT',
    location: 'src/components/faq/faq-questions-answers.tsx',
    observation:
      "Le contenu des réponses de la FAQ est injecté via dangerouslySetInnerHTML. Il est désormais sanitisé par sanitizeEditorialHTML, dont la liste blanche exclut les balises hx : le plan de la page ne peut plus être perturbé par la saisie éditoriale. Reste à vérifier au rendu que la sanitisation n'altère pas les contenus publiés.",
    tests: ['9.1.1'],
  },
  {
    criterion: '1.1',
    status: 'C',
    location: 'Relevé - images, feuille du run',
    observation:
      'Les 28 éléments graphiques de la page ont été repris un par un dans le cahier de relevés : illustrations de section et visuels de carte portent alt="", logos partenaires et logos d\'aides portent un intitulé. Aucune image ne reste sans alternative, et la nature attribuée à chacune correspond à son rôle réel dans la page. La pertinence des intitulés relève du critère 1.3.',
    tests: ['1.1.1'],
  },
  {
    criterion: '1.2',
    status: 'C',
    location: 'src/components/home/cities/cities.tsx',
    observation:
      "L'illustration de la section « villes populaires » était déclarée porteuse d'information par un alt descriptif alors qu'elle n'apporte rien à la compréhension de la section. Elle porte désormais alt=\"\", et les deux clés illustrationAlt devenues orphelines ont été retirées des deux langues. Toutes les autres images de décoration de la page — visuels de section, illustrations de carte — portaient déjà un alt vide sans attribut concurrent, ce que le cahier de relevés confirme image par image.",
    tests: ['1.2.1'],
  },
]
