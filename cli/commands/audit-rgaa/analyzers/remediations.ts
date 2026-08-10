import type { TRgaaPriority } from '../types'

/**
 * Priorité et résolution attachées à chaque non-conformité détectée automatiquement.
 * Une non-conformité sans résolution actionnable n'a pas sa place dans le classeur :
 * l'assertion correspondante de verify.ts fait échouer la commande si une entrée manque.
 */
export const AUTO_REMEDIATIONS: Record<string, { priority: TRgaaPriority; remediation: string }> = {
  '1.1': {
    priority: 'P1',
    remediation:
      'Doter chaque élément graphique porteur d\'information d\'une alternative textuelle : attribut alt sur les <img>, <title> + role="img" sur les <svg>, aria-label sur les composants graphiques. Les éléments purement décoratifs prennent alt="" ou aria-hidden="true".',
  },
  '1.2': {
    priority: 'P3',
    remediation:
      'Une image de décoration doit être totalement ignorée : alt="" sans title ni aria-label, ou aria-hidden="true". Supprimer les attributs contradictoires.',
  },
  '2.1': {
    priority: 'P2',
    remediation: 'Ajouter un attribut title décrivant le contenu de chaque cadre (<iframe>, <frame>).',
  },
  '2.2': {
    priority: 'P3',
    remediation: 'Remplacer les titres de cadre génériques par un intitulé décrivant réellement le contenu du cadre.',
  },
  '3.2': {
    priority: 'P1',
    remediation:
      "Porter chaque couple texte/fond au moins à 4,5:1 (3:1 pour un texte de 24px, ou 18,5px en gras) en s'appuyant sur les couleurs de la palette DSFR, dont les décisions garantissent ces seuils.",
  },
  '3.3': {
    priority: 'P2',
    remediation:
      "Porter à au moins 3:1 le contraste des composants d'interface et des éléments graphiques porteurs d'information, dans tous leurs états (repos, survol, focus, désactivé exclu).",
  },
  '5.4': { priority: 'P2', remediation: 'Associer le titre du tableau via une balise <caption> enfant direct du <table>.' },
  '5.6': {
    priority: 'P2',
    remediation:
      'Structurer les en-têtes de colonnes et de lignes avec des balises <th> (ou role="columnheader"/"rowheader") plutôt que des <td>.',
  },
  '5.7': {
    priority: 'P2',
    remediation:
      'Corriger les valeurs de scope (row, col, rowgroup, colgroup uniquement) et faire pointer chaque attribut headers vers un id existant dans le tableau.',
  },
  '5.8': {
    priority: 'P3',
    remediation:
      "Retirer <caption>, <th>, <thead>, <tfoot> et l'attribut summary des tableaux de mise en forme, ou les convertir en véritables tableaux de données.",
  },
  '6.1': {
    priority: 'P2',
    remediation:
      'Rendre chaque intitulé de lien explicite hors contexte, ou compléter son nom accessible (aria-label, ou complément visuellement masqué) avec la cible réelle du lien.',
  },
  '6.2': {
    priority: 'P1',
    remediation: "Donner un intitulé à chaque lien : contenu textuel, aria-label ou texte alternatif de l'image contenue.",
  },
  '8.1': { priority: 'P2', remediation: 'Déclarer <!DOCTYPE html> en toute première ligne du document, avant la balise <html>.' },
  '8.3': {
    priority: 'P1',
    remediation: "Renseigner l'attribut lang sur la balise <html> avec le code de la langue principale de la page.",
  },
  '8.4': {
    priority: 'P1',
    remediation:
      "Faire correspondre le code de langue déclaré au contenu réellement servi : traduire le contenu, ou ne pas servir la locale tant que sa traduction n'existe pas.",
  },
  '8.5': { priority: 'P2', remediation: 'Déclarer une unique balise <title> non vide dans le <head> de chaque page.' },
  '8.8': { priority: 'P3', remediation: "Corriger les codes de langue pour qu'ils respectent la syntaxe BCP 47 (« fr », « en-US »…)." },
  '8.9': {
    priority: 'P3',
    remediation:
      'Ne pas détourner les balises de leur fonction sémantique : utiliser CSS pour la présentation, et réserver <table> aux données tabulaires.',
  },
  '8.10': { priority: 'P3', remediation: 'Signaler chaque changement de sens de lecture avec un attribut dir valant ltr, rtl ou auto.' },
  '9.1': {
    priority: 'P2',
    remediation:
      "Rétablir une hiérarchie de titres continue : un seul <h1>, aucun saut de niveau, et de vraies balises hx pour tout passage de texte faisant office de titre (l'apparence se règle avec les classes utilitaires DSFR fr-h1 à fr-h6).",
  },
  '9.2': {
    priority: 'P2',
    remediation: 'Structurer la page avec une zone <main> unique, un en-tête et un pied de page de premier niveau uniques.',
  },
  '9.3': {
    priority: 'P3',
    remediation: "N'utiliser que des <li> en enfants directs de <ul>/<ol>, et n'employer <dt>/<dd> qu'à l'intérieur d'un <dl>.",
  },
  '10.1': {
    priority: 'P3',
    remediation:
      'Supprimer du code généré les balises et attributs de présentation obsolètes et confier la présentation aux feuilles de styles.',
  },
  '10.4': {
    priority: 'P2',
    remediation:
      'Rendre la mise en page adaptable : largeurs en unités relatives, conteneurs sans largeur fixe en pixels, et absence de meta viewport interdisant le zoom. Le contenu doit rester intégralement atteignable à 200 %.',
  },
  '10.5': {
    priority: 'P3',
    remediation:
      "Déclarer systématiquement une couleur de fond en même temps qu'une couleur de police, afin que le texte reste lisible si l'utilisateur impose ses propres couleurs.",
  },
  '10.6': {
    priority: 'P2',
    remediation:
      "Distinguer chaque lien au sein d'un texte autrement que par la couleur : soulignement, graisse ou fond différent, et rappel visuel au survol comme à la prise de focus.",
  },
  '10.7': {
    priority: 'P2',
    remediation:
      "Ne jamais supprimer l'indicateur de focus : conserver le style :focus-visible du DSFR, ou fournir un indicateur de remplacement au moins aussi visible.",
  },
  '10.11': {
    priority: 'P2',
    remediation:
      'Supprimer le défilement horizontal à 320 px : largeurs fluides, images en max-width: 100%, tableaux et blocs de code dans un conteneur à défilement propre.',
  },
  '10.12': {
    priority: 'P3',
    remediation:
      'Éviter les hauteurs fixes sur les blocs de texte afin que le contenu reste lisible avec les espacements imposés (interlignage 1,5 ; lettres 0,12em ; mots 0,16em ; paragraphes 2em).',
  },
  '11.1': {
    priority: 'P1',
    remediation:
      "Associer une étiquette à chaque champ : <label for> pointant sur l'id du champ, ou aria-label/aria-labelledby. Un placeholder ne tient jamais lieu d'étiquette.",
  },
  '11.5': {
    priority: 'P2',
    remediation: 'Regrouper les boutons radio et cases à cocher de même nature dans un <fieldset> ou un role="group".',
  },
  '11.6': { priority: 'P2', remediation: "Doter chaque <fieldset> d'une <legend> décrivant le regroupement." },
  '11.8': { priority: 'P3', remediation: "Renseigner l'attribut label de chaque <optgroup>." },
  '11.10': {
    priority: 'P2',
    remediation:
      'Faire pointer chaque référence ARIA (aria-describedby, aria-labelledby, aria-errormessage) vers un identifiant réellement présent dans la page.',
  },
  '11.13': {
    priority: 'P2',
    remediation:
      "Renseigner l'attribut autocomplete avec la valeur normalisée correspondante (name, given-name, family-name, email, tel, postal-code, address-level2…) sur les champs collectant des informations relatives à l'utilisateur.",
  },
  '12.6': {
    priority: 'P2',
    remediation:
      'Identifier chaque zone de regroupement par la balise HTML5 correspondante (<header>, <nav>, <main>, <footer>) ou son rôle ARIA.',
  },
  '12.7': {
    priority: 'P1',
    remediation:
      "Ajouter un lien d'évitement en premier élément focusable de la page, pointant vers l'identifiant de la zone de contenu principal, et vérifier que cette cible existe.",
  },
  '12.8': { priority: 'P2', remediation: "Supprimer les tabindex positifs et laisser l'ordre de tabulation suivre l'ordre du DOM." },
  '13.1': {
    priority: 'P2',
    remediation:
      "Supprimer les rafraîchissements automatiques différés, ou donner à l'utilisateur le moyen de les arrêter, de les relancer ou d'en allonger le délai.",
  },
  '12.9': {
    priority: 'P1',
    remediation:
      'Toute modale confinant le focus doit offrir une sortie au clavier : fermeture par Échap et bouton de fermeture atteignable par tabulation, avec retour du focus au déclencheur.',
  },
  '12.11': {
    priority: 'P1',
    remediation:
      "Rendre chaque contenu additionnel activable au clavier depuis son déclencheur (Entrée ou Espace), et s'assurer qu'il expose au moins un élément atteignable par tabulation une fois ouvert.",
  },
  '13.8': {
    priority: 'P2',
    remediation:
      "Fournir une commande d'arrêt, de relance ou de masquage pour tout contenu en mouvement ou clignotant durant plus de cinq secondes, et ne jamais démarrer un média automatiquement.",
  },
  '13.2': {
    priority: 'P2',
    remediation: "Signaler l'ouverture d'une nouvelle fenêtre dans le nom accessible du lien (mention « nouvelle fenêtre »).",
  },
  '13.3': {
    priority: 'P3',
    remediation: 'Fournir une version accessible de chaque document en téléchargement, ou une alternative en HTML.',
  },
}
