import type { TRgaaFinding } from '../../types'

/**
 * Constats portant sur le gabarit commun (en-tête, pied de page, navigation, modales).
 * Ils sont propagés dans toutes les feuilles page, préfixés « [gabarit] ».
 *
 * N'y placer qu'un défaut réellement présent sur *chaque* page : un constat propagé écrase
 * le verdict des analyseurs, y compris le « Non applicable » prononcé faute d'objet dans le
 * DOM. Un défaut localisé dans un composant d'une seule page appartient au fichier de cette
 * page — sans quoi il condamne tout le site et fausse les taux de conformité.
 */
export const findings: TRgaaFinding[] = [
  {
    criterion: '11.10',
    status: 'NT',
    location: 'src/components/ui/required-mark.tsx ; src/components/ui/toggle-switch.tsx',
    observation:
      "Les deux défauts structurels sont corrigés. L'astérisque est masqué aux technologies d'assistance et doublé de la mention « (obligatoire) », chaque champ obligatoire porte aria-required, et la mention « les champs suivis d'un astérisque sont obligatoires » figure en tête des quatre formulaires concernés. Les interrupteurs passent par un composant maison qui impose une description : le ToggleSwitch de react-dsfr pose aria-describedby sans rendre l'élément décrit lorsque helperText est absent, ce qui produisait des références ARIA orphelines. Reste à tester manuellement ce que le critère vise réellement : la pertinence des messages d'erreur et des suggestions de correction à la saisie.",
    tests: ['11.10.1', '11.10.2', '11.10.3'],
  },
  {
    criterion: '9.1',
    status: 'NT',
    location: 'src/components/ui/header/mega-menu.tsx ; main-navigation.tsx ; dropdown.tsx',
    observation:
      "Les quatre titres vides que le gabarit émettait sur chaque page sont corrigés, et le saut de hiérarchie qui subsistait l'est aussi. Le DSFR rendait les intitulés de colonnes du méga-menu en <h5> codés en dur, juste après le <h1> de la modale de paramètres d'affichage : le plan de chaque page sautait de h1 à h5. Le composant a été repris avec une prop `as` ; les remonter en <h2> s'est révélé pire — ils précédaient alors le <h1> de la page — et ils sont désormais rendus en <p>, hors du plan de titres. Une colonne de méga-menu est un groupe de liens dans un <nav> déjà nommé, pas une section de contenu. Le relevé du run confirme un plan sans saut ni entrée parasite. Reste à juger manuellement la pertinence des intitulés de titres de chaque page.",
    tests: ['9.1.1'],
  },
  {
    criterion: '6.1',
    status: 'NT',
    location: 'Relevé - liens, feuille du run',
    observation:
      "Les 140 intitulés de liens distincts du site ont été relus dans le cahier de relevés : aucun n'est vide, aucun ne recourt aux formulations creuses habituelles (« en savoir plus », « cliquez ici », « lire la suite », « voir »). Un point reste à trancher au lecteur d'écran : dix noms de villes — Paris, Lyon, Bordeaux, Lille… — servent d'intitulé à deux liens de destinations différentes, /preparer-sa-vie-etudiante/<ville> dans le méga-menu et /trouver-un-logement-etudiant/ville/<Ville> dans la section villes de l'accueil. Le contexte de liste les distingue en principe ; reste à confirmer que la restitution le rend perceptible.",
    tests: ['6.1.1', '6.1.2', '6.1.3', '6.1.4', '6.1.5'],
  },
  {
    criterion: '12.1',
    status: 'C',
    location: 'src/components/ui/header/navigation.tsx ; footer.tsx ; common-skip-links.tsx',
    observation:
      "Le relevé des dix-sept écrans du run montre, sur chacun, au moins deux systèmes de navigation distincts : le menu principal de l'en-tête et la navigation du pied de page, complétés par des liens d'évitement et, dans l'espace étudiant comme sur les fiches, par un fil d'Ariane. Le critère demande au moins deux systèmes parmi menu, plan du site et moteur de recherche : la condition est remplie sur toutes les pages de l'échantillon.",
    tests: ['12.1.1'],
  },
  {
    criterion: '12.4',
    status: 'C',
    location: 'src/components/ui/footer/footer.tsx',
    observation:
      "Le lien vers la page « Plan du site » figure dans le pied de page des dix-sept écrans du run, à la même place et au même rang dans le code. Il est donc atteignable de manière identique dans toutes les pages de l'échantillon.",
    tests: ['12.4.1'],
  },
  {
    criterion: '12.5',
    status: 'NT',
    location: 'src/components/home/hero-section/hero-search-bar.tsx ; find-student-accomodation/',
    observation:
      "Un seul écran de l'échantillon porte un moteur de recherche au sens du balisage : l'accueil, avec un role=\"search\" et un input[type=search] correctement étiquetés. La recherche de logement, elle, s'opère sur sa propre page via un champ de localisation en saisie libre, sans rôle de recherche déclaré. Reste à trancher avec l'équipe ce qui constitue « le moteur de recherche » du site : si c'est la recherche de logement, elle est atteignable de façon identique par le menu principal présent partout ; si c'est la barre de l'accueil, elle n'est pas reprise ailleurs.",
    tests: ['12.5.1'],
  },
]
